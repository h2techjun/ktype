import type { TypingStage } from "../types";

// 긴글 — 여러 문장 문단·속담·명언으로 리듬과 지구력. 속담/명언은 공유 자산, 문단은 자체 조합.
export const KO_LONG: TypingStage[] = [
  {
    id: "ko-long-intro",
    kind: "long",
    order: 1,
    title: { ko: "자기소개 문단", en: "Self-introduction" },
    items: [
      { text: "안녕하세요. 저는 학생입니다. 만나서 반가워요.", roman: "annyeonghaseyo. jeoneun haksaengimnida. mannaseo bangawoyo.", gloss: "Hello. I am a student. Nice to meet you." },
      { text: "제 취미는 독서와 운동입니다. 주말에는 산책을 자주 해요.", roman: "je chwimineun dokseowa undongimnida. jumareneun sanchaegeul jaju haeyo.", gloss: "My hobbies are reading and exercise. I often take walks on weekends." },
      { text: "한국어 공부는 조금 어렵지만 정말 재미있어요.", roman: "hangugeo gongbuneun jogeum eoryeopjiman jeongmal jaemiisseoyo.", gloss: "Studying Korean is a bit hard, but really fun." },
    ],
  },
  {
    id: "ko-long-daily",
    kind: "long",
    order: 2,
    title: { ko: "일상 문단", en: "Daily life" },
    items: [
      { text: "오늘 날씨가 참 좋네요. 같이 산책할까요?", roman: "oneul nalssiga cham jonneyo. gachi sanchaekhalkkayo?", gloss: "The weather is nice today. Shall we take a walk?" },
      { text: "아침에 일찍 일어나서 커피를 마셨어요. 기분이 상쾌했어요.", roman: "achime iljjik ireonaseo keopireul masyeosseoyo. gibuni sangkwaehaesseoyo.", gloss: "I woke up early and had coffee. I felt refreshed." },
      { text: "친구와 함께 영화를 보고 맛있는 저녁을 먹었어요.", roman: "chinguwa hamkke yeonghwareul bogo masinneun jeonyeogeul meogeosseoyo.", gloss: "I watched a movie with a friend and had a delicious dinner." },
    ],
  },
  {
    id: "ko-long-proverb",
    kind: "long",
    order: 3,
    title: { ko: "속담", en: "Proverbs" },
    items: [
      { text: "가는 말이 고와야 오는 말이 곱다.", roman: "ganeun mari gowaya oneun mari gopda.", gloss: "Kind words invite kind words in return." },
      { text: "티끌 모아 태산이 된다.", roman: "tikkeul moa taesani doenda.", gloss: "Many small things make a mountain." },
      { text: "천 리 길도 한 걸음부터 시작된다.", roman: "cheon ri gildo han georeumbuteo sijakdoenda.", gloss: "A journey of a thousand li begins with one step." },
      { text: "발 없는 말이 천 리 간다.", roman: "bal eomneun mari cheon ri ganda.", gloss: "Words travel a thousand li without legs." },
    ],
  },
  {
    id: "ko-long-quote",
    kind: "long",
    order: 4,
    title: { ko: "명언 · 격언", en: "Wise sayings" },
    items: [
      { text: "오늘 할 일을 내일로 미루지 마라.", roman: "oneul hal ireul naeillo miruji mara.", gloss: "Don't put off until tomorrow what you can do today." },
      { text: "실패는 성공의 어머니이다.", roman: "silpaeneun seonggongui eomeoniida.", gloss: "Failure is the mother of success." },
      { text: "노력은 배신하지 않는다.", roman: "noryeogeun baesinhaji anneunda.", gloss: "Effort never betrays you." },
    ],
  },
];
