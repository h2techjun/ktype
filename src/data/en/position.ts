import type { TypingStage } from "../types";

// English key drills — standard touch-typing order (home row → top → bottom → full).
export const EN_POSITION: TypingStage[] = [
  {
    id: "en-pos-home",
    kind: "position",
    order: 1,
    title: { ko: "홈로우", en: "Home row" },
    subtitle: { ko: "asdf jkl;", en: "asdf jkl;" },
    items: [
      { text: "asdf" }, { text: "jkl;" }, { text: "fj" }, { text: "dk" }, { text: "sl" }, { text: "a;" },
      { text: "as" }, { text: "ask" }, { text: "dad" }, { text: "sad" }, { text: "lad" }, { text: "fall" },
      { text: "gas" }, { text: "hall" }, { text: "flask" }, { text: "salad" },
    ],
  },
  {
    id: "en-pos-top",
    kind: "position",
    order: 2,
    title: { ko: "윗줄", en: "Top row" },
    subtitle: { ko: "qwerty uiop", en: "qwerty uiop" },
    items: [
      { text: "we" }, { text: "you" }, { text: "try" }, { text: "type" }, { text: "quiet" }, { text: "power" },
      { text: "write" }, { text: "paper" }, { text: "party" }, { text: "report" }, { text: "pretty" }, { text: "typewriter" },
    ],
  },
  {
    id: "en-pos-bottom",
    kind: "position",
    order: 3,
    title: { ko: "아랫줄", en: "Bottom row" },
    subtitle: { ko: "zxcv bnm", en: "zxcv bnm" },
    items: [
      { text: "van" }, { text: "cab" }, { text: "man" }, { text: "box" }, { text: "zoom" }, { text: "climb" },
      { text: "number" }, { text: "voice" }, { text: "brave" }, { text: "vacation" }, { text: "maximum" }, { text: "November" },
    ],
  },
  {
    id: "en-pos-full",
    kind: "position",
    order: 4,
    title: { ko: "전체 자판", en: "Full keyboard" },
    subtitle: { ko: "대문자·문장부호", en: "capitals & punctuation" },
    items: [
      { text: "The" }, { text: "quick" }, { text: "brown" }, { text: "fox" }, { text: "jumps" },
      { text: "Hello, World!" }, { text: "It's a nice day." }, { text: "Type it right." },
      { text: "Keep going!" }, { text: "Well done." },
    ],
  },
];
