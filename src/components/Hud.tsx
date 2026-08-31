import type { Speed } from "../lib/metrics";
import type { Lang } from "../typing/engine";

// 재생 중 실시간 지표 — 초보에게 부담되지 않게 최소화(WPM 등 상세는 결과 화면).
// 콤보만 게임감을 위해 강조하고, 타/분·정확도는 보조로.
const LABEL: Record<Lang, { cpm: string; accuracy: string; combo: string }> = {
  ko: { cpm: "타/분", accuracy: "정확도", combo: "콤보" },
  en: { cpm: "CPM", accuracy: "accuracy", combo: "combo" },
};

export function Hud({
  speed,
  accuracy,
  combo,
  uiLang,
}: {
  speed: Speed;
  accuracy: number;
  combo: number;
  uiLang: Lang;
}) {
  const t = LABEL[uiLang];
  return (
    <div className="flex items-center justify-center gap-6">
      <Metric label={t.cpm} value={String(speed.cpm)} />
      <Metric label={t.accuracy} value={`${accuracy}%`} dim={accuracy < 95} />
      <ComboMeter combo={combo} label={t.combo} />
    </div>
  );
}

function Metric({ label, value, dim }: { label: string; value: string; dim?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-xl font-bold tabular-nums"
        style={{ color: dim ? "var(--color-warning)" : "var(--color-text-secondary)" }}
      >
        {value}
      </span>
      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
    </div>
  );
}

function ComboMeter({ combo, label }: { combo: number; label: string }) {
  const active = combo >= 2;
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-2xl font-extrabold tabular-nums transition-all"
        style={{
          color: active ? "var(--color-accent-hover)" : "var(--color-text-muted)",
          textShadow: active ? "0 0 16px var(--color-accent)" : "none",
        }}
      >
        {combo > 0 ? `${combo}×` : "—"}
      </span>
      <span className="text-[10px]" style={{ color: active ? "var(--color-accent)" : "var(--color-text-muted)" }}>
        {label}
      </span>
    </div>
  );
}
