import { KEYBOARD_ROWS, DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";

// 온스크린 두벌식 키보드. 다음 눌러야 할 자모를 하이라이트해 학습을 돕는다.
export function Keyboard({ nextJamo }: { nextJamo: string | null }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {KEYBOARD_ROWS.map((row, r) => (
        <div key={r} className="flex gap-1.5">
          {row.map((code) => {
            const cap = DUBEOLSIK_LAYOUT[code];
            const isNext = nextJamo !== null && (cap.normal === nextJamo || cap.shift === nextJamo);
            return (
              <div
                key={code}
                className="flex h-11 w-9 flex-col items-center justify-center rounded-md text-base font-medium transition-colors sm:w-10"
                style={{
                  background: isNext ? "var(--color-accent)" : "var(--color-bg-card)",
                  color: isNext ? "#fff" : "var(--color-text-secondary)",
                  border: `1px solid ${isNext ? "var(--color-accent-hover)" : "var(--color-border-subtle)"}`,
                }}
              >
                <span>{cap.normal}</span>
                {cap.shift && (
                  <span className="text-[9px]" style={{ color: isNext ? "#e0e0ff" : "var(--color-text-muted)" }}>
                    {cap.shift}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div className="mt-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        Shift = 쌍자음·이중모음 · Space·Backspace 사용
      </div>
    </div>
  );
}
