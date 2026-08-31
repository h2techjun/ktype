import { describe, it, expect } from "vitest";
import { computeSpeed, computeAccuracy, nextCombo, stars } from "./metrics";

describe("computeSpeed (타/분·단어/분)", () => {
  it("경과 0 이면 0", () => {
    expect(computeSpeed(10, 0)).toEqual({ cpm: 0, wpm: 0 });
  });

  it("60초에 300타 → 300 CPM, 60 WPM(=300/5)", () => {
    const r = computeSpeed(300, 60_000);
    expect(r.cpm).toBe(300);
    expect(r.wpm).toBe(60);
  });

  it("30초에 150타 → 300 CPM", () => {
    expect(computeSpeed(150, 30_000).cpm).toBe(300);
  });

  it("반올림한다", () => {
    // 45초에 200타 → 266.6.. → 267
    expect(computeSpeed(200, 45_000).cpm).toBe(267);
  });
});

describe("computeAccuracy", () => {
  it("입력 없으면 100", () => {
    expect(computeAccuracy(0, 0)).toBe(100);
  });
  it("정타 9 오타 1 → 90", () => {
    expect(computeAccuracy(9, 1)).toBe(90);
  });
  it("전부 정타 → 100", () => {
    expect(computeAccuracy(20, 0)).toBe(100);
  });
});

describe("nextCombo", () => {
  it("정타면 +1", () => {
    expect(nextCombo(3, true)).toBe(4);
  });
  it("오타면 0 리셋", () => {
    expect(nextCombo(9, false)).toBe(0);
  });
});

describe("stars (완주 등급)", () => {
  it("높은 정확도 + 빠른 속도 = 3별", () => {
    expect(stars(99, 260)).toBe(3);
  });
  it("보통 = 2별", () => {
    expect(stars(92, 150)).toBe(2);
  });
  it("느리거나 부정확 = 1별(완주 최소 보장)", () => {
    expect(stars(70, 40)).toBe(1);
  });
});
