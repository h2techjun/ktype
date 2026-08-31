// 두벌식 한글 IME 오토마타. 자모 낱자 스트림을 받아 완성형으로 조합한다.
// OS IME 대신 자체 구현하는 이유: 초성+중성+종성이 합쳐지는 "조합 과정"을 UI 에
// 그대로 노출해 자모 조합 시각화를 하기 위함(게임 핵심).
//
// 상태 = 확정 텍스트(committed) + 조합 중 버퍼(composing).
//   composing.cho/jung: 인덱스(-1 = 없음),  composing.jong: 인덱스(0 = 받침 없음)

import { CHO, JUNG, JONG, composeSyllable, decomposeSyllable, isHangulSyllable } from "./syllable";

export interface Composing {
  cho: number; // CHO index, -1 = 없음
  jung: number; // JUNG index, -1 = 없음
  jong: number; // JONG index, 0 = 받침 없음
}

export interface ImeState {
  committed: string;
  composing: Composing | null;
}

export const EMPTY_IME: ImeState = { committed: "", composing: null };

// ── 자모 문자 → 인덱스 룩업 ──────────────────────────────────────────────
const CHO_IDX: Record<string, number> = {};
CHO.forEach((c, i) => (CHO_IDX[c] = i));
const JUNG_IDX: Record<string, number> = {};
JUNG.forEach((c, i) => (JUNG_IDX[c] = i));
const JONG_IDX: Record<string, number> = {};
JONG.forEach((c, i) => {
  if (c) JONG_IDX[c] = i;
});

// ── 겹받침 / 겹모음 조합·분해 맵 ────────────────────────────────────────
/** 종성 두 자음 → 결합 종성 */
const DOUBLE_JONG: Record<string, string> = {
  "ㄱㅅ": "ㄳ", "ㄴㅈ": "ㄵ", "ㄴㅎ": "ㄶ", "ㄹㄱ": "ㄺ", "ㄹㅁ": "ㄻ",
  "ㄹㅂ": "ㄼ", "ㄹㅅ": "ㄽ", "ㄹㅌ": "ㄾ", "ㄹㅍ": "ㄿ", "ㄹㅎ": "ㅀ", "ㅂㅅ": "ㅄ",
};
/** 결합 종성 → [남길 종성, 이동할 초성] */
const SPLIT_JONG: Record<string, [string, string]> = {
  "ㄳ": ["ㄱ", "ㅅ"], "ㄵ": ["ㄴ", "ㅈ"], "ㄶ": ["ㄴ", "ㅎ"], "ㄺ": ["ㄹ", "ㄱ"],
  "ㄻ": ["ㄹ", "ㅁ"], "ㄼ": ["ㄹ", "ㅂ"], "ㄽ": ["ㄹ", "ㅅ"], "ㄾ": ["ㄹ", "ㅌ"],
  "ㄿ": ["ㄹ", "ㅍ"], "ㅀ": ["ㄹ", "ㅎ"], "ㅄ": ["ㅂ", "ㅅ"],
};
/** 중성 두 모음 → 결합 중성 */
const DOUBLE_JUNG: Record<string, string> = {
  "ㅗㅏ": "ㅘ", "ㅗㅐ": "ㅙ", "ㅗㅣ": "ㅚ", "ㅜㅓ": "ㅝ", "ㅜㅔ": "ㅞ", "ㅜㅣ": "ㅟ", "ㅡㅣ": "ㅢ",
};
/** 결합 중성 → [남길 중성, 뒤 모음] */
const SPLIT_JUNG: Record<string, [string, string]> = {
  "ㅘ": ["ㅗ", "ㅏ"], "ㅙ": ["ㅗ", "ㅐ"], "ㅚ": ["ㅗ", "ㅣ"], "ㅝ": ["ㅜ", "ㅓ"],
  "ㅞ": ["ㅜ", "ㅔ"], "ㅟ": ["ㅜ", "ㅣ"], "ㅢ": ["ㅡ", "ㅣ"],
};

const isConsonant = (j: string): boolean => j in CHO_IDX;
const isVowel = (j: string): boolean => j in JUNG_IDX;

/** 조합 중 버퍼를 문자로 렌더링(완성형 또는 낱자). */
export function renderComposing(c: Composing | null): string {
  if (!c) return "";
  if (c.cho >= 0 && c.jung >= 0) return composeSyllable(c.cho, c.jung, c.jong);
  if (c.cho >= 0) return CHO[c.cho];
  if (c.jung >= 0) return JUNG[c.jung];
  return "";
}

/** 현재까지 입력된 전체 텍스트. */
export function imeText(s: ImeState): string {
  return s.committed + renderComposing(s.composing);
}

/** 조합 버퍼의 초성/중성/종성을 낱자 문자로. 없는 자리는 빈 문자열. (조합 시각화용) */
export function composingJamo(c: Composing | null): { cho: string; jung: string; jong: string } {
  if (!c) return { cho: "", jung: "", jong: "" };
  return {
    cho: c.cho >= 0 ? CHO[c.cho] : "",
    jung: c.jung >= 0 ? JUNG[c.jung] : "",
    jong: c.jong > 0 ? JONG[c.jong] : "",
  };
}

const isEmptyComposing = (c: Composing): boolean => c.cho < 0 && c.jung < 0 && c.jong === 0;

/** 조합 버퍼를 확정하고 새 버퍼로 교체한 상태 반환. */
export function commit(s: ImeState): ImeState {
  if (!s.composing) return s;
  return { committed: s.committed + renderComposing(s.composing), composing: null };
}

/** 자모 낱자 하나를 적용. */
export function applyJamo(s: ImeState, jamo: string): ImeState {
  if (isVowel(jamo)) return applyVowel(s, jamo);
  if (isConsonant(jamo)) return applyConsonant(s, jamo);
  return applyLiteral(s, jamo); // 자모가 아니면 리터럴 취급
}

function applyVowel(s: ImeState, jamo: string): ImeState {
  const v = JUNG_IDX[jamo];
  const c = s.composing;
  // 새 모음 시작(조합 없음 or 초성/중성 아무것도 없음)
  if (!c || (c.cho < 0 && c.jung < 0)) {
    return { committed: s.committed, composing: { cho: -1, jung: v, jong: 0 } };
  }
  // 초성만 있음 → 중성 결합
  if (c.cho >= 0 && c.jung < 0) {
    return { committed: s.committed, composing: { ...c, jung: v } };
  }
  // 종성 있음 → 종성이 다음 음절 초성으로 이동
  if (c.jong > 0) {
    const jongChar = JONG[c.jong];
    const split = SPLIT_JONG[jongChar];
    if (split) {
      const [keep, moveCho] = split;
      const committed = s.committed + composeSyllable(c.cho, c.jung, JONG_IDX[keep]);
      return { committed, composing: { cho: CHO_IDX[moveCho], jung: v, jong: 0 } };
    }
    const committed = s.committed + composeSyllable(c.cho, c.jung, 0);
    return { committed, composing: { cho: CHO_IDX[jongChar], jung: v, jong: 0 } };
  }
  // 중성 있고 종성 없음 → 겹모음 시도
  const combined = DOUBLE_JUNG[JUNG[c.jung] + jamo];
  if (combined) {
    return { committed: s.committed, composing: { ...c, jung: JUNG_IDX[combined] } };
  }
  // 겹모음 불가 → 현재 확정, 새 모음 낱자 시작
  const committed = s.committed + renderComposing(c);
  return { committed, composing: { cho: -1, jung: v, jong: 0 } };
}

function applyConsonant(s: ImeState, jamo: string): ImeState {
  const c = s.composing;
  const startNew = (): ImeState => ({
    committed: s.committed + (c ? renderComposing(c) : ""),
    composing: { cho: CHO_IDX[jamo], jung: -1, jong: 0 },
  });
  // 조합 없음 → 초성 시작
  if (!c || isEmptyComposing(c)) {
    return { committed: s.committed, composing: { cho: CHO_IDX[jamo], jung: -1, jong: 0 } };
  }
  // 초성만 있음(중성 없음) → 앞 자음 낱자 확정 후 새 초성
  if (c.cho >= 0 && c.jung < 0) return startNew();
  // 중성 있고 종성 없음 → 종성 결합(가능하면).
  // 단 초성이 없는 모음 낱자(ㅡ, ㅣ …)에는 종성을 붙일 수 없다. 붙이면 화면에는
  // 아무 변화가 없는데 내부 상태만 오염돼, 오타가 오타로 보이지 않는다.
  if (c.cho >= 0 && c.jung >= 0 && c.jong === 0) {
    if (jamo in JONG_IDX) {
      return { committed: s.committed, composing: { ...c, jong: JONG_IDX[jamo] } };
    }
    return startNew(); // ㄸㅃㅉ 등 종성 불가
  }
  if (c.cho < 0 && c.jung >= 0) return startNew();
  // 종성 있음 → 겹받침 시도
  const combined = DOUBLE_JONG[JONG[c.jong] + jamo];
  if (combined) {
    return { committed: s.committed, composing: { ...c, jong: JONG_IDX[combined] } };
  }
  return startNew(); // 겹받침 불가 → 새 음절
}

/** 비자모 문자(공백·영문·숫자·문장부호) — 조합 확정 후 그대로 추가. */
export function applyLiteral(s: ImeState, ch: string): ImeState {
  const base = commit(s);
  return { committed: base.committed + ch, composing: null };
}

/** 버퍼에서 마지막 자모 하나 제거(역분해). 빈 버퍼가 되면 null. */
function removeLastJamo(c: Composing): Composing | null {
  if (c.jong > 0) {
    const split = SPLIT_JONG[JONG[c.jong]];
    return { ...c, jong: split ? JONG_IDX[split[0]] : 0 };
  }
  if (c.jung >= 0) {
    const split = SPLIT_JUNG[JUNG[c.jung]];
    return { ...c, jung: split ? JUNG_IDX[split[0]] : -1 };
  }
  // 초성만 남았거나 빈 버퍼 → 제거하면 완전히 빈 버퍼
  return null;
}

/** 조합 버퍼가 빈 상태에서, 확정 텍스트의 마지막 글자를 다시 조합 버퍼로 흡수.
 *
 *  없으면: "ㅅ" → 오타 → 백스페이스 → "ㅏ" 가 "사"가 아니라 "ㅅㅏ"가 되고,
 *  "도서" + "석" 상태에서 오타를 지우면 "도석ㅘㄴ" 처럼 뒤 음절이 영영 안 붙는다.
 *  앞 글자가 확정으로 굳어 종성 이동·자모 결합이 다시 일어나지 않기 때문이다.
 *
 *  OS IME 는 확정된 글자를 되살리지 않지만, 이 앱은 조합/확정 경계를 사용자에게
 *  보여주지 않는다. "지웠으니 이어서 치면 된다"는 기대가 맞고, 되살리지 않으면
 *  오타 한 번에 그 항목이 완주 불가가 되므로 되살리는 쪽을 택한다. */
function reviveTail(committed: string): ImeState {
  const cells = Array.from(committed);
  const last = cells[cells.length - 1];
  if (last === undefined) return { committed, composing: null };
  const rest = cells.slice(0, -1).join("");
  if (isHangulSyllable(last)) {
    const j = decomposeSyllable(last)!;
    return { committed: rest, composing: { cho: j.choIdx, jung: j.jungIdx, jong: j.jongIdx } };
  }
  if (last in CHO_IDX) return { committed: rest, composing: { cho: CHO_IDX[last], jung: -1, jong: 0 } };
  if (last in JUNG_IDX) return { committed: rest, composing: { cho: -1, jung: JUNG_IDX[last], jong: 0 } };
  return { committed, composing: null };
}

/** 백스페이스 — 조합 중이면 버퍼에서, 아니면 확정 마지막 음절을 되살려 한 자모 제거. */
export function applyBackspace(s: ImeState): ImeState {
  if (s.composing) {
    const next = removeLastJamo(s.composing);
    return next ? { committed: s.committed, composing: next } : reviveTail(s.committed);
  }
  if (s.committed.length === 0) return s;
  const cells = Array.from(s.committed);
  const last = cells[cells.length - 1];
  const rest = cells.slice(0, -1).join("");
  if (isHangulSyllable(last)) {
    const j = decomposeSyllable(last)!;
    const revived = removeLastJamo({ cho: j.choIdx, jung: j.jungIdx, jong: j.jongIdx });
    return { committed: rest, composing: revived };
  }
  return { committed: rest, composing: null };
}

/** 텍스트를 실제 타이핑 순서의 자모 낱자 시퀀스로 역산(겹받침·겹모음 분해).
 *  "닭" → [ㄷ,ㅏ,ㄹ,ㄱ], "과" → [ㄱ,ㅗ,ㅏ]. 온스크린 키보드 다음 키 힌트용. */
export function jamoSequence(text: string): string[] {
  const out: string[] = [];
  for (const ch of Array.from(text)) {
    const j = decomposeSyllable(ch);
    if (!j) {
      out.push(ch); // 낱자 자모 또는 비한글
      continue;
    }
    out.push(CHO[j.choIdx]);
    const jungChar = JUNG[j.jungIdx];
    const js = SPLIT_JUNG[jungChar];
    if (js) out.push(js[0], js[1]);
    else out.push(jungChar);
    if (j.jongIdx > 0) {
      const jongChar = JONG[j.jongIdx];
      const gs = SPLIT_JONG[jongChar];
      if (gs) out.push(gs[0], gs[1]);
      else out.push(jongChar);
    }
  }
  return out;
}

/** 목표 텍스트에서 현재 상태 다음에 눌러야 할 자모 하나. 없으면 null. */
export function nextExpectedJamo(target: string, s: ImeState): string | null {
  const cells = Array.from(s.committed);
  const syllIndex = cells.length;
  const targetCells = Array.from(target);
  if (syllIndex >= targetCells.length) return null;
  const targetSeq = jamoSequence(targetCells[syllIndex]);
  const composingChar = renderComposing(s.composing);
  const doneLen = composingChar ? jamoSequence(composingChar).length : 0;
  return targetSeq[doneLen] ?? null;
}

// ── 테스트·편의 헬퍼 ────────────────────────────────────────────────────
/** 자모 문자열을 순서대로 적용하고 최종 텍스트 반환. */
export function typeJamos(jamos: string): string {
  let s = EMPTY_IME;
  for (const j of Array.from(jamos)) s = applyJamo(s, j);
  return imeText(s);
}
