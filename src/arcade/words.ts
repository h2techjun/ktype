import { KO_WORDS } from "../data/ko/words";
import type { Lang } from "../typing/engine";

// 아케이드 게임용 단어 풀 — 학습 코퍼스를 재사용하고 초급 생활 어휘로 확장.
// 표제어=사실, roman/gloss 는 자체 작성(저작권 클린).
export interface GameWord {
  text: string;
  roman: string;
  gloss: string;
}

// 학습 코퍼스(단어 스테이지)에서 가져옴.
const FROM_CORPUS: GameWord[] = KO_WORDS.flatMap((s) =>
  s.items.map((i) => ({ text: i.text, roman: i.roman ?? "", gloss: i.gloss ?? "" })),
);

// 게임 볼륨용 초급 생활 어휘.
const EXTRA: GameWord[] = [
  { text: "김치", roman: "kimchi", gloss: "kimchi" },
  { text: "라면", roman: "ramyeon", gloss: "ramen" },
  { text: "비빔밥", roman: "bibimbap", gloss: "bibimbap" },
  { text: "지하철", roman: "jihacheol", gloss: "subway" },
  { text: "버스", roman: "beoseu", gloss: "bus" },
  { text: "택시", roman: "taeksi", gloss: "taxi" },
  { text: "병원", roman: "byeongwon", gloss: "hospital" },
  { text: "은행", roman: "eunhaeng", gloss: "bank" },
  { text: "시장", roman: "sijang", gloss: "market" },
  { text: "공원", roman: "gongwon", gloss: "park" },
  { text: "도서관", roman: "doseogwan", gloss: "library" },
  { text: "편의점", roman: "pyeonuijeom", gloss: "convenience store" },
  { text: "카페", roman: "kape", gloss: "cafe" },
  { text: "식당", roman: "sikdang", gloss: "restaurant" },
  { text: "아침", roman: "achim", gloss: "morning" },
  { text: "점심", roman: "jeomsim", gloss: "lunch" },
  { text: "저녁", roman: "jeonyeok", gloss: "dinner" },
  { text: "오늘", roman: "oneul", gloss: "today" },
  { text: "내일", roman: "naeil", gloss: "tomorrow" },
  { text: "어제", roman: "eoje", gloss: "yesterday" },
  { text: "봄", roman: "bom", gloss: "spring" },
  { text: "여름", roman: "yeoreum", gloss: "summer" },
  { text: "가을", roman: "gaeul", gloss: "autumn" },
  { text: "겨울", roman: "gyeoul", gloss: "winter" },
  { text: "시계", roman: "sigye", gloss: "clock" },
  { text: "우산", roman: "usan", gloss: "umbrella" },
  { text: "가방", roman: "gabang", gloss: "bag" },
  { text: "신발", roman: "sinbal", gloss: "shoes" },
  { text: "모자", roman: "moja", gloss: "hat" },
  { text: "안경", roman: "angyeong", gloss: "glasses" },
  { text: "우유", roman: "uyu", gloss: "milk" },
  { text: "딸기", roman: "ttalgi", gloss: "strawberry" },
  { text: "포도", roman: "podo", gloss: "grape" },
  { text: "수박", roman: "subak", gloss: "watermelon" },
  { text: "토마토", roman: "tomato", gloss: "tomato" },
  { text: "당근", roman: "danggeun", gloss: "carrot" },
  { text: "감자", roman: "gamja", gloss: "potato" },
  { text: "바람", roman: "baram", gloss: "wind" },
  { text: "구름", roman: "gureum", gloss: "cloud" },
  { text: "별", roman: "byeol", gloss: "star" },
  { text: "달", roman: "dal", gloss: "moon" },
  { text: "강", roman: "gang", gloss: "river" },
  { text: "산", roman: "san", gloss: "mountain" },
  { text: "눈", roman: "nun", gloss: "snow/eye" },
  { text: "비", roman: "bi", gloss: "rain" },
];

// 중복 제거(표제어 기준).
const seen = new Set<string>();
export const GAME_WORDS: GameWord[] = [...FROM_CORPUS, ...EXTRA].filter((w) => {
  if (seen.has(w.text)) return false;
  seen.add(w.text);
  return true;
});

// 영문 아케이드 단어 풀 — 초급 단어(3~7자). gloss = 한국어 뜻.
export const EN_GAME_WORDS: GameWord[] = [
  ["cat", "고양이"], ["dog", "개"], ["sun", "해"], ["run", "달리다"], ["fun", "재미"],
  ["big", "큰"], ["red", "빨강"], ["hot", "뜨거운"], ["box", "상자"], ["cup", "컵"],
  ["star", "별"], ["moon", "달"], ["tree", "나무"], ["book", "책"], ["fish", "물고기"],
  ["rain", "비"], ["snow", "눈"], ["home", "집"], ["food", "음식"], ["milk", "우유"],
  ["apple", "사과"], ["house", "집"], ["water", "물"], ["happy", "행복한"], ["music", "음악"],
  ["cloud", "구름"], ["green", "초록"], ["light", "빛"], ["dream", "꿈"], ["smile", "미소"],
  ["friend", "친구"], ["school", "학교"], ["family", "가족"], ["flower", "꽃"], ["orange", "오렌지"],
  ["planet", "행성"], ["rocket", "로켓"], ["garden", "정원"], ["window", "창문"], ["summer", "여름"],
].map(([text, gloss]) => ({ text, roman: "", gloss }));

/** 언어·최대 길이에 맞는 단어 하나를 무작위로. (브라우저 런타임이라 Math.random 사용) */
export function pickWord(lang: Lang, maxLen = 4): GameWord {
  const all = lang === "en" ? EN_GAME_WORDS : GAME_WORDS;
  const pool = all.filter((w) => Array.from(w.text).length <= maxLen);
  const src = pool.length > 0 ? pool : all;
  return src[Math.floor(Math.random() * src.length)];
}
