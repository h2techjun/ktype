// 타이핑 코퍼스 단일 진입점 — 언어별(ko/en) × 4단계(자리연습·단어·짧은글·긴글) 통합.
import type { TypingStage, StageKind } from "./types";
import type { Lang } from "../typing/engine";
import { KO_POSITION } from "./ko/position";
import { KO_WORDS } from "./ko/words";
import { KO_SHORT } from "./ko/short";
import { KO_LONG } from "./ko/long";
import { EN_POSITION } from "./en/position";
import { EN_WORDS } from "./en/words";
import { EN_SHORT } from "./en/short";
import { EN_LONG } from "./en/long";

export type { TypingStage, TypingItem, StageKind } from "./types";
export { KIND_ORDER } from "./types";

export const KO_STAGES: TypingStage[] = [...KO_POSITION, ...KO_WORDS, ...KO_SHORT, ...KO_LONG];
export const EN_STAGES: TypingStage[] = [...EN_POSITION, ...EN_WORDS, ...EN_SHORT, ...EN_LONG];

/** 연습 언어에 맞는 스테이지 목록. */
export function stagesFor(lang: Lang): TypingStage[] {
  return lang === "en" ? EN_STAGES : KO_STAGES;
}

/** id 로 스테이지 조회(전 언어). */
export function findStage(id: string): TypingStage | undefined {
  return [...KO_STAGES, ...EN_STAGES].find((s) => s.id === id);
}

/** 4단계 표시 라벨 — 표시 언어(uiLang)로 렌더. */
export const KIND_LABEL: Record<StageKind, { ko: string; en: string }> = {
  position: { ko: "자리연습", en: "Key drills" },
  word: { ko: "단어", en: "Words" },
  short: { ko: "짧은글", en: "Short text" },
  long: { ko: "긴글", en: "Long text" },
};

/** 4단계 아이콘(진행 맵·헤더). */
export const KIND_ICON: Record<StageKind, string> = {
  position: "⌨️",
  word: "🔤",
  short: "💬",
  long: "📖",
};
