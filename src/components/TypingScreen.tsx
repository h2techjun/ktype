import { useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { useSettingsStore, resolveKeyLayout } from "../store/useSettingsStore";
import { nextExpectedJamo } from "../hangul/ime";
import { cjiNextTap } from "../hangul/cheonjiin";
import { useIsTouch } from "../lib/useIsTouch";
import { computeSpeed, computeAccuracy } from "../lib/metrics";
import { isTypableKey, typeText, hasTypeError, type Lang } from "../typing/engine";
import { sound } from "../lib/sound";
import { TargetText } from "./TargetText";
import { JamoAssembly } from "./JamoAssembly";
import { Hud } from "./Hud";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Mascot, type Mood } from "./Mascot";

const ERROR_HINT: Record<string, string> = {
  ko: "⌫ 백스페이스로 지우고 다시 쳐보세요",
  en: "⌫ Press backspace and try again",
};

/** 화면 자판 선택 — 폰에서 쓰는 천지인과 PC 두벌식을 오갈 수 있게 한다. */
const LAYOUT_CHOICES: Array<{ value: "cheonjiin" | "qwerty"; label: Record<Lang, string> }> = [
  { value: "cheonjiin", label: { ko: "📱 천지인", en: "📱 Cheonjiin" } },
  { value: "qwerty", label: { ko: "⌨️ 두벌식", en: "⌨️ 2-set" } },
];

export function TypingScreen() {
  const phase = useGameStore((s) => s.phase);
  const typed = useGameStore((s) => s.typed);
  const lang = useGameStore((s) => s.lang); // 타이핑 언어(targetLang)
  const uiLang = useSettingsStore((s) => s.uiLang); // 표시 언어
  const itemIndex = useGameStore((s) => s.itemIndex);
  const correctKeys = useGameStore((s) => s.correctKeys);
  const errorKeys = useGameStore((s) => s.errorKeys);
  const combo = useGameStore((s) => s.combo);
  const startMs = useGameStore((s) => s.startMs);
  const nowMs = useGameStore((s) => s.nowMs);
  const hitSeq = useGameStore((s) => s.hitSeq);
  const lastHit = useGameStore((s) => s.lastHit);
  const stage = useGameStore((s) => s.currentStage());
  const backToSelect = useGameStore((s) => s.backToSelect);

  const keyLayoutPref = useSettingsStore((s) => s.keyLayout);
  const setKeyLayout = useSettingsStore((s) => s.setKeyLayout);
  const touch = useIsTouch();
  const layout = resolveKeyLayout(keyLayoutPref, touch);

  const [mood, setMood] = useState<Mood>("idle");
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (!isTypableKey(lang, e.code, e.key, e.shiftKey)) return;
      e.preventDefault();
      sound.unlock();
      useGameStore.getState().pressKey(e.code, e.key, e.shiftKey);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lang]);

  useEffect(() => {
    const id = window.setInterval(() => useGameStore.getState().tick(), 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (hitSeq === 0) return;
    if (lastHit === "complete") { sound.complete(); return; }
    if (lastHit === "error") { sound.error(); return; }
    sound.key(hitSeq);
    if (lastHit === "correct") sound.correct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitSeq]);

  useEffect(() => {
    if (hitSeq === 0) return;
    if (lastHit === "error") {
      setMood("oops");
      setShake(true);
      const t1 = window.setTimeout(() => setShake(false), 240);
      const t2 = window.setTimeout(() => setMood("idle"), 650);
      return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    }
    setMood(combo >= 3 ? "happy" : "idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitSeq]);

  if (phase !== "playing" || !stage) return null;

  const item = stage.items[itemIndex];
  const target = item?.text ?? "";
  const nextItem = stage.items[itemIndex + 1];
  const elapsed = startMs != null ? nowMs - startMs : 0;
  const speed = computeSpeed(correctKeys, elapsed);
  const accuracy = computeAccuracy(correctKeys, errorKeys);
  const nextJamo = lang === "ko" ? nextExpectedJamo(target, typed.ime) : null;
  // 화면 자판 하이라이트 — ko=다음 자모, en=다음 문자.
  const nextKey =
    lang === "ko" ? nextJamo : Array.from(target)[Array.from(typeText(typed)).length] ?? null;
  // 천지인은 자모 하나가 여러 탭이라, 조합 진행 상태까지 봐야 다음 키가 정해진다.
  // 다음 자모가 방금 누른 자음 키와 같으면(안→녕) 먼저 → 로 글자를 끊어야 한다.
  const rawNextTap = nextJamo ? cjiNextTap(nextJamo, typed.tap.seq) : null;
  const nextTap =
    rawNextTap !== null && typed.tap.key === rawNextTap ? "Commit" : rawNextTap;
  const mistyped = hasTypeError(typed, target);
  const progress = (itemIndex / stage.items.length) * 100;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col gap-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <button onClick={backToSelect} className="rounded-lg px-3 py-1.5 text-sm transition-colors" style={{ color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-subtle)" }}>{uiLang === "en" ? "← List" : "← 목록"}</button>
        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{stage.title[uiLang]} · {itemIndex + 1} / {stage.items.length}</span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--color-bg-card)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--color-accent)" }} />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="ktype-float"><Mascot mood={mood} size={64} /></div>
        <Hud speed={speed} accuracy={accuracy} combo={combo} uiLang={uiLang} />
      </div>

      <div className={`flex flex-col items-center gap-3 py-3 ${shake ? "ktype-shake" : ""}`}>
        <TargetText target={target} typed={typed} lang={lang} />
        {(item?.roman || item?.gloss) && (
          <div className="text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            {item?.roman && <span className="italic">{item.roman}</span>}
            {item?.roman && item?.gloss && <span> · </span>}
            {item?.gloss && <span>{item.gloss}</span>}
          </div>
        )}
        {nextItem && (
          <div className="text-center text-base" style={{ color: "var(--color-text-muted)", opacity: 0.5 }}>
            {uiLang === "en" ? "next" : "다음"} · {nextItem.text}
          </div>
        )}
      </div>

      {lang === "ko" && <JamoAssembly ime={typed.ime} />}

      {mistyped && (
        <div className="text-center text-sm font-semibold" style={{ color: "var(--color-danger)" }}>
          {ERROR_HINT[uiLang]}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {lang === "ko" && (
          <div className="flex justify-center gap-1.5">
            {LAYOUT_CHOICES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setKeyLayout(c.value)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  background: layout === c.value ? "var(--color-accent-bg)" : "transparent",
                  color: layout === c.value ? "var(--color-accent-hover)" : "var(--color-text-muted)",
                  border: `1px solid ${layout === c.value ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
                }}
              >
                {c.label[uiLang]}
              </button>
            ))}
          </div>
        )}
        <VirtualKeyboard
          lang={lang}
          uiLang={uiLang}
          layout={layout}
          next={nextKey}
          nextTap={nextTap}
          onTap={(tap) => {
            sound.unlock();
            useGameStore.getState().tapKey(tap);
          }}
          onKey={(k) => {
            sound.unlock();
            useGameStore.getState().pressKey(k.code, k.key, k.shift);
          }}
        />
      </div>
    </div>
  );
}
