import { useEffect, useReducer, useState } from "react";
import { bubbleReducer, initBubble, BUBBLE_DURATION, type Bubble } from "../arcade/bubbleGame";
import { useGameLoop } from "../arcade/useGameLoop";
import { useArcadeInput, arcadeVirtualKey, arcadeTap } from "../arcade/useArcadeInput";
import { typeText, textPrefixMatches, type Lang } from "../typing/engine";
import { gameLabels } from "../arcade/labels";
import { useIsTouch } from "../lib/useIsTouch";
import { useSettingsStore, resolveKeyLayout } from "../store/useSettingsStore";
import { sound } from "../lib/sound";
import { shareResult } from "../lib/share";
import { ArcadeField, ArcadeInputBar, TOUCH_FIELD_SCALE } from "./ArcadeShell";
import { Mascot, type Mood } from "./Mascot";

const FIELD_H = 440;
const COLORS = ["#128fe8", "#38bdf8", "#10b981", "#f59e0b", "#ec4899"];

export function BubblePop({ onExit, uiLang, targetLang }: { onExit: () => void; uiLang: Lang; targetLang: Lang }) {
  const lang = targetLang;
  const [s, dispatch] = useReducer(bubbleReducer, lang, initBubble);
  const [mood, setMood] = useState<Mood>("idle");
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const touch = useIsTouch();
  const layout = resolveKeyLayout(useSettingsStore((st) => st.keyLayout), touch);
  const typedText = typeText(s.typed);
  const L = gameLabels(uiLang);
  const timeRatio = s.timeLeftMs / BUBBLE_DURATION;

  useArcadeInput(lang, dispatch);
  useGameLoop((dt) => dispatch({ t: "tick", dt }), s.status === "playing");

  useEffect(() => {
    if (s.fxSeq === 0) return;
    sound.correct();
    setMood("happy");
    const t = window.setTimeout(() => setMood("idle"), 350);
    return () => window.clearTimeout(t);
  }, [s.fxSeq]);

  useEffect(() => {
    if (s.shake === 0) return;
    sound.error();
    setMood("oops");
    const t = window.setTimeout(() => setMood("idle"), 400);
    return () => window.clearTimeout(t);
  }, [s.shake]);

  useEffect(() => {
    if (s.status === "over") sound.complete();
  }, [s.status]);

  const onShare = async () => {
    const text = ["한글 타자 · K-Type 🫧 버블 팝", `${s.popped}개 · 점수 ${s.score}`, "https://workmate.tools/ktype"].join("\n");
    const r = await shareResult(text);
    setShareMsg(r === "failed" ? "공유 실패" : r === "shared" ? "공유됨 ✓" : "복사됨 ✓");
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="rounded-lg px-3 py-1.5 text-sm" style={{ color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-subtle)" }}>← {L.home}</button>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: "var(--color-text-secondary)" }}>{L.popped} <b style={{ color: "var(--color-text-hero)" }}>{s.popped}</b></span>
          <span className="tabular-nums font-bold" style={{ color: "var(--color-text-hero)" }}>{s.score}</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--color-bg-card)" }}>
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${timeRatio * 100}%`, background: timeRatio < 0.2 ? "var(--color-danger)" : "var(--color-success)" }} />
      </div>

      <ArcadeField
        height={FIELD_H}
        scale={touch ? TOUCH_FIELD_SCALE : 1}
        background="radial-gradient(120% 90% at 50% 100%, #0d1a24 0%, #07080b 70%)"
        overlay={
          s.status === "over" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm" style={{ background: "rgba(7,8,11,0.85)" }}>
            <Mascot mood="celebrate" size={72} />
            <div className="text-lg font-semibold" style={{ color: "var(--color-text-hero)" }}>{L.timeUp}</div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center"><span className="text-4xl font-extrabold tabular-nums" style={{ color: "var(--color-accent-hover)" }}>{s.score}</span><span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{L.score}</span></div>
              <div className="flex flex-col items-center"><span className="text-4xl font-extrabold tabular-nums" style={{ color: "var(--color-text-hero)" }}>{s.popped}</span><span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{L.popped}</span></div>
            </div>
            <div className="flex w-64 flex-col gap-2">
              <button onClick={() => { setShareMsg(null); dispatch({ t: "reset" }); }} className="w-full rounded-xl py-3 text-base font-semibold active:scale-95" style={{ background: "var(--color-accent)", color: "#fff" }}>{L.retry}</button>
              <div className="flex gap-2">
                <button onClick={onShare} className="flex-1 rounded-xl py-2.5 text-sm active:scale-95" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{shareMsg ?? L.share}</button>
                <button onClick={onExit} className="flex-1 rounded-xl py-2.5 text-sm active:scale-95" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{L.home}</button>
              </div>
            </div>
            </div>
          ) : null
        }
      >
        {s.bubbles.map((b) => (
          <BubbleView key={b.id} bubble={b} color={COLORS[b.id % COLORS.length]} typedText={typedText} lang={lang} />
        ))}
      </ArcadeField>

      <ArcadeInputBar
        mood={mood}
        typedText={typedText}
        hint={L.hintBubble}
        lang={lang}
        uiLang={uiLang}
        layout={layout}
        onKey={arcadeVirtualKey(dispatch)}
        onTap={arcadeTap(dispatch)}
        showKeyboard={touch}
      />
    </div>
  );
}

function BubbleView({ bubble, color, typedText, lang }: { bubble: Bubble; color: string; typedText: string; lang: Lang }) {
  const isTarget = typedText !== "" && textPrefixMatches(typedText, bubble.word.text, lang);
  const typedLen = isTarget ? Array.from(typedText).length : 0;
  const cells = Array.from(bubble.word.text);
  const size = 46 + cells.length * 16;

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xl font-bold"
      style={{
        left: `${bubble.xPct}%`, top: `${bubble.yPct}%`, width: size, height: size,
        background: `radial-gradient(circle at 35% 30%, ${color}cc, ${color}55)`,
        border: `2px solid ${isTarget ? "#fff" : color}`,
        boxShadow: isTarget ? `0 0 20px -2px ${color}` : `0 0 12px -6px ${color}`,
      }}
    >
      {cells.map((ch, i) => (
        <span key={i} style={{ color: i < typedLen ? "#fff" : "var(--color-text-hero)" }}>{ch}</span>
      ))}
    </div>
  );
}
