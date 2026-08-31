import { create } from "zustand";
import { persist } from "zustand/middleware";

// 스테이지별 최고기록 — 가입 없이 localStorage 로 영속.
export interface BestRecord {
  cpm: number;
  wpm: number;
  accuracy: number;
  stars: number;
  maxCombo: number;
}

interface ProgressState {
  best: Record<string, BestRecord>;
  /** 새 기록이 기존보다 좋으면 갱신하고 갱신 여부를 반환. */
  record(stageId: string, r: BestRecord): boolean;
  clear(): void;
}

/** 신기록 판정 — 별 수 우선, 같으면 타/분(cpm). */
function isBetter(next: BestRecord, prev: BestRecord | undefined): boolean {
  if (!prev) return true;
  if (next.stars !== prev.stars) return next.stars > prev.stars;
  return next.cpm > prev.cpm;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      best: {},
      record: (stageId, r) => {
        const prev = get().best[stageId];
        if (!isBetter(r, prev)) return false;
        set({ best: { ...get().best, [stageId]: r } });
        return true;
      },
      clear: () => set({ best: {} }),
    }),
    { name: "ktype:v1" },
  ),
);
