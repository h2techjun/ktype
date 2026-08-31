import type { TypingStage } from "../types";

// English long text — multi-sentence paragraphs, quotes, proverbs.
export const EN_LONG: TypingStage[] = [
  {
    id: "en-long-intro",
    kind: "long",
    order: 1,
    title: { ko: "자기소개 문단", en: "Self-introduction" },
    items: [
      { text: "Hello. My name is Alex. I am learning to type.", gloss: "안녕하세요. 제 이름은 Alex예요. 저는 타자를 배우고 있어요." },
      { text: "I like reading books and taking long walks in the park.", gloss: "저는 책 읽기와 공원에서 긴 산책을 좋아해요." },
      { text: "Learning a new skill takes time, but it is worth it.", gloss: "새 기술을 배우는 건 시간이 걸리지만 그만한 가치가 있어요." },
    ],
  },
  {
    id: "en-long-pangram",
    kind: "long",
    order: 2,
    title: { ko: "팬그램", en: "Pangrams" },
    items: [
      { text: "The quick brown fox jumps over the lazy dog.", gloss: "빠른 갈색 여우가 게으른 개를 뛰어넘는다." },
      { text: "Pack my box with five dozen liquor jugs.", gloss: "모든 알파벳이 들어간 문장." },
      { text: "How vexingly quick daft zebras jump!", gloss: "모든 알파벳이 들어간 문장." },
    ],
  },
  {
    id: "en-long-quote",
    kind: "long",
    order: 3,
    title: { ko: "명언", en: "Wise sayings" },
    items: [
      { text: "Practice is the best of all instructors.", gloss: "연습이 최고의 스승이다." },
      { text: "Slow is smooth, and smooth is fast.", gloss: "느린 것이 부드럽고, 부드러운 것이 빠르다." },
      { text: "Little by little, one walks far.", gloss: "조금씩 가다 보면 멀리 간다." },
    ],
  },
];
