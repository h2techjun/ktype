// 언어 무관 타이핑 엔진. 한글(두벌식 IME 조합)과 영문(직접 문자 입력)을 하나의
// 인터페이스로 추상화해 게임/연습 로직이 언어에 상관없이 동작하게 한다.

import {
  EMPTY_IME,
  applyJamo,
  applyLiteral,
  applyBackspace,
  imeText,
  jamoSequence,
  type ImeState,
} from "../hangul/ime";
import { keyToJamo } from "../hangul/dubeolsik";
import {
  CJI_VOWELS,
  CJI_VOWEL_PREFIXES,
  CJI_CONSONANT_CYCLE,
  isCjiVowelKey,
  isCjiConsonantKey,
} from "../hangul/cheonjiin";

export type Lang = "ko" | "en";

/** 모바일 자판(천지인) 조합 상태.
 *
 *  jamos = 지금까지 확정된 자모·리터럴 시퀀스. 천지인은 같은 키를 다시 눌러
 *  "직전에 넣은 자모를 다른 자모로 바꾸는" 입력이라, 조합 결과(ImeState)만으로는
 *  되돌릴 수 없다. 그래서 입력 원본인 자모 시퀀스를 따로 들고 매번 재구성한다.
 *  물리 키보드 입력도 여기에 함께 기록해, 두 입력을 섞어 써도 어긋나지 않는다. */
export interface TapState {
  jamos: string[];
  /** 조합 중인 모음 탭 시퀀스(예: "ㆍㅡ") */
  seq: string;
  /** 조합 중인 자음 키(예: "ㄱㅋ") */
  key: string | null;
  /** 자음 키 반복 탭 위치 */
  cycle: number;
  lastMs: number;
}

export const EMPTY_TAP: TapState = { jamos: [], seq: "", key: null, cycle: 0, lastMs: 0 };

export interface TypeState {
  lang: Lang;
  ime: ImeState; // ko: 두벌식 조합 상태
  buf: string; // en: 입력 문자 버퍼
  tap: TapState; // ko: 천지인 자판 조합 상태
}

export function emptyType(lang: Lang): TypeState {
  return { lang, ime: EMPTY_IME, buf: "", tap: EMPTY_TAP };
}

/** 현재까지 입력한 텍스트. */
export function typeText(s: TypeState): string {
  return s.lang === "ko" ? imeText(s.ime) : s.buf;
}

/** 코퍼스에 등장하는 문장부호(ko·en 공통). 한글 문장의 마침표·물음표도 여기서 처리한다. */
const PUNCT = /^[.,!?;:'"()[\]{}<>/\\@#%&*+=_~`^$|-]$/;
const EN_TYPABLE = /^[a-zA-Z0-9]$/;

/** 이 키가 타이핑 입력으로 쓰이는가(물리 키보드 가드 · 가상 자판 공통). */
export function isTypableKey(lang: Lang, code: string, key: string, shift: boolean): boolean {
  if (key === "Backspace" || key === " " || code === "Space") return true;
  if (PUNCT.test(key)) return true;
  return lang === "en" ? EN_TYPABLE.test(key) : keyToJamo(code, shift) !== null;
}

/** 자모·리터럴 시퀀스로부터 조합 상태를 처음부터 다시 만든다(천지인 재구성용). */
function rebuildIme(jamos: string[]): ImeState {
  let s = EMPTY_IME;
  for (const j of jamos) s = applyJamo(s, j); // applyJamo 는 비자모를 리터럴로 처리
  return s;
}

/** 물리 키 입력을 천지인 자모 기록에도 반영. 두 입력 경로를 섞어 써도 어긋나지 않게 한다. */
function withJamo(t: TapState, jamo: string): TapState {
  return { jamos: [...t.jamos, jamo], seq: "", key: null, cycle: 0, lastMs: t.lastMs };
}

/** 물리 키 하나 적용. */
export function applyType(s: TypeState, code: string, key: string, shift: boolean): TypeState {
  if (key === "Backspace") {
    return s.lang === "ko"
      ? { ...s, ime: applyBackspace(s.ime), tap: { ...s.tap, jamos: s.tap.jamos.slice(0, -1), seq: "", key: null, cycle: 0 } }
      : { ...s, buf: s.buf.slice(0, -1) };
  }

  if (s.lang === "ko") {
    const jamo = keyToJamo(code, shift);
    if (jamo) return { ...s, ime: applyJamo(s.ime, jamo), tap: withJamo(s.tap, jamo) };
    if (key === " " || code === "Space") return { ...s, ime: applyLiteral(s.ime, " "), tap: withJamo(s.tap, " ") };
    // 문장부호 — 조합을 확정하고 리터럴로 추가(한글 문장의 . ? , 등)
    if (PUNCT.test(key)) return { ...s, ime: applyLiteral(s.ime, key), tap: withJamo(s.tap, key) };
    return s;
  }

  // en — 알파벳·숫자·공백·문장부호를 그대로 버퍼에 추가
  if (key === " " || code === "Space") return { ...s, buf: s.buf + " " };
  if (EN_TYPABLE.test(key) || PUNCT.test(key)) return { ...s, buf: s.buf + key };
  return s;
}

/** 입력이 목표의 접두인지(받침 이동 포함 ko / 대소문자 무시 en). */
export function textPrefixMatches(typed: string, target: string, lang: Lang): boolean {
  if (typed === "") return false;
  if (lang === "en") {
    return target.toLowerCase().startsWith(typed.toLowerCase());
  }
  const t = jamoSequence(typed);
  const g = jamoSequence(target);
  if (t.length > g.length) return false;
  return t.every((j, i) => g[i] === j);
}

/** 완주 판정. en=대소문자 무시 일치. ko=자모 시퀀스 완전 일치 —
 *  오타 복구 후 조합 경계가 달라져도("고ㅏ" vs "과") 친 자모가 목표와 같으면 완주로 인정. */
export function textComplete(typed: string, target: string, lang: Lang): boolean {
  if (lang === "en") return typed.toLowerCase() === target.toLowerCase();
  const t = jamoSequence(typed);
  const g = jamoSequence(target);
  return t.length === g.length && t.every((j, i) => g[i] === j);
}

/** 오타 여부 — 지금까지 친 것이 목표의 접두가 아니면 오타.
 *
 *  천지인은 모음을 여러 탭으로 쌓아 올리므로, 정타를 치는 도중에도 중간 글자가
 *  목표와 달라진다(ㅏ 를 만들려면 ㅣ 를 먼저 눌러 "이"를 거친다). 그 중간 상태를
 *  오타로 세면 정확도가 실제보다 낮게 나오고 오답 효과음까지 울린다.
 *  그래서 모음 조합이 진행 중일 때는 마지막 글자의 판정을 유예한다. */
export function hasTypeError(s: TypeState, target: string): boolean {
  const typed = typeText(s);
  if (typed === "") return false;
  // 천지인 조합이 진행 중이면 마지막 글자는 아직 완성 전이다. 앞 글자들만 검사하고,
  // 진짜 오타는 다음 자모로 넘어가 확정되는 순간 잡힌다(피드백이 한 박자 늦을 뿐,
  // 정타에 오답 표시가 뜨는 쪽이 훨씬 나쁘다).
  if (s.lang === "ko" && (s.tap.seq !== "" || s.tap.key !== null)) {
    const cells = Array.from(typed);
    const settled = cells.slice(0, -1).join("");
    if (settled === "") return false;
    return !textPrefixMatches(settled, target, s.lang);
  }
  return !textPrefixMatches(typed, target, s.lang);
}

/** 정확히 입력된 셀(음절/문자) 개수 — 콤보·진행 계산용. */
export function correctCells(typed: string, target: string, lang: Lang): number {
  const t = Array.from(typed);
  const g = Array.from(target);
  let n = 0;
  for (let i = 0; i < Math.min(t.length, g.length); i++) {
    const a = lang === "en" ? t[i].toLowerCase() : t[i];
    const b = lang === "en" ? g[i].toLowerCase() : g[i];
    if (a === b) n++;
    else break;
  }
  return n;
}

/** 확정된(조합 안 걸린) 셀 개수 — 커서 위치. ko=committed 음절, en=버퍼 전체. */
export function committedCount(s: TypeState): number {
  return s.lang === "ko" ? Array.from(s.ime.committed).length : Array.from(s.buf).length;
}

// ── 천지인 자판 입력 ────────────────────────────────────────────────────

/** 같은 자음 키를 "반복 탭(순환)"으로 볼지, "새 글자"로 볼지 가르는 시간.
 *  천지인에는 커서 이동 키가 없어, 같은 키가 연달아 필요한 글자(예: 종성 ㄱ 다음
 *  초성 ㄱ)는 실제 휴대전화에서도 이 대기 시간으로 구분한다. */
export const TAP_TIMEOUT_MS = 700;

/** 천지인 자판 탭 하나 적용. tap 은 키 식별자("ㅣ" "ㆍ" "ㄱㅋ" …) 또는
 *  "Backspace" · " " · 문장부호. nowMs 는 반복 탭 판정에만 쓰인다. */
export function applyTap(s: TypeState, tap: string, nowMs: number): TypeState {
  if (s.lang !== "ko") return s;
  const t = s.tap;
  const commit = (jamos: string[], next: Partial<TapState>): TypeState => ({
    ...s,
    ime: rebuildIme(jamos),
    tap: { jamos, seq: "", key: null, cycle: 0, lastMs: nowMs, ...next },
  });

  if (tap === "Backspace") return commit(t.jamos.slice(0, -1), {});
  if (tap === " ") return commit([...t.jamos, " "], {});

  // 커서 이동(→) — 글자는 그대로 두고 조합만 끊는다.
  // 천지인은 같은 키가 연달아 필요한 글자("안"+"녕"의 ㄴ,ㄴ)를 반복 탭과 구분할
  // 방법이 시간차뿐이라, 실제 휴대전화처럼 명시적으로 끊는 키가 필요하다.
  if (tap === "Commit") {
    return { ...s, tap: { ...t, seq: "", key: null, cycle: 0, lastMs: nowMs } };
  }

  if (isCjiVowelKey(tap)) {
    const cand = t.seq + tap;
    // 조합을 이어갈 수 있으면 이어간다. 이미 모음을 내놓은 상태였다면 그 자리를 교체.
    if (t.seq !== "" && CJI_VOWEL_PREFIXES.has(cand)) {
      const extended = CJI_VOWELS[cand];
      // 아직 완성 모음이 아닌 중간 단계("ㆍㆍ") — 글자는 그대로 두고 시퀀스만 연장
      if (extended === undefined) {
        return { ...s, tap: { ...t, seq: cand, key: null, cycle: 0, lastMs: nowMs } };
      }
      const emitted = CJI_VOWELS[t.seq] !== undefined;
      const base = emitted ? t.jamos.slice(0, -1) : t.jamos;
      return commit([...base, extended], { seq: cand });
    }
    const single = CJI_VOWELS[tap];
    // "ㆍ" 단독은 아직 완성 모음이 아니다 — 조합 시퀀스만 시작하고 글자는 그대로.
    if (single === undefined) return { ...s, tap: { ...t, seq: tap, key: null, cycle: 0, lastMs: nowMs } };
    return commit([...t.jamos, single], { seq: tap });
  }

  if (isCjiConsonantKey(tap)) {
    const cycle = CJI_CONSONANT_CYCLE[tap];
    const repeat = t.key === tap && nowMs - t.lastMs <= TAP_TIMEOUT_MS;
    if (repeat) {
      const idx = (t.cycle + 1) % cycle.length;
      return commit([...t.jamos.slice(0, -1), cycle[idx]], { key: tap, cycle: idx });
    }
    return commit([...t.jamos, cycle[0]], { key: tap, cycle: 0 });
  }

  if (PUNCT.test(tap)) return commit([...t.jamos, tap], {});
  return s;
}

/** 백스페이스(엔진 무관 편의). */
export { applyBackspace } from "../hangul/ime";
