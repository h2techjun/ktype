import { composingJamo, renderComposing, type ImeState } from "../hangul/ime";

// 조합 시각화 — 실제 IME 처럼 "한 칸에서 글자가 자라나는" 방식(ㄱ→고→곰).
// 3박스 분리 메타포 대신 브라우저 IME 멘탈모델(조합 중 밑줄)을 재사용해 학습 부담을 줄인다.
// 아래 자모 트랙이 초성·중성·종성이 어떻게 합쳐지는지를 보조로 보여준다.
export function JamoAssembly({ ime }: { ime: ImeState }) {
  const { cho, jung, jong } = composingJamo(ime.composing);
  const composed = renderComposing(ime.composing);
  const composing = composed !== "";

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
        <Track label="초성" ch={cho} />
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>+</span>
        <Track label="중성" ch={jung} />
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>+</span>
        <Track label="종성" ch={jong} />
      </div>
    </div>
  );
}
