import type { Lang } from "../typing/engine";

// 완주 배지 — 성취 보상. 결과 화면 + 공유에 노출.
export interface Badge {
  id: string;
  emoji: string;
  label: { ko: string; en: string };
}

/** 이번 라운드 획득 배지. */
export function earnedBadges(accuracy: number, cpm: number, maxCombo: number): Badge[] {
  const badges: Badge[] = [];
  if (accuracy >= 100) badges.push({ id: "perfect", emoji: "🎯", label: { ko: "무결점", en: "Flawless" } });
  else if (accuracy >= 95) badges.push({ id: "accurate", emoji: "✅", label: { ko: "정확", en: "Accurate" } });
  if (cpm >= 350) badges.push({ id: "blazing", emoji: "🚀", label: { ko: "폭주", en: "Blazing" } });
  else if (cpm >= 250) badges.push({ id: "speedy", emoji: "⚡", label: { ko: "스피드", en: "Speedy" } });
  if (maxCombo >= 20) badges.push({ id: "combo", emoji: "🔥", label: { ko: "콤보 마스터", en: "Combo master" } });
  return badges;
}

export const badgeLabel = (b: Badge, lang: Lang): string => `${b.emoji} ${b.label[lang]}`;
