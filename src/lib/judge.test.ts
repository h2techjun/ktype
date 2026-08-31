import { describe, it, expect } from "vitest";
import { judgeSyllables, isRoundComplete, firstWrongIndex } from "./judge";

describe("judgeSyllables (음절 단위 정오 판정)", () => {
  it("미입력 음절은 pending", () => {
    expect(judgeSyllables("사과", "")).toEqual(["pending", "pending"]);
  });
  it("정타·오타·미입력 혼합", () => {
    expect(judgeSyllables("사과", "사")).toEqual(["correct", "pending"]);
    expect(judgeSyllables("사과", "사가")).toEqual(["correct", "wrong"]);
    expect(judgeSyllables("사과", "사과")).toEqual(["correct", "correct"]);
  });
  it("공백 포함 문장", () => {
    expect(judgeSyllables("안녕 하", "안녕 ")).toEqual([
      "correct", "correct", "correct", "pending",
    ]);
  });
});

describe("isRoundComplete", () => {
  it("정확히 일치해야 완료", () => {
    expect(isRoundComplete("사과", "사과")).toBe(true);
    expect(isRoundComplete("사과", "사")).toBe(false);
    expect(isRoundComplete("사과", "사가")).toBe(false);
  });
});

describe("firstWrongIndex (첫 오타 위치)", () => {
  it("오타 없으면 -1", () => {
    expect(firstWrongIndex("사과", "사")).toBe(-1);
    expect(firstWrongIndex("사과", "사과")).toBe(-1);
  });
  it("첫 오타 인덱스 반환", () => {
    expect(firstWrongIndex("사과", "사가")).toBe(1);
    expect(firstWrongIndex("사과", "차")).toBe(0);
  });
});
