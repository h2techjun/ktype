import { describe, it, expect } from "vitest";
import { initDefense, defenseReducer, type DefenseState } from "./defenseGame";
import { DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { jamoSequence } from "../hangul/ime";
import { typeText } from "../typing/engine";

const J2C: Record<string, { code: string; shift: boolean }> = {};
for (const [code, cap] of Object.entries(DUBEOLSIK_LAYOUT)) {
  J2C[cap.normal] = { code, shift: false };
  if (cap.shift) J2C[cap.shift] = { code, shift: true };
}
function typeKo(s: DefenseState, word: string): DefenseState {
  for (const j of jamoSequence(word)) {
    const k = J2C[j];
    s = defenseReducer(s, { t: "key", code: k.code, key: "x", shift: k.shift });
  }
  return s;
}
function typeEn(s: DefenseState, word: string): DefenseState {
  for (const ch of word) s = defenseReducer(s, { t: "key", code: "Key" + ch.toUpperCase(), key: ch, shift: false });
  return s;
}
function withAttacker(lang: "ko" | "en", word: string, pos = 30): DefenseState {
  return { ...initDefense(lang), attackers: [{ id: 1, word: { text: word, roman: "", gloss: "" }, side: "left", pos, laneYPct: 40 }] };
}

describe("성문 방어", () => {
  it("한글 완성 시 격파·점수", () => {
    let s = typeKo(withAttacker("ko", "별"), "별");
    expect(s.attackers).toHaveLength(0);
    expect(s.score).toBeGreaterThan(0);
  });
  it("영문 완성 시 격파", () => {
    let s = typeEn(withAttacker("en", "dog"), "dog");
    expect(s.attackers).toHaveLength(0);
  });
  it("성문 도달 시 HP 감소", () => {
    let s = defenseReducer(withAttacker("ko", "별", 99.9), { t: "tick", dt: 50 });
    expect(s.attackers).toHaveLength(0);
    expect(s.hp).toBe(4);
  });
  it("HP 0 이면 함락", () => {
    let s: DefenseState = { ...withAttacker("ko", "별", 99.9), hp: 1 };
    s = defenseReducer(s, { t: "tick", dt: 50 });
    expect(s.status).toBe("over");
  });
  it("오타는 입력 초기화", () => {
    let s = defenseReducer(withAttacker("ko", "별"), { t: "key", code: J2C["ㅁ"].code, key: "x", shift: false });
    expect(typeText(s.typed)).toBe("");
  });
});
