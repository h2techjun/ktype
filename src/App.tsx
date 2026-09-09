import { useState } from "react";
import { useSettingsStore } from "./store/useSettingsStore";
import { useGameStore } from "./store/useGameStore";
import { QuickPlay } from "./components/QuickPlay";
import { HomeScreen } from "./components/HomeScreen";
import { Practice } from "./components/Practice";
import { FallingWords } from "./components/FallingWords";
import { WordDefense } from "./components/WordDefense";
import { BubblePop } from "./components/BubblePop";
import { SpeedRun } from "./components/SpeedRun";

// 첫 화면 = 스피드체크(quick). 메뉴(home)는 게임·연습으로 가는 두 번째 화면이다.
type View = "quick" | "home" | "practice" | "falling" | "defense" | "bubble" | "speed";

export default function App() {
  const [view, setView] = useState<View>("quick");
  const uiLang = useSettingsStore((s) => s.uiLang);
  const targetLang = useSettingsStore((s) => s.targetLang);

  // 스피드체크와 연습은 같은 엔진(useGameStore)을 쓴다 — 화면을 옮길 때 진행 중 라운드를 비운다.
  const go = (v: View) => () => {
    useGameStore.getState().backToSelect();
    setView(v);
  };
  const quick = go("quick");
  const home = go("home");

  if (view === "practice") return <Practice onHome={quick} />;
  if (view === "falling") return <FallingWords onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  if (view === "defense") return <WordDefense onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  if (view === "bubble") return <BubblePop onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  if (view === "speed") return <SpeedRun onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  if (view === "home") return <HomeScreen onQuick={quick} onPractice={go("practice")} onGame={(id) => setView(id as View)} />;
  return <QuickPlay onPractice={go("practice")} onGames={home} />;
}
