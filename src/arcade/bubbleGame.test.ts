import { describe, it, expect } from "vitest";
import { initBubble, bubbleReducer, BUBBLE_DURATION, type BubbleState } from "./bubbleGame";
import { DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { jamoSequence } from "../hangul/ime";
import { typeText } from "../typing/engine";

const J2C: Record<string, { code: string; shift: boolean }> = {};
for (const [code, cap] of Object.entries(DUBEOLSIK_LAYOUT)) {
  J2C[cap.normal] = { code, shift: false };
  if (cap.shift) J2C[cap.shift] = { code, shift: true };
}
function typeKo(s: BubbleState, word: string): BubbleState {
  for (const j of jamoSequence(word)) {
    const k = J2C[j];
    s = bubbleReducer(s, { t: "key", code: k.code, key: "x", shift: k.shift });
  }
  return s;
}
function typeEn(s: BubbleState, word: string): BubbleState {
  for (const ch of word) s = bubbleReducer(s, { t: "key", code: "Key" + ch.toUpperCase(), key: ch, shift: false });
  return s;
}
function withBubble(lang: "ko" | "en", word: string): BubbleState {
  return { ...initBubble(lang), bubbles: [{ id: 1, word: { text: word, roman: "", gloss: "" }, xPct: 50, yPct: 50, vx: 0, vy: 0 }] };
}

describe("버블 팝", () => {
  it("한글 완성 시 버블 터짐·점수", () => {
    let s = typeKo(withBubble("ko", "별"), "별");
    expect(s.bubbles).toHaveLength(0);
    expect(s.popped).toBe(1);
  });
  it("영문 완성 시 버블 터짐", () => {
    let s = typeEn(withBubble("en", "sun"), "sun");
    expect(s.bubbles).toHaveLength(0);
  });
  it("오타는 입력 초기화", () => {
    let s = bubbleReducer(withBubble("ko", "사과"), { t: "key", code: J2C["ㅁ"].code, key: "x", shift: false });
    expect(typeText(s.typed)).toBe("");
    expect(s.shake).toBeGreaterThan(0);
  });
  it("시간 종료 시 게임오버", () => {
    let s = bubbleReducer(withBubble("ko", "별"), { t: "tick", dt: BUBBLE_DURATION + 1 });
    expect(s.status).toBe("over");
  });
  it("버블은 벽에서 튕긴다", () => {
    let s: BubbleState = { ...initBubble("ko"), bubbles: [{ id: 1, word: { text: "별", roman: "", gloss: "" }, xPct: 89, yPct: 50, vx: 0.01, vy: 0 }] };
    s = bubbleReducer(s, { t: "tick", dt: 40 });
    expect(s.bubbles[0].vx).toBeLessThan(0);
  });
});
