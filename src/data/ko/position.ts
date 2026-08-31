import type { TypingStage } from "../types";

// 자리연습 — 한컴타자연습 두벌식 표준 8단계. 홈로우에서 바깥으로, 배운 자모만 사용.
// 근거: 한컴 공식 자리연습 커리큘럼 + 자모 빈도(초성 ㄱ·중성 ㅏ·종성 ㄴ 최다).
export const KO_POSITION: TypingStage[] = [
  {
    id: "ko-pos-home",
    kind: "position",
    order: 1,
    title: { ko: "기본자리", en: "Home row" },
    subtitle: { ko: "ㅁㄴㅇㄹ · ㅓㅏㅣ", en: "ㅁㄴㅇㄹ · ㅓㅏㅣ" },
    items: [
      { text: "아" }, { text: "어" }, { text: "이" }, { text: "마" }, { text: "머" }, { text: "미" },
      { text: "나" }, { text: "너" }, { text: "니" }, { text: "라" }, { text: "러" }, { text: "리" },
      { text: "나라", roman: "nara", gloss: "country" }, { text: "머리", roman: "meori", gloss: "head" },
    ],
  },
  {
    id: "ko-pos-left-top",
    kind: "position",
    order: 2,
    title: { ko: "왼손 윗자리", en: "Left upper row" },
    subtitle: { ko: "ㅂㅈㄷㄱ", en: "ㅂㅈㄷㄱ" },
    items: [
      { text: "가" }, { text: "거" }, { text: "기" }, { text: "다" }, { text: "더" }, { text: "디" },
      { text: "바" }, { text: "버" }, { text: "비" }, { text: "자" }, { text: "저" }, { text: "지" },
      { text: "바다", roman: "bada", gloss: "sea" }, { text: "가지", roman: "gaji", gloss: "eggplant" },
    ],
  },
  {
    id: "ko-pos-left-bottom",
    kind: "position",
    order: 3,
    title: { ko: "왼손 아랫자리", en: "Left lower row" },
    subtitle: { ko: "ㅋㅌㅊㅍ", en: "ㅋㅌㅊㅍ" },
    items: [
      { text: "카" }, { text: "커" }, { text: "키" }, { text: "타" }, { text: "터" }, { text: "티" },
      { text: "차" }, { text: "처" }, { text: "치" }, { text: "파" }, { text: "퍼" }, { text: "피" },
      { text: "치마", roman: "chima", gloss: "skirt" }, { text: "기차", roman: "gicha", gloss: "train" },
    ],
  },
  {
    id: "ko-pos-index",
    kind: "position",
    order: 4,
    title: { ko: "검지자리", en: "Index & round vowels" },
    subtitle: { ko: "ㅅㅎ · ㅗㅜㅛㅠ", en: "ㅅㅎ · ㅗㅜㅛㅠ" },
    items: [
      { text: "사" }, { text: "서" }, { text: "시" }, { text: "소" }, { text: "수" }, { text: "하" },
      { text: "허" }, { text: "히" }, { text: "호" }, { text: "후" }, { text: "슈" }, { text: "휴" },
      { text: "사자", roman: "saja", gloss: "lion" }, { text: "하마", roman: "hama", gloss: "hippo" },
    ],
  },
  {
    id: "ko-pos-right-top",
    kind: "position",
    order: 5,
    title: { ko: "오른손 윗자리", en: "Right upper row" },
    subtitle: { ko: "ㅕㅑㅐㅔ", en: "ㅕㅑㅐㅔ" },
    items: [
      { text: "야" }, { text: "여" }, { text: "얘" }, { text: "예" }, { text: "개" }, { text: "새" },
      { text: "배" }, { text: "대" }, { text: "재" }, { text: "채" }, { text: "매" }, { text: "해" },
      { text: "얘기", roman: "yaegi", gloss: "story" }, { text: "새해", roman: "saehae", gloss: "New Year" },
    ],
  },
  {
    id: "ko-pos-right-bottom",
    kind: "position",
    order: 6,
    title: { ko: "오른손 아랫자리", en: "Right lower row" },
    subtitle: { ko: "ㅡ", en: "ㅡ" },
    items: [
      { text: "그" }, { text: "느" }, { text: "드" }, { text: "르" }, { text: "므" }, { text: "브" },
      { text: "스" }, { text: "즈" }, { text: "크" }, { text: "트" }, { text: "프" }, { text: "흐" },
      { text: "그림", roman: "geurim", gloss: "picture" }, { text: "스키", roman: "seuki", gloss: "ski" },
    ],
  },
  {
    id: "ko-pos-batchim",
    kind: "position",
    order: 7,
    title: { ko: "받침", en: "Final consonants" },
    subtitle: { ko: "홑받침", en: "single batchim" },
    items: [
      { text: "강" }, { text: "산" }, { text: "말" }, { text: "밥" }, { text: "곰" }, { text: "손" },
      { text: "발" }, { text: "문" }, { text: "길" }, { text: "방" },
      { text: "사람", roman: "saram", gloss: "person" }, { text: "하늘", roman: "haneul", gloss: "sky" },
      { text: "가족", roman: "gajok", gloss: "family" }, { text: "학교", roman: "hakgyo", gloss: "school" },
    ],
  },
  {
    id: "ko-pos-double",
    kind: "position",
    order: 8,
    title: { ko: "겹모음·겹받침", en: "Compound vowels & clusters" },
    subtitle: { ko: "과 의 닭 값", en: "과 의 닭 값" },
    items: [
      { text: "과" }, { text: "왜" }, { text: "외" }, { text: "워" }, { text: "의" }, { text: "값" },
      { text: "닭" }, { text: "앉" }, { text: "몫" }, { text: "삶" },
      { text: "과일", roman: "gwail", gloss: "fruit" }, { text: "의자", roman: "uija", gloss: "chair" },
      { text: "읽다", roman: "ikda", gloss: "to read" }, { text: "괜찮아", roman: "gwaenchana", gloss: "it's okay" },
    ],
  },
];
