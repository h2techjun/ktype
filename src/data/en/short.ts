import type { TypingStage } from "../types";

// English short text — one-breath everyday phrases.
export const EN_SHORT: TypingStage[] = [
  {
    id: "en-short-greet",
    kind: "short",
    order: 1,
    title: { ko: "인사 표현", en: "Greetings" },
    items: [
      { text: "Nice to meet you.", gloss: "만나서 반가워요." },
      { text: "How are you today?", gloss: "오늘 어떠세요?" },
      { text: "Have a great day!", gloss: "좋은 하루 되세요!" },
      { text: "See you tomorrow.", gloss: "내일 봐요." },
      { text: "Take care of yourself.", gloss: "몸조심하세요." },
    ],
  },
  {
    id: "en-short-daily",
    kind: "short",
    order: 2,
    title: { ko: "생활 표현", en: "Everyday phrases" },
    items: [
      { text: "Practice makes perfect.", gloss: "연습이 완벽을 만든다." },
      { text: "Type fast and stay accurate.", gloss: "빠르고 정확하게 치세요." },
      { text: "Keep your eyes on the screen.", gloss: "화면을 계속 보세요." },
      { text: "You are doing great.", gloss: "정말 잘하고 있어요." },
      { text: "Let's try one more time.", gloss: "한 번 더 해봐요." },
    ],
  },
  {
    id: "en-short-question",
    kind: "short",
    order: 3,
    title: { ko: "질문 표현", en: "Questions" },
    items: [
      { text: "What is your name?", gloss: "이름이 뭐예요?" },
      { text: "Where are you from?", gloss: "어디에서 왔어요?" },
      { text: "How much is this?", gloss: "이거 얼마예요?" },
      { text: "Can you help me, please?", gloss: "도와주실 수 있나요?" },
      { text: "What time is it now?", gloss: "지금 몇 시예요?" },
    ],
  },
];
