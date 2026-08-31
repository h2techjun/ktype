import type { TypingStage } from "../types";

// English words — beginner vocabulary by theme. gloss = Korean meaning.
export const EN_WORDS: TypingStage[] = [
  {
    id: "en-word-common",
    kind: "word",
    order: 1,
    title: { ko: "기본 단어", en: "Common words" },
    items: [
      { text: "apple", gloss: "사과" }, { text: "house", gloss: "집" }, { text: "water", gloss: "물" },
      { text: "happy", gloss: "행복한" }, { text: "music", gloss: "음악" }, { text: "friend", gloss: "친구" },
      { text: "school", gloss: "학교" }, { text: "family", gloss: "가족" }, { text: "morning", gloss: "아침" },
      { text: "book", gloss: "책" },
    ],
  },
  {
    id: "en-word-nature",
    kind: "word",
    order: 2,
    title: { ko: "자연", en: "Nature" },
    items: [
      { text: "sun", gloss: "해" }, { text: "moon", gloss: "달" }, { text: "star", gloss: "별" },
      { text: "tree", gloss: "나무" }, { text: "flower", gloss: "꽃" }, { text: "cloud", gloss: "구름" },
      { text: "river", gloss: "강" }, { text: "ocean", gloss: "바다" }, { text: "mountain", gloss: "산" },
      { text: "garden", gloss: "정원" },
    ],
  },
  {
    id: "en-word-food",
    kind: "word",
    order: 3,
    title: { ko: "음식", en: "Food" },
    items: [
      { text: "bread", gloss: "빵" }, { text: "milk", gloss: "우유" }, { text: "coffee", gloss: "커피" },
      { text: "orange", gloss: "오렌지" }, { text: "banana", gloss: "바나나" }, { text: "cheese", gloss: "치즈" },
      { text: "salad", gloss: "샐러드" }, { text: "noodle", gloss: "국수" }, { text: "cookie", gloss: "쿠키" },
      { text: "dinner", gloss: "저녁 식사" },
    ],
  },
  {
    id: "en-word-verb",
    kind: "word",
    order: 4,
    title: { ko: "동사 · 형용사", en: "Verbs & adjectives" },
    items: [
      { text: "read", gloss: "읽다" }, { text: "write", gloss: "쓰다" }, { text: "learn", gloss: "배우다" },
      { text: "smile", gloss: "미소짓다" }, { text: "dream", gloss: "꿈꾸다" }, { text: "travel", gloss: "여행하다" },
      { text: "bright", gloss: "밝은" }, { text: "gentle", gloss: "부드러운" }, { text: "strong", gloss: "강한" },
      { text: "wonderful", gloss: "멋진" },
    ],
  },
];
