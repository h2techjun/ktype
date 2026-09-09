import { describe, it, expect } from "vitest";
import {
  speedTier,
  cpmToNextTier,
  pickQuickItems,
  buildQuickStage,
  accuracyTiles,
  buildQuickShareText,
  quickPool,
  QUICK_ITEM_COUNT,
  QUICK_STAGE_ID,
} from "./quickRound";

describe("speedTier", () => {
  it("경계값 — 하한 포함, 아래는 이전 등급", () => {
    expect(speedTier(0).id).toBe("chick");
    expect(speedTier(99).id).toBe("chick");
    expect(speedTier(100).id).toBe("turtle");
    expect(speedTier(299).id).toBe("rabbit");
    expect(speedTier(300).id).toBe("owl");
    expect(speedTier(500).id).toBe("bolt");
    expect(speedTier(900).id).toBe("bolt");
  });

  it("다음 등급까지 남은 타/분 — 최고 등급은 null", () => {
    expect(cpmToNextTier(250)).toEqual({ next: expect.objectContaining({ id: "owl" }), remaining: 50 });
    expect(cpmToNextTier(600)).toBeNull();
  });
});

describe("pickQuickItems", () => {
  it("서로 다른 문장을 count 개 고른다(중복 없음)", () => {
    let n = 0;
    const rng = () => ((n += 0.37) % 1);
    const items = pickQuickItems("ko", QUICK_ITEM_COUNT, rng);
    expect(items).toHaveLength(QUICK_ITEM_COUNT);
    expect(new Set(items.map((i) => i.text)).size).toBe(QUICK_ITEM_COUNT);
  });

  it("풀은 짧은글 단계에서만 온다(자리연습·단어 제외)", () => {
    for (const lang of ["ko", "en"] as const) {
      const pool = quickPool(lang);
      expect(pool.length).toBeGreaterThanOrEqual(QUICK_ITEM_COUNT);
      // 한 글자짜리 자리연습 아이템이 섞이면 안 된다
      expect(pool.every((i) => Array.from(i.text).length >= 3)).toBe(true);
    }
  });

  it("가상 스테이지 id 는 고정, 언어별 문장", () => {
    const st = buildQuickStage("en", () => 0);
    expect(st.id).toBe(QUICK_STAGE_ID);
    expect(st.items).toHaveLength(QUICK_ITEM_COUNT);
    expect(st.items.every((i) => /^[\x20-\x7e]+$/.test(i.text))).toBe(true);
  });
});

describe("share", () => {
  it("정확도 타일은 항상 10칸", () => {
    expect(Array.from(accuracyTiles(100)).length).toBe(10);
    expect(accuracyTiles(100)).toBe("🟩".repeat(10));
    expect(accuracyTiles(0)).toBe("🟥".repeat(10));
    expect(accuracyTiles(94)).toBe("🟩".repeat(9) + "🟥");
  });

  it("공유 텍스트 — 등급·수치·URL 포함", () => {
    const t = buildQuickShareText("ko", 312, 96, 18);
    expect(t).toContain("🦉 부엉이 등급 · 312타/분");
    expect(t).toContain("정확도 96%");
    expect(t).toContain("https://workmate.tools/ktype");
    expect(buildQuickShareText("en", 150, 88, 4)).toContain("🐢 Turtle · 150 CPM");
  });
});
