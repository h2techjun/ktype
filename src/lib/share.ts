// 결과 공유 — 워들식 이모지 타일 + 수치 + URL. Web Share API 우선, 없으면 클립보드.

/** 워들식 공유 텍스트 — 별 타일 + 정확도 신호등 + 수치. 한눈에 자랑·재도전 유도. */
export function buildShareText(title: string, cpm: number, accuracy: number, star: number): string {
  const stars = "⭐".repeat(star) + "▪️".repeat(3 - star);
  const accTile = accuracy >= 95 ? "🟩" : accuracy >= 85 ? "🟨" : "🟥";
  return [
    "⌨️ 한글 타자 · K-Type",
    `${title}  ${stars}`,
    `${accTile} ${accuracy}%  ·  ${cpm}타/분`,
    "https://workmate.tools/ktype",
  ].join("\n");
}

export type ShareOutcome = "shared" | "copied" | "failed";

export async function shareResult(text: string): Promise<ShareOutcome> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch {
      // 공유 취소·실패 → 클립보드로 폴백
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
