import type { TypingStage } from "../types";

// 짧은글 — 한 호흡의 실생활 표현(인사·생활·질문·감정·식당). 표제어=사실, gloss 자체 작성.
export const KO_SHORT: TypingStage[] = [
  {
    id: "ko-short-greet",
    kind: "short",
    order: 1,
    title: { ko: "인사 표현", en: "Greetings" },
    items: [
      { text: "안녕하세요", roman: "annyeonghaseyo", gloss: "Hello" },
      { text: "감사합니다", roman: "gamsahamnida", gloss: "Thank you" },
      { text: "만나서 반가워요", roman: "mannaseo bangawoyo", gloss: "Nice to meet you" },
      { text: "잘 부탁드립니다", roman: "jal butakdeurimnida", gloss: "I look forward to it" },
      { text: "안녕히 가세요", roman: "annyeonghi gaseyo", gloss: "Goodbye" },
      { text: "또 만나요", roman: "tto mannayo", gloss: "See you again" },
    ],
  },
  {
    id: "ko-short-daily",
    kind: "short",
    order: 2,
    title: { ko: "생활 표현", en: "Everyday phrases" },
    items: [
      { text: "맛있게 드세요", roman: "masitge deuseyo", gloss: "Enjoy your meal" },
      { text: "좋은 하루 되세요", roman: "joeun haru doeseyo", gloss: "Have a nice day" },
      { text: "수고하셨습니다", roman: "sugohasyeotseumnida", gloss: "Good job / Thanks for your work" },
      { text: "잘 먹겠습니다", roman: "jal meokgetseumnida", gloss: "Thanks for the meal" },
      { text: "조심히 들어가세요", roman: "josimhi deureogaseyo", gloss: "Get home safely" },
      { text: "다음에 봐요", roman: "daeume bwayo", gloss: "See you next time" },
    ],
  },
  {
    id: "ko-short-question",
    kind: "short",
    order: 3,
    title: { ko: "질문 표현", en: "Questions" },
    items: [
      { text: "이거 얼마예요", roman: "igeo eolmayeyo", gloss: "How much is this?" },
      { text: "화장실이 어디예요", roman: "hwajangsiri eodiyeyo", gloss: "Where is the restroom?" },
      { text: "이름이 뭐예요", roman: "ireumi mwoyeyo", gloss: "What is your name?" },
      { text: "지금 몇 시예요", roman: "jigeum myeot siyeyo", gloss: "What time is it now?" },
      { text: "천천히 말해 주세요", roman: "cheoncheonhi malhae juseyo", gloss: "Please speak slowly" },
      { text: "도와주세요", roman: "dowajuseyo", gloss: "Please help me" },
    ],
  },
  {
    id: "ko-short-feel",
    kind: "short",
    order: 4,
    title: { ko: "감정 표현", en: "Feelings" },
    items: [
      { text: "정말 기뻐요", roman: "jeongmal gippeoyo", gloss: "I'm really happy" },
      { text: "조금 피곤해요", roman: "jogeum pigonhaeyo", gloss: "I'm a little tired" },
      { text: "너무 재미있어요", roman: "neomu jaemiisseoyo", gloss: "It's so much fun" },
      { text: "괜찮아요 걱정 마세요", roman: "gwaenchanayo geokjeong maseyo", gloss: "It's okay, don't worry" },
      { text: "축하합니다", roman: "chukahamnida", gloss: "Congratulations" },
      { text: "사랑합니다", roman: "saranghamnida", gloss: "I love you" },
    ],
  },
];
