import { composingJamo, renderComposing, type ImeState } from "../hangul/ime";
import { useSettingsStore } from "../store/useSettingsStore";

// 자모 위치 라벨 — 영어권 학습자가 가장 궁금해하는 부분이라 UI 언어를 따른다.
// 언어학·유니코드 표준 용어(initial/medial/final)를 쓴다. 10px 칸이라 짧아야 한다.
const LABELS = {
  ko: { cho: "초성", jung: "중성", jong: "종성" },
  en: { cho: "initial", jung: "medial", jong: "final" },
} as const;

// 조합 시각화 — 실제 IME 처럼 "한 칸에서 글자가 자라나는" 방식(ㄱ→고→곰).
// 3박스 분리 메타포 대신 브라우저 IME 멘탈모델(조합 중 밑줄)을 재사용해 학습 부담을 줄인다.
// 아래 자모 트랙이 초성·중성·종성이 어떻게 합쳐지는지를 보조로 보여준다.
export function JamoAssembly({ ime, compact }: { ime: ImeState; compact?: boolean }) {
  const { cho, jung, jong } = composingJamo(ime.composing);
  const composed = renderComposing(ime.composing);
  const composing = composed !== "";
  const uiLang = useSettingsStore((s) => s.uiLang);
  const L = LABELS[uiLang === "en" ? "en" : "ko"];

  // 압축형 — 커서 타일이 이미 조합 중 글자를 보여주므로 큰 박스 없이 자모 트랙만 한 줄로.
  if (compact) {
    const Slot = ({ label, ch }: { label: string; ch: string }) => (
      <span className="flex items-baseline gap-1">
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</span>
        <span className="w-5 text-center text-base font-bold" style={{ color: ch ? "var(--color-accent-hover)" : "var(--color-border-strong)" }}>{ch || "·"}</span>
      </span>
    );
    return (
      <div className="flex items-center justify-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-subtle)" }}>
        <Slot label={L.cho} ch={cho} />
        <span style={{ color: "var(--color-text-muted)" }}>+</span>
        <Slot label={L.jung} ch={jung} />
        <span style={{ color: "var(--color-text-muted)" }}>+</span>
        <Slot label={L.jong} ch={jong} />
        <span style={{ color: "var(--color-text-muted)" }}>=</span>
        <span className="w-6 text-center text-lg font-black" style={{ color: composing ? "var(--color-text-hero)" : "var(--color-border-strong)" }}>{composed || "·"}</span>
      </div>
    );
  }

  const Track = ({ label, ch }: { label: string; ch: string }) => {
    const filled = ch !== "";
    return (
      <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 40 }}>
        <span
          className="text-xl font-medium leading-none"
          style={{ color: filled ? "var(--color-accent-hover)" : "var(--color-border-strong)" }}
        >
          {filled ? ch : "·"}
        </span>
        <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 조합 중 글자 — 한 칸에서 자라나며, 조합 중이면 밑줄(IME 관례) */}
      <div
        className="flex h-24 w-24 items-center justify-center rounded-2xl text-6xl font-bold transition-all"
        style={{
          background: "var(--color-bg-elevated)",
          color: composing ? "var(--color-text-hero)" : "var(--color-text-muted)",
          border: `1px solid ${composing ? "var(--color-accent)" : "var(--color-border-default)"}`,
          borderBottomWidth: composing ? 4 : 1,
          boxShadow: composing ? "0 0 24px -8px var(--color-accent)" : "none",
        }}
      >
        {composed || "·"}
      </div>
      {/* 자모 트랙 — 초성+중성+종성 구성 */}
      <div className="flex items-center gap-1">
        <Track label={L.cho} ch={cho} />
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>+</span>
        <Track label={L.jung} ch={jung} />
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>+</span>
        <Track label={L.jong} ch={jong} />
      </div>
    </div>
  );
}
