// 천지인 자판 — 휴대전화 한글 입력의 국가 표준(피처폰 단일 표준, 스마트폰 복수 표준).
//
// 원리: 훈민정음 모음 창제 원리(천 ㆍ / 지 ㅡ / 인 ㅣ)를 그대로 자판에 옮긴 것.
// 모음은 ㅣ·ㆍ·ㅡ 세 키의 조합, 자음은 7개 키의 반복 탭으로 만든다.
//
// 규격 출처: 나무위키 「천지인 자판」 — 모음 조합표와
// "자음 버튼은 한 번 누르면 왼쪽 글자, 다시 누르면 오른쪽 글자가 나오며
//  ㄴㄹ과 ㅇㅁ을 제외하면 한 번 더 눌러 된소리를 낼 수 있다"

/** 천지인 자판의 키 식별자. 화면 자판의 각인과 1:1 대응한다. */
export type CjiKey =
  | "ㅣ" | "ㆍ" | "ㅡ"
  | "ㄱㅋ" | "ㄴㄹ" | "ㄷㅌ"
  | "ㅂㅍ" | "ㅅㅎ" | "ㅈㅊ"
  | "ㅇㅁ";

/** 모음 3키 — 조합으로 모든 모음을 만든다. */
export const CJI_VOWEL_KEYS: CjiKey[] = ["ㅣ", "ㆍ", "ㅡ"];

/** 자음 키의 반복 탭 순환. 왼쪽 글자 → 오른쪽 글자 → (가능하면) 된소리. */
export const CJI_CONSONANT_CYCLE: Record<string, string[]> = {
  "ㄱㅋ": ["ㄱ", "ㅋ", "ㄲ"],
  "ㄴㄹ": ["ㄴ", "ㄹ"],
  "ㄷㅌ": ["ㄷ", "ㅌ", "ㄸ"],
  "ㅂㅍ": ["ㅂ", "ㅍ", "ㅃ"],
  "ㅅㅎ": ["ㅅ", "ㅎ", "ㅆ"],
  "ㅈㅊ": ["ㅈ", "ㅊ", "ㅉ"],
  "ㅇㅁ": ["ㅇ", "ㅁ"],
};

/** 화면 자판 3×4 배열(마지막 행 좌/우는 기능키라 별도로 렌더). */
export const CJI_ROWS: CjiKey[][] = [
  ["ㅣ", "ㆍ", "ㅡ"],
  ["ㄱㅋ", "ㄴㄹ", "ㄷㅌ"],
  ["ㅂㅍ", "ㅅㅎ", "ㅈㅊ"],
];

/** 모음 탭 시퀀스 → 완성 모음.
 *
 *  앞 16개는 나무위키 조합표 그대로. 표에 없는 ㅒ·ㅖ·ㅙ·ㅞ·ㅟ 는 표의 규칙
 *  (이중모음 + ㅣ = 겹모음, ㆍ 두 번 = 반모음)을 그대로 연장한 것으로,
 *  아래 corpus 검증 테스트가 실제 코퍼스 전 음절에 대해 도달 가능성을 확인한다. */
export const CJI_VOWELS: Record<string, string> = {
  "ㅣ": "ㅣ",
  "ㅡ": "ㅡ",
  "ㅣㆍ": "ㅏ",
  "ㅣㆍㆍ": "ㅑ",
  "ㆍㅣ": "ㅓ",
  "ㆍㆍㅣ": "ㅕ",
  "ㆍㅡ": "ㅗ",
  "ㆍㆍㅡ": "ㅛ",
  "ㅡㆍ": "ㅜ",
  "ㅡㆍㆍ": "ㅠ",
  "ㅣㆍㅣ": "ㅐ",
  "ㆍㅣㅣ": "ㅔ",
  "ㆍㅡㅣ": "ㅚ",
  "ㅡㅣ": "ㅢ",
  "ㆍㅡㅣㆍ": "ㅘ",
  "ㅡㆍㆍㅣ": "ㅝ",
  // 표의 규칙을 연장한 항목
  "ㅣㆍㆍㅣ": "ㅒ",
  "ㆍㆍㅣㅣ": "ㅖ",
  "ㆍㅡㅣㆍㅣ": "ㅙ",
  "ㅡㆍㆍㅣㅣ": "ㅞ",
  "ㅡㆍㅣ": "ㅟ",
};

/** 조합 도중의 유효한 탭 시퀀스 전체(접두사 집합).
 *
 *  "ㆍㆍ"(ㅕ·ㅛ 로 가는 길)처럼 그 자체로는 완성 모음이 아니지만 계속 이어가야 하는
 *  중간 단계가 있다. 이 집합이 없으면 두 번째 ㆍ에서 조합이 끊겨 ㅕ가 ㅓ로 확정된다. */
export const CJI_VOWEL_PREFIXES: ReadonlySet<string> = (() => {
  const out = new Set<string>();
  for (const seq of Object.keys(CJI_VOWELS)) {
    for (let i = 1; i <= seq.length; i++) out.add(seq.slice(0, i));
  }
  return out;
})();

/** 완성 모음 → 최단 탭 시퀀스(역인덱스). 연습 힌트·검증에서 쓴다. */
export const CJI_VOWEL_STROKES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [seq, vowel] of Object.entries(CJI_VOWELS)) {
    const prev = out[vowel];
    if (prev === undefined || seq.length < prev.length) out[vowel] = seq;
  }
  return out;
})();

/** 자모 → 그 자모를 내는 (자음 키, 탭 횟수). */
export const CJI_CONSONANT_STROKES: Record<string, { key: string; taps: number }> = (() => {
  const out: Record<string, { key: string; taps: number }> = {};
  for (const [key, cycle] of Object.entries(CJI_CONSONANT_CYCLE)) {
    cycle.forEach((jamo, i) => {
      if (!(jamo in out)) out[jamo] = { key, taps: i + 1 };
    });
  }
  return out;
})();

/** 다음에 눌러야 할 천지인 키. seq = 현재 조합 중인 모음 탭 시퀀스.
 *  자음은 같은 키를 반복해 순환시키므로 언제나 그 키가 답이다. */
export function cjiNextTap(jamo: string, seq: string): string | null {
  const strokes = CJI_VOWEL_STROKES[jamo];
  if (strokes) {
    if (seq !== "" && strokes.startsWith(seq)) return strokes[seq.length] ?? null;
    return strokes[0] ?? null;
  }
  return CJI_CONSONANT_STROKES[jamo]?.key ?? null;
}

export const isCjiVowelKey = (k: string): boolean => (CJI_VOWEL_KEYS as string[]).includes(k);
export const isCjiConsonantKey = (k: string): boolean => k in CJI_CONSONANT_CYCLE;

/** 자모 하나를 입력하는 탭 시퀀스. 없으면 null(입력 불가 자모). */
export function cjiStrokesFor(jamo: string): CjiKey[] | null {
  const v = CJI_VOWEL_STROKES[jamo];
  if (v) return Array.from(v) as CjiKey[];
  const c = CJI_CONSONANT_STROKES[jamo];
  if (c) return Array.from({ length: c.taps }, () => c.key as CjiKey);
  return null;
}
