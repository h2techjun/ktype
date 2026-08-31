import { useGameStore } from "../store/useGameStore";
import { StageSelect } from "./StageSelect";
import { TypingScreen } from "./TypingScreen";
import { ResultCard } from "./ResultCard";

// 연습(학습) 모드 라우팅 — 스테이지 선택 → 타이핑 → 결과.
export function Practice({ onHome }: { onHome: () => void }) {
  const phase = useGameStore((s) => s.phase);
  if (phase === "playing") return <TypingScreen />;
  if (phase === "done") return <ResultCard />;
  return <StageSelect onHome={onHome} />;
}
