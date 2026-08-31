// SVG 마스코트 — 부엉이(Minerva 상징). 자체 제작 벡터라 저작권 클린.
// mood 에 따라 눈/표정이 바뀌어 타이핑 피드백에 생기를 준다.
export type Mood = "idle" | "happy" | "oops" | "celebrate";

export function Mascot({ mood = "idle", size = 72 }: { mood?: Mood; size?: number }) {
  const glow = mood === "happy" || mood === "celebrate";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: glow ? "drop-shadow(0 0 12px var(--color-accent))" : "none",
        transition: "filter 0.25s",
      }}
      aria-label="부엉이 마스코트"
    >
      <defs>
        <linearGradient id="owl-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3aabf7" />
          <stop offset="1" stopColor="#0674c4" />
        </linearGradient>
      </defs>
      {/* 귀 깃털 */}
      <path d="M28 26 L34 10 L42 28 Z" fill="#0674c4" />
      <path d="M72 26 L66 10 L58 28 Z" fill="#0674c4" />
      {/* 몸체 */}
      <ellipse cx="50" cy="56" rx="34" ry="36" fill="url(#owl-body)" />
      {/* 배 무늬 */}
      <ellipse cx="50" cy="64" rx="20" ry="24" fill="#0a3a5c" opacity="0.55" />
      {/* 눈 바탕 */}
      <circle cx="37" cy="48" r="14" fill="#0e1015" />
      <circle cx="63" cy="48" r="14" fill="#0e1015" />
      <Eyes mood={mood} />
      {/* 부리 */}
      <path d="M50 58 L45 66 L55 66 Z" fill="#f59e0b" />
    </svg>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "oops") {
    // 놀란 눈 (작게) + 땀
    return (
      <>
        <circle cx="37" cy="48" r="5" fill="#eef0f5" />
        <circle cx="63" cy="48" r="5" fill="#eef0f5" />
        <circle cx="78" cy="40" r="3" fill="#38bdf8" opacity="0.8" />
      </>
    );
  }
  if (mood === "happy") {
    // 반달 웃는 눈
    return (
      <>
        <path d="M30 50 Q37 42 44 50" stroke="#eef0f5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M56 50 Q63 42 70 50" stroke="#eef0f5" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (mood === "celebrate") {
    // 별 눈 (반짝)
    return (
      <>
        <Star cx={37} cy={48} />
        <Star cx={63} cy={48} />
      </>
    );
  }
  // idle — 또렷한 눈 + 하이라이트
  return (
    <>
      <circle cx="37" cy="48" r="8" fill="#eef0f5" />
      <circle cx="63" cy="48" r="8" fill="#eef0f5" />
      <circle cx="39" cy="50" r="4" fill="#0e1015" />
      <circle cx="65" cy="50" r="4" fill="#0e1015" />
      <circle cx="41" cy="47" r="1.4" fill="#fff" />
      <circle cx="67" cy="47" r="1.4" fill="#fff" />
    </>
  );
}

function Star({ cx, cy }: { cx: number; cy: number }) {
  return (
    <path
      d={`M${cx} ${cy - 7} L${cx + 2} ${cy - 1} L${cx + 7} ${cy - 1} L${cx + 3} ${cy + 3} L${cx + 4} ${cy + 8} L${cx} ${cy + 5} L${cx - 4} ${cy + 8} L${cx - 3} ${cy + 3} L${cx - 7} ${cy - 1} L${cx - 2} ${cy - 1} Z`}
      fill="#fbbf24"
    />
  );
}
