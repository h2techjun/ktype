// 진행·성장 계산 — best 기록(스테이지 완료)에서 파생.
import { stagesFor } from "../data";
import type { StageKind } from "../data";
import type { Lang } from "../typing/engine";
import type { BestRecord } from "../store/useProgressStore";

export interface KindStat {
  done: number;
  total: number;
  stars: number;
  maxStars: number;
}

/** 단계(kind)별 진행 — 완료 스테이지 수·별 합계. */
export function kindStat(lang: Lang, kind: StageKind, best: Record<string, BestRecord>): KindStat {
  const stages = stagesFor(lang).filter((s) => s.kind === kind);
  let done = 0;
  let stars = 0;
  for (const s of stages) {
    const b = best[s.id];
    if (b) {
      done += 1;
      stars += b.stars;
    }
  }
  return { done, total: stages.length, stars, maxStars: stages.length * 3 };
}

/** 전체 진행. */
export function overallStat(lang: Lang, best: Record<string, BestRecord>): { done: number; total: number; stars: number } {
  const stages = stagesFor(lang);
  let done = 0;
  let stars = 0;
  for (const s of stages) {
    const b = best[s.id];
    if (b) {
      done += 1;
      stars += b.stars;
    }
  }
  return { done, total: stages.length, stars };
}
