import { stagesFor, type TypingItem, type TypingStage } from "../data";
import type { Lang } from "../typing/engine";

// 스피드체크(0클릭 즉시 플레이) 순수 로직.
// 첫 화면에서 아무 키나 누르면 바로 시작하는 짧은 라운드 — 문장 3개, 15~20초.
// 결과는 "타/분 → 동물 등급"으로 바꿔 자랑하고 싶게 만든다(등급 = 공유의 핵심 단위).

export const QUICK_STAGE_ID = "quick";
export const QUICK_ITEM_COUNT = 3;

export interface SpeedTier {
  id: string;
  emoji: string;
  /** 등급 이름 */
  label: { ko: string; en: string };
  /** 한 줄 코멘트(결과 화면) */
  note: { ko: string; en: string };
  /** 이 등급의 하한 타/분 */
  minCpm: number;
  /** 액센트 색(등급별 네온) */
  color: string;
}

/** 타/분 등급표(낮은 순). 임계는 타자 사이트 이용자 집계 기준 —
 *  한글: 성인 평균 200~300타/분, 사무직·자격증 350~450, 전문 600+.
 *  영문: 40WPM(≈200타/분)=평균, 60=능숙, 80=상위, 100+=최상위. 5타=1단어 환산이라 같은 임계를 쓴다.
 *  검증된 인구 통계가 아니므로 "상위 N%" 같은 백분위 문구는 쓰지 않는다. */
export const SPEED_TIERS: readonly SpeedTier[] = [
  { id: "chick", emoji: "🐣", minCpm: 0, color: "#f59e0b", label: { ko: "병아리", en: "Chick" }, note: { ko: "자판이 아직 낯설어요. 자리연습부터!", en: "Still finding the keys. Try key drills!" } },
  { id: "turtle", emoji: "🐢", minCpm: 100, color: "#10b981", label: { ko: "거북이", en: "Turtle" }, note: { ko: "느리지만 정확하게, 좋은 출발이에요.", en: "Slow and steady — a good start." } },
  { id: "rabbit", emoji: "🐇", minCpm: 200, color: "#38bdf8", label: { ko: "토끼", en: "Rabbit" }, note: { ko: "성인 평균 구간이에요. 이제 정확도를 올려봐요.", en: "Average adult range. Now push accuracy." } },
  { id: "owl", emoji: "🦉", minCpm: 300, color: "#3aabf7", label: { ko: "부엉이", en: "Owl" }, note: { ko: "사무직 평균을 넘었어요. 손이 자판을 외웠네요!", en: "Above office-worker average. Your hands know the keys!" } },
  { id: "rocket", emoji: "🚀", minCpm: 400, color: "#a78bfa", label: { ko: "로켓", en: "Rocket" }, note: { ko: "자격증 합격권 속도. 친구한테 자랑할 만해요.", en: "Certification-level speed. Worth bragging about." } },
  { id: "bolt", emoji: "⚡", minCpm: 500, color: "#fbbf24", label: { ko: "번개", en: "Lightning" }, note: { ko: "타자 괴물. 게임 모드에서 한계를 시험해요!", en: "Typing monster. Test your limit in the games!" } },
];

/** 타/분 → 등급. 표는 오름차순이라 뒤에서부터 첫 매칭. */
export function speedTier(cpm: number): SpeedTier {
  for (let i = SPEED_TIERS.length - 1; i >= 0; i -= 1) {
    if (cpm >= SPEED_TIERS[i].minCpm) return SPEED_TIERS[i];
  }
  return SPEED_TIERS[0];
}

/** 다음 등급까지 남은 타/분(최고 등급이면 null). */
export function cpmToNextTier(cpm: number): { next: SpeedTier; remaining: number } | null {
  const cur = speedTier(cpm);
  const idx = SPEED_TIERS.findIndex((t) => t.id === cur.id);
  const next = SPEED_TIERS[idx + 1];
  if (!next) return null;
  return { next, remaining: next.minCpm - cpm };
}

/** 스피드체크 문장 풀 — 짧은글 단계 전체(자리연습·단어는 문장이 아니라 제외). */
export function quickPool(lang: Lang): TypingItem[] {
  return stagesFor(lang)
    .filter((s) => s.kind === "short")
    .flatMap((s) => s.items);
}

/** rng(0≤x<1) 로 서로 다른 문장 count 개를 고른다. 풀이 작으면 있는 만큼. */
export function pickQuickItems(lang: Lang, count: number, rng: () => number = Math.random): TypingItem[] {
  const pool = [...quickPool(lang)];
  const picked: TypingItem[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(rng() * pool.length) % pool.length;
    picked.push(pool[i]);
    pool.splice(i, 1);
  }
  return picked;
}

/** 스피드체크를 연습 엔진(useGameStore)이 그대로 돌릴 수 있는 가상 스테이지로 만든다. */
export function buildQuickStage(lang: Lang, rng: () => number = Math.random): TypingStage {
  return {
    id: QUICK_STAGE_ID,
    kind: "short",
    order: 0,
    title: { ko: "스피드체크", en: "Speed check" },
    items: pickQuickItems(lang, QUICK_ITEM_COUNT, rng),
  };
}

/** 정확도 → 워들식 타일 10칸(🟩 정타 비율, 🟥 오타 비율). */
export function accuracyTiles(accuracy: number): string {
  const green = Math.round(Math.min(100, Math.max(0, accuracy)) / 10);
  return "🟩".repeat(green) + "🟥".repeat(10 - green);
}

/** 스피드체크 공유 텍스트 — 등급 + 수치 + 타일 + URL. 한눈에 "나도 해볼래" 가 나오게. */
export function buildQuickShareText(lang: Lang, cpm: number, accuracy: number, maxCombo: number): string {
  const tier = speedTier(cpm);
  const head = lang === "en" ? "⌨️ K-Type · English speed check" : "⌨️ 한글 타자 · 스피드체크";
  const grade = lang === "en" ? `${tier.emoji} ${tier.label.en} · ${cpm} CPM` : `${tier.emoji} ${tier.label.ko} 등급 · ${cpm}타/분`;
  const acc = lang === "en" ? `${accuracyTiles(accuracy)} ${accuracy}% · combo ${maxCombo}` : `${accuracyTiles(accuracy)} 정확도 ${accuracy}% · 콤보 ${maxCombo}`;
  return [head, grade, acc, "https://workmate.tools/ktype"].join("\n");
}
