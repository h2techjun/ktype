// 타이핑 코퍼스 타입. 4단계 커리큘럼:
//   position(자리연습) → word(단어) → short(짧은글) → long(긴글).
// 표제어(text)만 사실 데이터, roman/gloss 는 자체 제작(저작권 클린).

export type StageKind = "position" | "word" | "short" | "long";

export interface TypingItem {
  /** 타이핑 대상 텍스트 */
  text: string;
  /** 개정 로마자 표기 (학습 보조) */
  roman?: string;
  /** 영어 뜻 (학습 보조) */
  gloss?: string;
}

export interface TypingStage {
  id: string;
  kind: StageKind;
  /** 커리큘럼 순번(1부터) — 진행 맵·해금 표시용 */
  order: number;
  /** 스테이지 표시 이름 */
  title: { ko: string; en: string };
  /** 한 줄 소개(선택) */
  subtitle?: { ko: string; en: string };
  items: TypingItem[];
}

/** 4단계 순서 — 진행 맵/그룹 정렬. */
export const KIND_ORDER: StageKind[] = ["position", "word", "short", "long"];
