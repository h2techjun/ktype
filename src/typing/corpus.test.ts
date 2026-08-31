import { describe, it, expect } from "vitest";
import { KO_STAGES, EN_STAGES } from "../data";
import { GAME_WORDS, EN_GAME_WORDS } from "../arcade/words";
import { DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { jamoSequence } from "../hangul/ime";
import { cjiStrokesFor } from "../hangul/cheonjiin";
import {
  emptyType,
  applyType,
  applyTap,
  typeText,
  textComplete,
  hasTypeError,
  isTypableKey,
  TAP_TIMEOUT_MS,
  type Lang,
  type TypeState,
} from "./engine";

// 코퍼스 완주 가능성 전수 검증.
//
// 이 파일이 존재하는 이유: "빌드 통과 + 단위 테스트 통과"인데도 한글 문장의
// 마침표를 입력할 수 없어 짧은글·긴글 스테이지를 아무도 완주하지 못한 사고가 있었다.
// 개별 함수 테스트는 다 초록불이었지만, "코퍼스의 실제 문장을 처음부터 끝까지 쳐서
// 완주가 되는가"를 확인하는 테스트가 없었다. 그래서 여기서 전 항목을 실제로 친다.

/** 자모 → 물리 키(두벌식 역매핑). */
const JAMO_TO_KEY: Record<string, { code: string; shift: boolean }> = {};
for (const [code, cap] of Object.entries(DUBEOLSIK_LAYOUT)) {
  if (!(cap.normal in JAMO_TO_KEY)) JAMO_TO_KEY[cap.normal] = { code, shift: false };
  if (cap.shift && !(cap.shift in JAMO_TO_KEY)) JAMO_TO_KEY[cap.shift] = { code, shift: true };
}

interface Stroke {
  code: string;
  key: string;
  shift: boolean;
}

/** 목표 텍스트를 정타로 치는 키 시퀀스. */
function strokesFor(text: string, lang: Lang): Stroke[] {
  if (lang === "en") {
    return Array.from(text).map((ch) => ({
      code: /[a-zA-Z]/.test(ch) ? `Key${ch.toUpperCase()}` : ch === " " ? "Space" : "Punct",
      key: ch,
      shift: false,
    }));
  }
  return jamoSequence(text).map((j) => {
    const k = JAMO_TO_KEY[j];
    if (k) return { code: k.code, key: "", shift: k.shift };
    return { code: j === " " ? "Space" : "Punct", key: j, shift: false };
  });
}

/** 시퀀스를 전부 적용한 최종 상태와, 도중에 오타 판정이 난 지점. */
function typeAll(text: string, lang: Lang): { state: TypeState; errorAt: number | null; rejected: number | null } {
  let s = emptyType(lang);
  let errorAt: number | null = null;
  let rejected: number | null = null;
  const strokes = strokesFor(text, lang);

  strokes.forEach((k, i) => {
    if (!isTypableKey(lang, k.code, k.key, k.shift)) {
      if (rejected === null) rejected = i; // 물리 키보드 가드가 막는 키
      return;
    }
    const next = applyType(s, k.code, k.key, k.shift);
    if (next === s && rejected === null) rejected = i; // 엔진이 무시한 키
    s = next;
    if (errorAt === null && hasTypeError(s, text)) errorAt = i;
  });

  return { state: s, errorAt, rejected };
}

interface Case {
  label: string;
  text: string;
  lang: Lang;
}

const CASES: Case[] = [
  ...KO_STAGES.flatMap((st) =>
    st.items.map((it) => ({ label: `ko/${st.id}: ${it.text}`, text: it.text, lang: "ko" as Lang })),
  ),
  ...EN_STAGES.flatMap((st) =>
    st.items.map((it) => ({ label: `en/${st.id}: ${it.text}`, text: it.text, lang: "en" as Lang })),
  ),
  ...GAME_WORDS.map((w) => ({ label: `arcade-ko: ${w.text}`, text: w.text, lang: "ko" as Lang })),
  ...EN_GAME_WORDS.map((w) => ({ label: `arcade-en: ${w.text}`, text: w.text, lang: "en" as Lang })),
];

describe("코퍼스 전수 — 모든 항목이 정타 시퀀스로 완주되는가", () => {
  it("검증 대상이 비어 있지 않다", () => {
    expect(CASES.length).toBeGreaterThan(300);
  });

  it.each(CASES)("$label", ({ text, lang }) => {
    const { state, errorAt, rejected } = typeAll(text, lang);
    expect({ rejected, errorAt, typed: typeText(state) }).toEqual({
      rejected: null,
      errorAt: null,
      typed: expect.anything(),
    });
    expect(textComplete(typeText(state), text, lang)).toBe(true);
  });
});

describe("천지인 전수 — 모든 한글 항목을 천지인 자판으로 완주할 수 있다", () => {
  // 모바일 사용자의 기본 입력 경로. 자모 하나라도 탭 시퀀스가 없거나 조합이
  // 어긋나면 그 항목은 폰에서 완주 불가가 된다.
  const KO_CASES = CASES.filter((c) => c.lang === "ko");

  /** 목표 텍스트를 천지인으로 정타 입력 — 실제 사용자처럼 쉬지 않고 빠르게 친다.
   *
   *  탭 간격을 반복 탭 판정(TAP_TIMEOUT_MS) 안에 두는 것이 핵심이다. 자모 사이마다
   *  시간을 벌려 주면 "안"+"녕"처럼 같은 키가 연달아 오는 지점(코퍼스에 25곳)이
   *  저절로 통과해 버려, 실사용에서 깨지는 것을 못 잡는다. 같은 키가 이어질 때는
   *  실제 휴대전화처럼 → 로 글자를 끊는다. */
  function tapAll(text: string): { state: TypeState; missing: string[]; falseErrors: string[] } {
    let s = emptyType("ko");
    let now = 0;
    const missing: string[] = [];
    const falseErrors: string[] = [];

    const step = (k: string) => {
      now += 60; // 사람이 빠르게 연타하는 간격 — 항상 반복 탭 판정 안쪽
      s = applyTap(s, k, now);
      // 정타만 치고 있으므로 오타 판정이 뜨면 그건 엔진의 잘못된 피드백이다.
      if (hasTypeError(s, text)) falseErrors.push(`${k} → "${typeText(s)}"`);
    };

    for (const jamo of jamoSequence(text)) {
      const strokes = cjiStrokesFor(jamo);
      if (!strokes) {
        // 자모가 아닌 것(공백·문장부호)은 그대로 하나의 탭
        if (!/\s|[.,!?;:'"]/.test(jamo)) missing.push(jamo);
        step(jamo === " " ? " " : jamo);
        continue;
      }
      // 직전에 누른 자음 키를 또 눌러야 하면 먼저 글자를 끊는다.
      if (s.tap.key !== null && s.tap.key === strokes[0]) step("Commit");
      strokes.forEach((k) => step(k));
    }
    return { state: s, missing, falseErrors };
  }

  it.each(KO_CASES)("$label", ({ text }) => {
    const { state, missing, falseErrors } = tapAll(text);
    expect(missing).toEqual([]);
    expect(falseErrors).toEqual([]);
    expect(typeText(state)).toBe(text);
  });
});

describe("천지인 — 화면 자판과 물리 키보드를 섞어 써도 결과가 같다", () => {
  // 태블릿처럼 두 입력이 공존하는 환경에서 조합 상태가 어긋나면 안 된다.
  const KO_CASES = CASES.filter((c) => c.lang === "ko").filter((_, i) => i % 11 === 0);

  it.each(KO_CASES)("$label", ({ text }) => {
    let s = emptyType("ko");
    let now = 0;
    const jamos = jamoSequence(text);

    jamos.forEach((jamo, idx) => {
      const strokes = cjiStrokesFor(jamo);
      // 홀수 번째 자모는 물리 키보드로, 짝수 번째는 천지인으로 입력한다.
      if (idx % 2 === 1 || !strokes) {
        const k = JAMO_TO_KEY[jamo];
        if (k) s = applyType(s, k.code, "", k.shift);
        else s = applyType(s, jamo === " " ? "Space" : "Punct", jamo, false);
        return;
      }
      strokes.forEach((k, i) => {
        now += i === 0 ? TAP_TIMEOUT_MS + 1 : 50;
        s = applyTap(s, k, now);
      });
    });

    expect(typeText(s)).toBe(text);
  });
});

describe("코퍼스 전수 — 어느 위치에서 오타를 내도 백스페이스로 복구된다", () => {
  // 실제 사용자는 반드시 오타를 낸다. 오타 → 백스페이스 → 재입력이 막히면
  // 그 항목은 사실상 완주 불가가 되고, 사용자는 이유도 모른 채 이탈한다.
  // 자음 오타와 모음 오타는 IME 경로가 달라 둘 다 넣는다.
  const WRONG: Record<Lang, Stroke[]> = {
    ko: [
      { code: "KeyQ", key: "", shift: false }, // ㅂ (자음)
      { code: "KeyY", key: "", shift: false }, // ㅛ (모음)
    ],
    en: [
      { code: "KeyZ", key: "z", shift: false },
      { code: "KeyQ", key: "q", shift: false },
    ],
  };

  it.each(CASES)("$label", ({ text, lang }) => {
    const strokes = strokesFor(text, lang);
    const broken: string[] = [];

    for (let at = 0; at <= strokes.length; at++) {
      for (const wrong of WRONG[lang]) {
        let s = emptyType(lang);
        strokes.forEach((k, i) => {
          if (i === at) {
            s = applyType(s, wrong.code, wrong.key, wrong.shift);
            s = applyType(s, "Backspace", "Backspace", false);
          }
          s = applyType(s, k.code, k.key, k.shift);
        });
        if (at === strokes.length) {
          // 마지막 타 이후에 오타를 내는 경우는 이미 완주 처리되므로 검사 대상 아님
          continue;
        }
        if (!textComplete(typeText(s), text, lang)) {
          broken.push(`stroke#${at}+${wrong.code} → "${typeText(s)}"`);
        }
      }
    }

    expect(broken).toEqual([]);
  });
});
