import { describe, it, expect } from "vitest";
import { emptyType, applyType, typeText, textPrefixMatches, textComplete, hasTypeError, correctCells, type TypeState } from "./engine";
import { DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { jamoSequence } from "../hangul/ime";

// ko 자모→키
const J2C: Record<string, { code: string; shift: boolean }> = {};
for (const [code, cap] of Object.entries(DUBEOLSIK_LAYOUT)) {
  J2C[cap.normal] = { code, shift: false };
  if (cap.shift) J2C[cap.shift] = { code, shift: true };
}
function typeKo(s: TypeState, word: string): TypeState {
  for (const j of jamoSequence(word)) {
    const k = J2C[j];
    s = applyType(s, k.code, "x", k.shift);
  }
  return s;
}
function typeEn(s: TypeState, text: string): TypeState {
  for (const ch of text) s = applyType(s, "Key" + ch.toUpperCase(), ch, false);
  return s;
}

describe("한글(ko) 엔진", () => {
  it("두벌식 조합으로 완성", () => {
    let s = typeKo(emptyType("ko"), "사과");
    expect(typeText(s)).toBe("사과");
    expect(textComplete(typeText(s), "사과", "ko")).toBe(true);
  });
  it("접두 매칭 / 오타", () => {
    let s = typeKo(emptyType("ko"), "사");
    expect(textPrefixMatches(typeText(s), "사과", "ko")).toBe(true);
    expect(hasTypeError(s, "사과")).toBe(false);
  });
});

describe("영문(en) 엔진", () => {
  it("직접 입력으로 완성", () => {
    let s = typeEn(emptyType("en"), "cat");
    expect(typeText(s)).toBe("cat");
    expect(textComplete("cat", "cat", "en")).toBe(true);
  });
  it("대소문자 무시 매칭", () => {
    expect(textPrefixMatches("CA", "cat", "en")).toBe(true);
    expect(textComplete("Cat", "cat", "en")).toBe(true);
  });
  it("공백·문장 입력", () => {
    let s = typeEn(emptyType("en"), "the fox");
    expect(typeText(s)).toBe("the fox");
  });
  it("접두 아니면 오타", () => {
    let s = typeEn(emptyType("en"), "d");
    expect(hasTypeError(s, "cat")).toBe(true); // c 로 시작해야
  });
  it("백스페이스", () => {
    let s = typeEn(emptyType("en"), "cat");
    s = applyType(s, "Backspace", "Backspace", false);
    expect(typeText(s)).toBe("ca");
  });
});

describe("correctCells", () => {
  it("ko 음절 단위", () => {
    expect(correctCells("사과", "사과", "ko")).toBe(2);
    expect(correctCells("사고", "사과", "ko")).toBe(1);
  });
  it("en 문자 단위(대소문자 무시)", () => {
    expect(correctCells("Cat", "cat", "en")).toBe(3);
    expect(correctCells("car", "cat", "en")).toBe(2);
  });
});
