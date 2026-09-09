import { useGameStore } from "../store/useGameStore";
import { useSettingsStore, resolveKeyLayout } from "../store/useSettingsStore";
import { nextExpectedJamo } from "../hangul/ime";
import { SHIFT_JAMO, shiftBase } from "../hangul/dubeolsik";
import { cjiNextTap } from "../hangul/cheonjiin";
import { useIsTouch } from "../lib/useIsTouch";
import { computeSpeed, computeAccuracy } from "../lib/metrics";
import { typeText, type Lang } from "../typing/engine";
import { sound } from "../lib/sound";
import { useTypingKeys } from "../quick/useTypingKeys";
import { TargetText } from "./TargetText";
import { JamoAssembly } from "./JamoAssembly";
import { Hud } from "./Hud";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { Mascot } from "./Mascot";

const SHIFT_HINT: Record<Lang, (base: string, jamo: string) => string> = {
  ko: (base, jamo) => `⇧ Shift + ${base} = ${jamo}`,
  en: (base, jamo) => `⇧ Hold Shift + ${base} for ${jamo}`,
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
  const stage = useGameStore((s) => s.currentStage());
  const itemDone = useGameStore((s) => s.itemDone);
  const backToSelect = useGameStore((s) => s.backToSelect);

  const keyLayoutPref = useSettingsStore((s) => s.keyLayout);
  const setKeyLayout = useSettingsStore((s) => s.setKeyLayout);
  const touch = useIsTouch();
  const layout = resolveKeyLayout(keyLayoutPref, touch);

  const { mood, shake, wrong } = useTypingKeys(lang, phase === "playing");

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
  const progress = ((itemIndex + (itemDone ? 1 : 0)) / stage.items.length) * 100;
  const shiftJamo = nextJamo && SHIFT_JAMO.has(nextJamo) ? nextJamo : null;
  const shiftFrom = shiftJamo ? shiftBase(shiftJamo) : null;

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

      <div className={`relative flex flex-col items-center gap-3 rounded-3xl px-4 py-5 ${shake ? "ktype-shake" : ""}`} style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-default)", boxShadow: "0 6px 0 0 #0b0d14" }}>
        <TargetText target={target} typed={typed} lang={lang} done={itemDone} />
        {wrong && (
          <span className="ktype-wrong-chip absolute right-3 top-3 rounded-full px-2.5 py-1 text-sm font-black" style={{ background: "var(--color-danger-bg)", color: "#fecaca", border: "1px solid var(--color-danger)" }}>
            ✗ {wrong}
          </span>
        )}
        {itemDone && (
          <span className="ktype-pop absolute left-3 top-3 rounded-full px-2.5 py-1 text-sm font-black" style={{ background: "var(--color-success-bg)", color: "#d1fae5", border: "1px solid var(--color-success)" }}>
            ✓
          </span>
        )}
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

      {lang === "ko" && <JamoAssembly ime={typed.ime} compact />}

      {shiftJamo && shiftFrom && (
        <div className="ktype-pop mx-auto rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--color-warning)", color: "#1a1206" }}>
          {SHIFT_HINT[uiLang](shiftFrom, shiftJamo)}
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
