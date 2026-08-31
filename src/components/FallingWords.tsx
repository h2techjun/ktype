import { useEffect, useReducer, useState } from "react";
import { fallingReducer, initFalling, FIELD_H, type Faller } from "../arcade/fallingGame";
import { useGameLoop } from "../arcade/useGameLoop";
import { useArcadeInput, arcadeVirtualKey, arcadeTap } from "../arcade/useArcadeInput";
import { typeText, textPrefixMatches, type Lang } from "../typing/engine";
import { gameLabels, type GameLabels } from "../arcade/labels";
import { useIsTouch } from "../lib/useIsTouch";
import { useSettingsStore, resolveKeyLayout } from "../store/useSettingsStore";
import { sound } from "../lib/sound";
import { shareResult } from "../lib/share";
import { ArcadeField, ArcadeInputBar, TOUCH_FIELD_SCALE } from "./ArcadeShell";
import { Mascot, type Mood } from "./Mascot";

export function FallingWords({ onExit, uiLang, targetLang }: { onExit: () => void; uiLang: Lang; targetLang: Lang }) {
  const lang = targetLang;
  const [s, dispatch] = useReducer(fallingReducer, lang, initFalling);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [mood, setMood] = useState<Mood>("idle");
  const touch = useIsTouch();
  const layout = resolveKeyLayout(useSettingsStore((st) => st.keyLayout), touch);

  const typedText = typeText(s.typed);
  const L = gameLabels(uiLang);

  useArcadeInput(lang, dispatch);
  useGameLoop((dt) => dispatch({ t: "tick", dt }), s.status === "playing");

  useEffect(() => {
    if (!s.fx) return;
    sound.correct();
    setMood("happy");
    const t = window.setTimeout(() => setMood("idle"), 500);
    return () => window.clearTimeout(t);
  }, [s.fx]);

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
    const text = ["한글 타자 · K-Type 🌠 별똥별", `점수 ${s.score} · 레벨 ${s.level}`, "https://workmate.tools/ktype"].join("\n");
    const r = await shareResult(text);
    setShareMsg(r === "failed" ? "공유 실패" : r === "shared" ? "공유됨 ✓" : "복사됨 ✓");
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="rounded-lg px-3 py-1.5 text-sm" style={{ color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-subtle)" }}>← {L.home}</button>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: "var(--color-text-secondary)" }}>Lv.<b style={{ color: "var(--color-accent-hover)" }}>{s.level}</b></span>
          <span aria-label={`생명 ${s.lives}`}>{"❤️".repeat(Math.max(0, s.lives))}<span style={{ opacity: 0.25 }}>{"🤍".repeat(Math.max(0, 5 - s.lives))}</span></span>
          <span className="tabular-nums font-bold" style={{ color: "var(--color-text-hero)" }}>{s.score}</span>
        </div>
      </div>

      <ArcadeField
        height={FIELD_H}
        scale={touch ? TOUCH_FIELD_SCALE : 1}
        background="radial-gradient(120% 80% at 50% 0%, #12142b 0%, #07080b 70%)"
        overlay={
          s.status === "over" ? (
            <GameOver score={s.score} level={s.level} shareMsg={shareMsg} labels={L} onRetry={() => { setShareMsg(null); dispatch({ t: "reset" }); }} onShare={onShare} onExit={onExit} />
          ) : null
        }
      >
        <Stars />
        {s.fallers.map((f) => (
          <FallerView key={f.id} faller={f} typedText={typedText} lang={lang} />
        ))}
        {s.fx && <KillBurst xPct={s.fx.xPct} y={s.fx.y} />}
      </ArcadeField>

      <ArcadeInputBar
        mood={mood}
        typedText={typedText}
        hint={L.hintFalling}
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

function FallerView({ faller, typedText, lang }: { faller: Faller; typedText: string; lang: Lang }) {
  const isTarget = typedText !== "" && textPrefixMatches(typedText, faller.word.text, lang);
  const typedLen = isTarget ? Array.from(typedText).length : 0;
  const cells = Array.from(faller.word.text);
  const depth = faller.y / FIELD_H;

  return (
    <div
      className="absolute -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-2xl font-bold transition-colors"
      style={{
        left: `${faller.xPct}%`, top: faller.y,
        background: isTarget ? "var(--color-accent-bg)" : "transparent",
        border: isTarget ? "1px solid var(--color-accent)" : "1px solid transparent",
        boxShadow: isTarget ? "0 0 16px -4px var(--color-accent)" : "none",
        color: depth > 0.75 ? "var(--color-danger)" : "var(--color-text-hero)",
      }}
    >
      {cells.map((ch, i) => (
        <span key={i} style={{ color: i < typedLen ? "var(--color-accent-hover)" : undefined }}>{ch}</span>
      ))}
    </div>
  );
}

function KillBurst({ xPct, y }: { xPct: number; y: number }) {
  return (
    <div className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${xPct}%`, top: y }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className="ktype-pop absolute block h-1.5 w-1.5 rounded-full" style={{ background: ["#3aabf7", "#fbbf24", "#10b981"][i % 3], transform: `rotate(${i * 45}deg) translateY(-14px)` }} />
      ))}
      <span className="ktype-pop text-lg font-extrabold" style={{ color: "var(--color-accent-hover)" }}>✦</span>
    </div>
  );
}

function Stars() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 30 }).map((_, i) => (
        <span key={i} className="absolute block rounded-full" style={{ left: `${(i * 37 + 5) % 100}%`, top: `${(i * 53 + 11) % 100}%`, width: i % 5 === 0 ? 2.5 : 1.5, height: i % 5 === 0 ? 2.5 : 1.5, background: "#b5e1ff", opacity: 0.35 }} />
      ))}
    </div>
  );
}

function GameOver({ score, level, shareMsg, labels, onRetry, onShare, onExit }: { score: number; level: number; shareMsg: string | null; labels: GameLabels; onRetry: () => void; onShare: () => void; onExit: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm" style={{ background: "rgba(7,8,11,0.82)" }}>
      <Mascot mood="oops" size={72} />
      <div className="text-lg font-semibold" style={{ color: "var(--color-text-hero)" }}>{labels.gameOver}</div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center"><span className="text-4xl font-extrabold tabular-nums" style={{ color: "var(--color-accent-hover)" }}>{score}</span><span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{labels.score}</span></div>
        <div className="flex flex-col items-center"><span className="text-4xl font-extrabold tabular-nums" style={{ color: "var(--color-text-hero)" }}>{level}</span><span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{labels.level}</span></div>
      </div>
      <div className="flex w-64 flex-col gap-2">
        <button onClick={onRetry} className="w-full rounded-xl py-3 text-base font-semibold active:scale-95" style={{ background: "var(--color-accent)", color: "#fff" }}>{labels.retry}</button>
        <div className="flex gap-2">
          <button onClick={onShare} className="flex-1 rounded-xl py-2.5 text-sm active:scale-95" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{shareMsg ?? labels.share}</button>
          <button onClick={onExit} className="flex-1 rounded-xl py-2.5 text-sm active:scale-95" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{labels.home}</button>
        </div>
      </div>
    </div>
  );
}
