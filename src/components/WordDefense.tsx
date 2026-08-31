import { useEffect, useReducer, useState } from "react";
import { defenseReducer, initDefense, MAX_HP, type Attacker } from "../arcade/defenseGame";
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

export function WordDefense({ onExit, uiLang, targetLang }: { onExit: () => void; uiLang: Lang; targetLang: Lang }) {
  const lang = targetLang;
  const [s, dispatch] = useReducer(defenseReducer, lang, initDefense);
  const [mood, setMood] = useState<Mood>("idle");
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const touch = useIsTouch();
  const layout = resolveKeyLayout(useSettingsStore((st) => st.keyLayout), touch);
  const typedText = typeText(s.typed);
  const L = gameLabels(uiLang);

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
    const text = ["한글 타자 · K-Type 🛡️ 성문 방어", `웨이브 ${s.wave} · 점수 ${s.score}`, "https://workmate.tools/ktype"].join("\n");
    const r = await shareResult(text);
    setShareMsg(r === "failed" ? "공유 실패" : r === "shared" ? "공유됨 ✓" : "복사됨 ✓");
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="rounded-lg px-3 py-1.5 text-sm" style={{ color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-subtle)" }}>← {L.home}</button>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: "var(--color-text-secondary)" }}>{L.wave} <b style={{ color: "var(--color-accent-hover)" }}>{s.wave}</b></span>
          <span aria-label={`성문 HP ${s.hp}`}>{"🛡️".repeat(Math.max(0, s.hp))}<span style={{ opacity: 0.25 }}>{"▫️".repeat(Math.max(0, MAX_HP - s.hp))}</span></span>
          <span className="tabular-nums font-bold" style={{ color: "var(--color-text-hero)" }}>{s.score}</span>
        </div>
      </div>

      <ArcadeField
        height={FIELD_H}
        scale={touch ? TOUCH_FIELD_SCALE : 1}
        background="radial-gradient(120% 100% at 50% 50%, #1a1226 0%, #07080b 72%)"
        overlay={
          s.status === "over" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm" style={{ background: "rgba(7,8,11,0.85)" }}>
            <Mascot mood="oops" size={72} />
            <div className="text-lg font-semibold" style={{ color: "var(--color-text-hero)" }}>{L.breached}</div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center"><span className="text-4xl font-extrabold tabular-nums" style={{ color: "var(--color-accent-hover)" }}>{s.score}</span><span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{L.score}</span></div>
              <div className="flex flex-col items-center"><span className="text-4xl font-extrabold tabular-nums" style={{ color: "var(--color-text-hero)" }}>{s.wave}</span><span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{L.wave}</span></div>
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
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2" style={{ width: 2, background: "var(--color-border-strong)" }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">🏯</div>
        {s.attackers.map((at) => (
          <AttackerView key={at.id} attacker={at} typedText={typedText} lang={lang} />
        ))}
      </ArcadeField>

      <ArcadeInputBar
        mood={mood}
        typedText={typedText}
        hint={L.hintDefense}
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

function AttackerView({ attacker, typedText, lang }: { attacker: Attacker; typedText: string; lang: Lang }) {
  const isTarget = typedText !== "" && textPrefixMatches(typedText, attacker.word.text, lang);
  const typedLen = isTarget ? Array.from(typedText).length : 0;
  const cells = Array.from(attacker.word.text);
  const xPct = attacker.side === "left" ? attacker.pos * 0.5 : 100 - attacker.pos * 0.5;
  const danger = attacker.pos > 75;

  return (
    <div
      className="absolute whitespace-nowrap rounded-lg px-2 py-1 text-xl font-bold transition-colors"
      style={{
        left: `${xPct}%`, top: `${attacker.laneYPct}%`,
        transform: `translateX(${attacker.side === "left" ? "0" : "-100%"}) translateY(-50%)`,
        background: isTarget ? "var(--color-accent-bg)" : "transparent",
        border: isTarget ? "1px solid var(--color-accent)" : "1px solid transparent",
        boxShadow: isTarget ? "0 0 14px -4px var(--color-accent)" : "none",
        color: danger ? "var(--color-danger)" : "var(--color-text-hero)",
      }}
    >
      {cells.map((ch, i) => (
        <span key={i} style={{ color: i < typedLen ? "var(--color-accent-hover)" : undefined }}>{ch}</span>
      ))}
    </div>
  );
}
