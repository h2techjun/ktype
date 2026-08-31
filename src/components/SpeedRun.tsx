import { useEffect, useReducer, useState } from "react";
import { speedReducer, initSpeed, SPEED_DURATION } from "../arcade/speedGame";
import { useGameLoop } from "../arcade/useGameLoop";
import { useArcadeInput, arcadeVirtualKey, arcadeTap } from "../arcade/useArcadeInput";
import { typeText, type Lang } from "../typing/engine";
import { gameLabels } from "../arcade/labels";
import { useIsTouch } from "../lib/useIsTouch";
import { useSettingsStore, resolveKeyLayout } from "../store/useSettingsStore";
import { sound } from "../lib/sound";
import { shareResult } from "../lib/share";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Mascot, type Mood } from "./Mascot";

export function SpeedRun({ onExit, uiLang, targetLang }: { onExit: () => void; uiLang: Lang; targetLang: Lang }) {
  const lang = targetLang;
  const [s, dispatch] = useReducer(speedReducer, lang, initSpeed);
  const [mood, setMood] = useState<Mood>("idle");
  const [shakeOn, setShakeOn] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const touch = useIsTouch();
  const layout = resolveKeyLayout(useSettingsStore((st) => st.keyLayout), touch);

  const typedText = typeText(s.typed);
  const L = gameLabels(uiLang);
  const cells = Array.from(s.word.text);
  const typedLen = Array.from(typedText).length;
  const timeRatio = s.timeLeftMs / SPEED_DURATION;

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
    setShakeOn(true);
    setMood("oops");
    const t1 = window.setTimeout(() => setShakeOn(false), 220);
    const t2 = window.setTimeout(() => setMood("idle"), 400);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [s.shake]);

  useEffect(() => {
    if (s.status === "over") sound.complete();
  }, [s.status]);

  const onShare = async () => {
    const text = ["한글 타자 · K-Type ⚡ 스피드런", `${s.cleared}단어 · 점수 ${s.score} · 최대 콤보 ${s.maxCombo}`, "https://workmate.tools/ktype"].join("\n");
    const r = await shareResult(text);
    setShareMsg(r === "failed" ? "공유 실패" : r === "shared" ? "공유됨 ✓" : "복사됨 ✓");
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="rounded-lg px-3 py-1.5 text-sm" style={{ color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-subtle)" }}>← {L.home}</button>
        <div className="flex items-center gap-4 text-sm">
          <span style={{ color: "var(--color-text-secondary)" }}>{L.cleared} <b style={{ color: "var(--color-text-hero)" }}>{s.cleared}</b></span>
          <span style={{ color: s.combo >= 2 ? "var(--color-accent-hover)" : "var(--color-text-muted)" }}>{s.combo}× {lang === "en" ? "combo" : "콤보"}</span>
          <span className="tabular-nums font-bold" style={{ color: "var(--color-text-hero)" }}>{s.score}</span>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--color-bg-card)" }}>
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${timeRatio * 100}%`, background: timeRatio < 0.25 ? "var(--color-danger)" : "var(--color-accent)" }} />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4">
        <div className={`text-center ${shakeOn ? "ktype-shake" : ""}`}>
          <div className="text-6xl font-black tracking-wide">
            {cells.map((ch, i) => (
              <span key={i} style={{ color: i < typedLen ? "var(--color-accent-hover)" : "var(--color-text-hero)" }}>{ch}</span>
            ))}
          </div>
          {(s.word.roman || s.word.gloss) && (
            <div className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              {s.word.roman && <span className="italic">{s.word.roman}</span>}
              {s.word.roman && s.word.gloss && " · "}
              {s.word.gloss}
            </div>
          )}
        </div>
        <Mascot mood={mood} size={56} />

        {s.status === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl backdrop-blur-sm" style={{ background: "rgba(7,8,11,0.85)" }}>
            <Mascot mood="celebrate" size={72} />
            <div className="text-lg font-semibold" style={{ color: "var(--color-text-hero)" }}>{L.timeUp}</div>
            <div className="flex items-center gap-6">
              <Stat label={L.words} value={s.cleared} />
              <Stat label={L.score} value={s.score} accent />
              <Stat label={L.maxCombo} value={s.maxCombo} />
            </div>
            <div className="flex w-64 flex-col gap-2">
              <button onClick={() => { setShareMsg(null); dispatch({ t: "reset" }); }} className="w-full rounded-xl py-3 text-base font-semibold active:scale-95" style={{ background: "var(--color-accent)", color: "#fff" }}>{L.retry}</button>
              <div className="flex gap-2">
                <button onClick={onShare} className="flex-1 rounded-xl py-2.5 text-sm active:scale-95" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{shareMsg ?? L.share}</button>
                <button onClick={onExit} className="flex-1 rounded-xl py-2.5 text-sm active:scale-95" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{L.home}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex h-12 items-center justify-center rounded-xl text-2xl font-bold" style={{ background: "var(--color-bg-card)", color: typedText ? "var(--color-accent-hover)" : "var(--color-text-muted)", border: "1px solid var(--color-border-subtle)" }}>
        {typedText || L.hintSpeed}
      </div>

      {touch && (
        <VirtualKeyboard
          lang={lang}
          uiLang={uiLang}
          layout={layout}
          next={null}
          nextTap={null}
          onKey={arcadeVirtualKey(dispatch)}
          onTap={arcadeTap(dispatch)}
          compact
          hideHint
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-extrabold tabular-nums" style={{ color: accent ? "var(--color-accent-hover)" : "var(--color-text-hero)" }}>{value}</span>
      <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{label}</span>
    </div>
  );
}
