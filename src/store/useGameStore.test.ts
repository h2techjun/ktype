import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./useGameStore";
import { DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { jamoSequence } from "../hangul/ime";
import { typeText } from "../typing/engine";

const J2C: Record<string, { code: string; shift: boolean }> = {};
for (const [code, cap] of Object.entries(DUBEOLSIK_LAYOUT)) {
  J2C[cap.normal] = { code, shift: false };
  if (cap.shift) J2C[cap.shift] = { code, shift: true };
}
const store = () => useGameStore.getState();
const text = () => typeText(store().typed);

function pressKo(jamo: string) {
  const k = J2C[jamo];
  store().pressKey(k.code, "x", k.shift);
}
function typeKo(word: string) {
  for (const j of jamoSequence(word)) pressKo(j);
}
function typeEn(word: string) {
  for (const ch of word) store().pressKey("Key" + ch.toUpperCase(), ch, false);
}

beforeEach(() => {
  store().backToSelect();
});

describe("연습 — 한글", () => {
  it("스테이지 시작 → 목표 노출", () => {
    store().startStage("ko-word-daily", "ko");
    expect(store().phase).toBe("playing");
    expect(store().currentTarget()).toBe("사과");
  });
  it("한 음절 완성 시 콤보", () => {
    store().startStage("ko-word-daily", "ko");
    typeKo("사");
    expect(text()).toBe("사");
    expect(store().combo).toBe(1);
  });
  it("단어 완주 시 다음 item", () => {
    store().startStage("ko-word-daily", "ko");
    typeKo("사과");
    expect(store().itemIndex).toBe(1);
    expect(store().errorKeys).toBe(0);
  });
});

describe("연습 — 영문", () => {
  it("영문 스테이지 시작 → 목표 노출", () => {
    store().startStage("en-word-common", "en");
    expect(store().phase).toBe("playing");
    expect(store().currentTarget()).toBe("apple");
  });
  it("영문 단어 완주 시 다음 item", () => {
    store().startStage("en-word-common", "en");
    typeEn("apple");
    expect(store().itemIndex).toBe(1);
    expect(store().errorKeys).toBe(0);
  });
  it("대소문자 무시 완주", () => {
    store().startStage("en-word-common", "en");
    typeEn("APPLE");
    expect(store().itemIndex).toBe(1);
  });
});

describe("오타 복구 흐름 (고쳐 쓰면 완주)", () => {
  it("겹모음 오타 후 고치면 완주 (과)", () => {
    store().startStage("ko-pos-double", "ko"); // 첫 item "과"
    expect(store().currentTarget()).toBe("과");
    pressKo("ㄱ");
    pressKo("ㅗ"); // 고
    pressKo("ㅓ"); // 겹모음 실패 → "고"+"어" (오타)
    store().pressKey("Backspace", "Backspace", false); // 고
    pressKo("ㅏ"); // 고 + ㅏ (조합 안 붙어 "고ㅏ", 자모=과)
    expect(store().itemIndex).toBe(1); // 완주 → 다음
  });

  it("받침 오타 후 고치면 완주 (강)", () => {
    store().startStage("ko-pos-batchim", "ko"); // 첫 item "강"
    expect(store().currentTarget()).toBe("강");
    pressKo("ㄱ");
    pressKo("ㅏ"); // 가
    pressKo("ㄴ"); // 간 (오타 받침)
    store().pressKey("Backspace", "Backspace", false); // 가
    pressKo("ㅇ"); // 강
    expect(store().itemIndex).toBe(1);
  });

  it("영문 오타 후 고치면 완주", () => {
    store().startStage("en-word-common", "en"); // apple
    typeEn("app");
    store().pressKey("KeyX", "x", false); // appx (오타)
    store().pressKey("Backspace", "Backspace", false); // app
    typeEn("le"); // apple
    expect(store().itemIndex).toBe(1);
  });
});
