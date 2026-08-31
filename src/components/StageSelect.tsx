import { stagesFor, KIND_LABEL, KIND_ICON, KIND_ORDER, type TypingStage } from "../data";
import { useGameStore } from "../store/useGameStore";
import { useProgressStore } from "../store/useProgressStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { kindStat, overallStat } from "../lib/progress";
import type { Lang } from "../typing/engine";
import { Mascot } from "./Mascot";
import { LangToggle } from "./LangToggle";

function ProgressBar({ ratio, color }: { ratio: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--color-bg-elevated)" }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(ratio * 100)}%`, background: color ?? "var(--color-accent)" }} />
    </div>
  );
}

function StageCard({ stage, index, uiLang, targetLang }: { stage: TypingStage; index: number; uiLang: Lang; targetLang: Lang }) {
  const startStage = useGameStore((s) => s.startStage);
  const best = useProgressStore((s) => s.best[stage.id]);
  const done = !!best;

  return (
    <button
      onClick={() => startStage(stage.id, targetLang)}
      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:-translate-y-0.5"
      style={{ background: "var(--color-bg-card)", border: `1px solid ${done ? "var(--color-accent)" : "var(--color-border-subtle)"}` }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{
          background: done ? "var(--color-accent-bg)" : "var(--color-bg-elevated)",
          color: done ? "var(--color-accent-hover)" : "var(--color-text-tertiary)",
          border: `1px solid ${done ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
        }}
      >
        {done ? "✓" : index + 1}
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-medium" style={{ color: "var(--color-text-primary)" }}>{stage.title[uiLang]}</span>
        {stage.subtitle ? (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{stage.subtitle[uiLang]}</span>
        ) : (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{uiLang === "en" ? `${stage.items.length} items` : `${stage.items.length}개`}</span>
        )}
      </div>
      {done ? (
        <span className="text-sm tracking-tight" style={{ color: "var(--color-warning)" }}>{"★".repeat(best!.stars)}<span style={{ color: "var(--color-border-strong)" }}>{"★".repeat(3 - best!.stars)}</span></span>
      ) : (
        <span className="text-lg transition-transform group-hover:translate-x-0.5" style={{ color: "var(--color-accent-hover)" }}>›</span>
      )}
    </button>
  );
}

export function StageSelect({ onHome }: { onHome: () => void }) {
  const uiLang = useSettingsStore((s) => s.uiLang);
  const setUiLang = useSettingsStore((s) => s.setUiLang);
  const targetLang = useSettingsStore((s) => s.targetLang);
  const setTargetLang = useSettingsStore((s) => s.setTargetLang);
  const best = useProgressStore((s) => s.best);
  const stages = stagesFor(targetLang);
  const overall = overallStat(targetLang, best);

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-5 px-4 py-7">
      <div className="flex items-center justify-between gap-2">
        <button onClick={onHome} className="rounded-lg px-3 py-1.5 text-sm" style={{ color: "var(--color-text-tertiary)", border: "1px solid var(--color-border-subtle)" }}>
          ← {uiLang === "en" ? "Home" : "홈"}
        </button>
        <LangToggle value={uiLang} onChange={setUiLang} ariaLabel="display language" />
      </div>

      <header className="flex flex-col items-center gap-3 text-center">
        <div className="ktype-float"><Mascot mood="happy" size={64} /></div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-hero)" }}>
          {uiLang === "en" ? "Practice Journey" : "연습 여정"}
        </h1>
        <LangToggle
          value={targetLang}
          onChange={setTargetLang}
          options={[
            { lang: "ko", label: uiLang === "en" ? "🇰🇷 Korean" : "🇰🇷 한글" },
            { lang: "en", label: uiLang === "en" ? "🔤 English" : "🔤 영어" },
          ]}
          ariaLabel="practice language"
        />
        {/* 전체 진행 */}
        <div className="w-full max-w-xs">
          <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
            <span>{uiLang === "en" ? "Overall" : "전체 진행"}</span>
            <span className="tabular-nums">{overall.done}/{overall.total} · {overall.stars}★</span>
          </div>
          <ProgressBar ratio={overall.total ? overall.done / overall.total : 0} />
        </div>
      </header>

      {KIND_ORDER.map((kind) => {
        const ks = stages.filter((s) => s.kind === kind);
        if (ks.length === 0) return null;
        const stat = kindStat(targetLang, kind, best);
        return (
          <section key={kind} className="flex flex-col gap-2 rounded-2xl p-3" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}>
            <div className="flex items-center gap-2 px-1">
              <span className="text-lg">{KIND_ICON[kind]}</span>
              <h2 className="flex-1 text-sm font-bold" style={{ color: "var(--color-text-secondary)" }}>{KIND_LABEL[kind][uiLang]}</h2>
              <span className="text-[11px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>{stat.done}/{stat.total}</span>
            </div>
            <div className="px-1"><ProgressBar ratio={stat.total ? stat.done / stat.total : 0} /></div>
            <div className="flex flex-col gap-1.5">
              {ks.map((stage, i) => (
                <StageCard key={stage.id} stage={stage} index={i} uiLang={uiLang} targetLang={targetLang} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
