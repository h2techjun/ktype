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
  it("단어 완주 → 보여주기(itemDone) → advance 로 다음 item", () => {
    store().startStage("ko-word-daily", "ko");
    typeKo("사과");
    expect(store().itemDone).toBe(true);
    expect(text()).toBe("사과"); // 완성 글자가 화면에 남아 있다
    expect(store().itemIndex).toBe(0);
    store().advanceItem();
    expect(store().itemIndex).toBe(1);
    expect(store().itemDone).toBe(false);
    expect(store().errorKeys).toBe(0);
  });
  it("보여주기 중 친 키는 다음 item 에 바로 적용된다(빠른 타자)", () => {
    store().startStage("ko-word-daily", "ko");
    typeKo("사과");
    const next = jamoSequence(store().currentStage()!.items[1].text)[0];
    pressKo(next);
    expect(store().itemIndex).toBe(1);
    expect(text()).toBe(next);
  });
  it("보여주기 시간은 타자 시간에서 제외된다(startMs 가 밀린다)", () => {
    store().startStage("ko-word-daily", "ko");
    typeKo("사과");
    const before = store().startMs!;
    useGameStore.setState({ holdStartMs: store().holdStartMs! - 500 });
    store().advanceItem();
    expect(store().startMs! - before).toBeGreaterThanOrEqual(500);
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
    store().advanceItem();
    expect(store().itemIndex).toBe(1);
    expect(store().errorKeys).toBe(0);
  });
  it("대소문자 무시 완주", () => {
    store().startStage("en-word-common", "en");
    typeEn("APPLE");
    store().advanceItem();
    expect(store().itemIndex).toBe(1);
  });
});

describe("오타 자동 리셋 (백스페이스 없이 바로 다시 친다)", () => {
  it("겹모음 오타 → 버려지고 정타로 완주 (과)", () => {
    store().startStage("ko-pos-double", "ko"); // 첫 item "과"
    expect(store().currentTarget()).toBe("과");
    pressKo("ㄱ");
    pressKo("ㅗ"); // 고
    pressKo("ㅓ"); // 오타 → 자동으로 "고" 로 되돌아간다
    expect(text()).toBe("고");
    expect(store().errorKeys).toBe(1);
    expect(store().lastWrong).toBe("ㅓ"); // ㅗ+ㅓ 는 겹모음이 아니라 홑 ㅓ 로 시작된다
    expect(store().combo).toBe(0);
    pressKo("ㅏ"); // 고 + ㅏ = 자모 과 → 완주
    expect(store().itemDone).toBe(true);
    store().advanceItem();
    expect(store().itemIndex).toBe(1);
  });

  it("받침 오타 → 버려지고 정타로 완주 (강)", () => {
    store().startStage("ko-pos-batchim", "ko"); // 첫 item "강"
    pressKo("ㄱ");
    pressKo("ㅏ"); // 가
    pressKo("ㄴ"); // 간 (오타) → "가"
    expect(text()).toBe("가");
    pressKo("ㅇ"); // 강
    expect(store().itemDone).toBe(true);
    expect(store().errorKeys).toBe(1);
    expect(store().correctKeys).toBe(3);
  });

  it("영문 오타 → 버려지고 이어서 친다", () => {
    store().startStage("en-word-common", "en"); // apple
    typeEn("app");
    store().pressKey("KeyX", "x", false); // 오타
    expect(text()).toBe("app");
    typeEn("le");
    expect(store().itemDone).toBe(true);
    expect(store().errorKeys).toBe(1);
  });

  it("천지인 — 확정 시점에 드러난 오타는 음절째 걷어낸다 (코 ← 노)", () => {
    store().startStage("ko-pos-double", "ko");
    useGameStore.setState({ customStage: { id: "t", kind: "word", order: 0, title: { ko: "t", en: "t" }, items: [{ text: "코끼리" }] }, stageId: "t", itemIndex: 0 });
    expect(store().currentTarget()).toBe("코끼리");
    // 노 를 치고 다음 음절 ㅋ+ㅗ 로 넘어가는 순간(받침 이동으로 "노" 가 확정) 오타가 드러난다
    for (const tap of ["ㄴㄹ", "ㆍ", "ㅡ", "ㄱㅋ", "ㄱㅋ", "ㆍ"]) store().tapKey(tap);
    expect(store().errorKeys).toBe(0); // 아직 조합 중 — 판정 유예
    store().tapKey("ㅡ");
    expect(text()).toBe(""); // 틀린 음절째 비워져 바로 다시 칠 수 있다
    expect(store().errorKeys).toBe(1);
    for (const tap of ["ㄱㅋ", "ㄱㅋ", "ㆍ", "ㅡ"]) store().tapKey(tap);
    expect(text()).toBe("코");
    expect(store().errorKeys).toBe(1);
  });
});
