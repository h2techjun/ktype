// 한글 완성형 음절 ↔ 자모 조합/분해. 라이브러리 없이 유니코드 산술로 처리한다.
// 완성형 한글(가–힣, U+AC00–U+D7A3)은 BMP 단일 코드포인트라 음절을 "문자처럼" 다룰 수 있다.
//   code = 0xAC00 + (초성*21 + 중성)*28 + 종성  =  0xAC00 + 초성*588 + 중성*28 + 종성

/** 초성 19자 (index 0~18) */
export const CHO = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

/** 중성 21자 (index 0~20) */
export const JUNG = [
  "ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ",
  "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ",
] as const;

/** 종성 28자 (index 0 = 받침 없음, 1~27) */
export const JONG = [
  "", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ",
  "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

const BASE = 0xac00;
const LAST = 0xd7a3;

export interface Jamo {
  choIdx: number;
  jungIdx: number;
  jongIdx: number;
}

/** ch 가 완성형 한글 음절 한 글자인지. */
export function isHangulSyllable(ch: string): boolean {
  if (ch.length === 0) return false;
  const c = ch.codePointAt(0);
  return c !== undefined && c >= BASE && c <= LAST;
}

/** 단어를 음절 배열로. 완성형은 단일 코드유닛이라 Array.from 으로 안전 분해. "사과" → ["사","과"] */
export function splitSyllables(word: string): string[] {
  return Array.from(word);
}

/** 초성/중성/종성 인덱스 → 완성형 음절. */
export function composeSyllable(choIdx: number, jungIdx: number, jongIdx = 0): string {
  return String.fromCharCode(BASE + choIdx * 588 + jungIdx * 28 + jongIdx);
}

/** 완성형 음절 → 자모 인덱스. 한글이 아니면 null. */
export function decomposeSyllable(ch: string): Jamo | null {
  if (!isHangulSyllable(ch)) return null;
  const s = ch.charCodeAt(0) - BASE;
  return {
    choIdx: Math.floor(s / 588),
    jungIdx: Math.floor((s % 588) / 28),
    jongIdx: s % 28,
  };
}

/** 음절의 초성 글자. 한글이 아니면 원문 그대로. "과" → "ㄱ" */
export function getChoseong(ch: string): string {
  const j = decomposeSyllable(ch);
  return j ? CHO[j.choIdx] : ch;
}

/** 단어의 초성 힌트. "사과" → "ㅅㄱ" */
export function choseongHint(word: string): string {
  return splitSyllables(word).map(getChoseong).join("");
}

/** 단어가 전부 완성형 음절로만 이루어졌는지. */
export function isAllHangul(word: string): boolean {
  const cells = splitSyllables(word);
  return cells.length > 0 && cells.every(isHangulSyllable);
}
