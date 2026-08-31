import type { TypingStage } from "../types";

// 단어 — 국립국어원/TOPIK 초급 등급 기초 어휘(표제어=사실). roman=개정 로마자, gloss=자체 뜻.
export const KO_WORDS: TypingStage[] = [
  {
    id: "ko-word-daily",
    kind: "word",
    order: 1,
    title: { ko: "생활 단어", en: "Everyday words" },
    items: [
      { text: "사과", roman: "sagwa", gloss: "apple" }, { text: "학교", roman: "hakgyo", gloss: "school" },
      { text: "친구", roman: "chingu", gloss: "friend" }, { text: "가족", roman: "gajok", gloss: "family" },
      { text: "사랑", roman: "sarang", gloss: "love" }, { text: "시간", roman: "sigan", gloss: "time" },
      { text: "사람", roman: "saram", gloss: "person" }, { text: "이름", roman: "ireum", gloss: "name" },
      { text: "선물", roman: "seonmul", gloss: "gift" }, { text: "여행", roman: "yeohaeng", gloss: "travel" },
    ],
  },
  {
    id: "ko-word-nature",
    kind: "word",
    order: 2,
    title: { ko: "자연 · 사물", en: "Nature & objects" },
    items: [
      { text: "하늘", roman: "haneul", gloss: "sky" }, { text: "바다", roman: "bada", gloss: "sea" },
      { text: "나무", roman: "namu", gloss: "tree" }, { text: "꽃", roman: "kkot", gloss: "flower" },
      { text: "구름", roman: "gureum", gloss: "cloud" }, { text: "바람", roman: "baram", gloss: "wind" },
      { text: "별", roman: "byeol", gloss: "star" }, { text: "달", roman: "dal", gloss: "moon" },
      { text: "산", roman: "san", gloss: "mountain" }, { text: "강", roman: "gang", gloss: "river" },
    ],
  },
  {
    id: "ko-word-food",
    kind: "word",
    order: 3,
    title: { ko: "음식", en: "Food" },
    items: [
      { text: "김치", roman: "kimchi", gloss: "kimchi" }, { text: "라면", roman: "ramyeon", gloss: "ramen" },
      { text: "비빔밥", roman: "bibimbap", gloss: "bibimbap" }, { text: "커피", roman: "keopi", gloss: "coffee" },
      { text: "우유", roman: "uyu", gloss: "milk" }, { text: "과일", roman: "gwail", gloss: "fruit" },
      { text: "딸기", roman: "ttalgi", gloss: "strawberry" }, { text: "수박", roman: "subak", gloss: "watermelon" },
      { text: "당근", roman: "danggeun", gloss: "carrot" }, { text: "감자", roman: "gamja", gloss: "potato" },
    ],
  },
  {
    id: "ko-word-place",
    kind: "word",
    order: 4,
    title: { ko: "장소 · 이동", en: "Places & transport" },
    items: [
      { text: "집", roman: "jip", gloss: "house" }, { text: "병원", roman: "byeongwon", gloss: "hospital" },
      { text: "은행", roman: "eunhaeng", gloss: "bank" }, { text: "시장", roman: "sijang", gloss: "market" },
      { text: "공원", roman: "gongwon", gloss: "park" }, { text: "학교", roman: "hakgyo", gloss: "school" },
      { text: "지하철", roman: "jihacheol", gloss: "subway" }, { text: "버스", roman: "beoseu", gloss: "bus" },
      { text: "택시", roman: "taeksi", gloss: "taxi" }, { text: "카페", roman: "kape", gloss: "cafe" },
    ],
  },
  {
    id: "ko-word-verb",
    kind: "word",
    order: 5,
    title: { ko: "동사 · 형용사", en: "Verbs & adjectives" },
    items: [
      { text: "먹다", roman: "meokda", gloss: "to eat" }, { text: "가다", roman: "gada", gloss: "to go" },
      { text: "보다", roman: "boda", gloss: "to see" }, { text: "읽다", roman: "ikda", gloss: "to read" },
      { text: "좋다", roman: "jota", gloss: "to be good" }, { text: "예쁘다", roman: "yeppeuda", gloss: "to be pretty" },
      { text: "행복", roman: "haengbok", gloss: "happiness" }, { text: "공부", roman: "gongbu", gloss: "study" },
      { text: "운동", roman: "undong", gloss: "exercise" }, { text: "노래", roman: "norae", gloss: "song" },
    ],
  },
  {
    id: "ko-word-time",
    kind: "word",
    order: 6,
    title: { ko: "시간 · 계절", en: "Time & seasons" },
    items: [
      { text: "오늘", roman: "oneul", gloss: "today" }, { text: "내일", roman: "naeil", gloss: "tomorrow" },
      { text: "어제", roman: "eoje", gloss: "yesterday" }, { text: "아침", roman: "achim", gloss: "morning" },
      { text: "저녁", roman: "jeonyeok", gloss: "evening" }, { text: "봄", roman: "bom", gloss: "spring" },
      { text: "여름", roman: "yeoreum", gloss: "summer" }, { text: "가을", roman: "gaeul", gloss: "autumn" },
      { text: "겨울", roman: "gyeoul", gloss: "winter" }, { text: "시계", roman: "sigye", gloss: "clock" },
    ],
  },
];
