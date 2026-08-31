import type { Lang } from "../typing/engine";

// 게임 화면 공통 라벨(ko/en).
export interface GameLabels {
  home: string;
  retry: string;
  share: string;
  copied: string;
  shared: string;
  failed: string;
  score: string;
  level: string;
  wave: string;
  cleared: string;
  popped: string;
  words: string;
  maxCombo: string;
  gameOver: string;
  timeUp: string;
  breached: string;
  hintFalling: string;
  hintSpeed: string;
  hintBubble: string;
  hintDefense: string;
}

const EN: GameLabels = {
  home: "Home", retry: "Retry", share: "Share result", copied: "Copied ✓", shared: "Shared ✓", failed: "Failed",
  score: "Score", level: "Level", wave: "Wave", cleared: "Cleared", popped: "Popped", words: "Words", maxCombo: "Max Combo",
  gameOver: "Game Over", timeUp: "Time's up!", breached: "Gate breached!",
  hintFalling: "Type the falling words", hintSpeed: "Type the word", hintBubble: "Pop the bubbles", hintDefense: "Defend the gate",
};

const KO: GameLabels = {
  home: "홈", retry: "다시 하기", share: "결과 공유", copied: "복사됨 ✓", shared: "공유됨 ✓", failed: "공유 실패",
  score: "점수", level: "레벨", wave: "웨이브", cleared: "클리어", popped: "터뜨림", words: "단어", maxCombo: "최대 콤보",
  gameOver: "게임 오버", timeUp: "시간 종료!", breached: "성문 함락!",
  hintFalling: "떨어지는 단어를 입력하세요", hintSpeed: "단어를 입력하세요", hintBubble: "버블 단어를 입력하세요", hintDefense: "다가오는 단어를 입력하세요",
};

export function gameLabels(lang: Lang): GameLabels {
  return lang === "en" ? EN : KO;
}
