import { useState } from "react";
import { useSettingsStore } from "./store/useSettingsStore";
import { HomeScreen } from "./components/HomeScreen";
import { Practice } from "./components/Practice";
import { FallingWords } from "./components/FallingWords";
import { WordDefense } from "./components/WordDefense";
import { BubblePop } from "./components/BubblePop";
import { SpeedRun } from "./components/SpeedRun";

type View = "home" | "practice" | "falling" | "defense" | "bubble" | "speed";

export default function App() {
  const [view, setView] = useState<View>("home");
  const uiLang = useSettingsStore((s) => s.uiLang);
  const targetLang = useSettingsStore((s) => s.targetLang);
  const home = () => setView("home");

  if (view === "practice") return <Practice onHome={home} />;
  if (view === "falling") return <FallingWords onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  if (view === "defense") return <WordDefense onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  if (view === "bubble") return <BubblePop onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  if (view === "speed") return <SpeedRun onExit={home} uiLang={uiLang} targetLang={targetLang} />;
  return <HomeScreen onPractice={() => setView("practice")} onGame={(id) => setView(id as View)} />;
}
