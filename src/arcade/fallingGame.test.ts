import { describe, it, expect } from "vitest";
import { initFalling, fallingReducer, FIELD_H, type FallingState } from "./fallingGame";
import { DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { jamoSequence } from "../hangul/ime";
import { typeText } from "../typing/engine";

const J2C: Record<string, { code: string; shift: boolean }> = {};
for (const [code, cap] of Object.entries(DUBEOLSIK_LAYOUT)) {
  J2C[cap.normal] = { code, shift: false };
  if (cap.shift) J2C[cap.shift] = { code, shift: true };
}
function keyKo(s: FallingState, jamo: string): FallingState {
  const k = J2C[jamo];
  return fallingReducer(s, { t: "key", code: k.code, key: "x", shift: k.shift });
}
function typeKo(s: FallingState, word: string): FallingState {
  for (const j of jamoSequence(word)) s = keyKo(s, j);
  return s;
}
function typeEn(s: FallingState, word: string): FallingState {
  for (const ch of word) s = fallingReducer(s, { t: "key", code: "Key" + ch.toUpperCase(), key: ch, shift: false });
  return s;
}
function withFaller(lang: "ko" | "en", word: string, y = 100): FallingState {
  return { ...initFalling(lang), fallers: [{ id: 1, word: { text: word, roman: "", gloss: "" }, xPct: 50, y }] };
}

describe("별똥별 — 한글", () => {
  it("단어 완성 시 격추·점수", () => {
    let s = typeKo(withFaller("ko", "별"), "별");
    expect(s.fallers).toHaveLength(0);
    expect(s.score).toBeGreaterThan(0);
  });
  it("받침으로 붙는 자음은 오타 아님(삭 경유)", () => {
    let s = typeKo(withFaller("ko", "사과"), "사");
    s = keyKo(s, "ㄱ"); // 삭
    expect(s.shake).toBe(0);
  });
  it("틀린 자모는 입력 초기화", () => {
    let s = keyKo(withFaller("ko", "별"), "ㅁ");
    expect(typeText(s.typed)).toBe("");
    expect(s.shake).toBeGreaterThan(0);
  });
});

describe("별똥별 — 영문", () => {
  it("단어 완성 시 격추", () => {
    let s = typeEn(withFaller("en", "cat"), "cat");
    expect(s.fallers).toHaveLength(0);
    expect(s.score).toBeGreaterThan(0);
  });
  it("대소문자 무시 격추", () => {
    let s = typeEn(withFaller("en", "cat"), "CAT");
    expect(s.fallers).toHaveLength(0);
  });
  it("틀린 문자는 초기화", () => {
    let s = typeEn(withFaller("en", "cat"), "d");
    expect(typeText(s.typed)).toBe("");
  });
});

describe("착지 / 게임오버", () => {
  it("바닥에 닿으면 생명이 준다", () => {
    let s = fallingReducer(withFaller("ko", "별", FIELD_H - 1), { t: "tick", dt: 50 });
    expect(s.fallers).toHaveLength(0);
    expect(s.lives).toBe(4);
  });
  it("생명 0 이면 게임오버", () => {
    let s: FallingState = { ...withFaller("ko", "별", FIELD_H - 1), lives: 1 };
    s = fallingReducer(s, { t: "tick", dt: 50 });
    expect(s.status).toBe("over");
  });
});
