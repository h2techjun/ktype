import { describe, it, expect } from "vitest";
import { initSpeed, speedReducer, SPEED_DURATION, type SpeedState } from "./speedGame";
import { DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { jamoSequence } from "../hangul/ime";
import { typeText } from "../typing/engine";

const J2C: Record<string, { code: string; shift: boolean }> = {};
for (const [code, cap] of Object.entries(DUBEOLSIK_LAYOUT)) {
  J2C[cap.normal] = { code, shift: false };
  if (cap.shift) J2C[cap.shift] = { code, shift: true };
}
function typeKo(s: SpeedState, word: string): SpeedState {
  for (const j of jamoSequence(word)) {
    const k = J2C[j];
    s = speedReducer(s, { t: "key", code: k.code, key: "x", shift: k.shift });
  }
  return s;
}
function typeEn(s: SpeedState, word: string): SpeedState {
  for (const ch of word) s = speedReducer(s, { t: "key", code: "Key" + ch.toUpperCase(), key: ch, shift: false });
  return s;
}
function withWord(lang: "ko" | "en", word: string): SpeedState {
  return { ...initSpeed(lang), word: { text: word, roman: "", gloss: "" } };
}

describe("스피드런", () => {
  it("한글 완성 시 클리어·콤보·다음 단어", () => {
    let s = typeKo(withWord("ko", "별"), "별");
    expect(s.cleared).toBe(1);
    expect(s.combo).toBe(1);
    expect(s.word.text).not.toBe("");
  });
  it("영문 완성 시 클리어", () => {
    let s = typeEn(withWord("en", "cat"), "cat");
    expect(s.cleared).toBe(1);
  });
  it("오타는 콤보를 리셋", () => {
    let s: SpeedState = { ...withWord("ko", "사과"), combo: 5 };
    s = speedReducer(s, { t: "key", code: J2C["ㅁ"].code, key: "x", shift: false });
    expect(s.combo).toBe(0);
    expect(typeText(s.typed)).toBe("");
  });
  it("시간이 다하면 게임오버", () => {
    let s = speedReducer(withWord("ko", "별"), { t: "tick", dt: SPEED_DURATION + 1 });
    expect(s.status).toBe("over");
  });
});
