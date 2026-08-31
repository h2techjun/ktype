import { typeText, committedCount, type TypeState, type Lang } from "../typing/engine";

// 목표 텍스트를 셀 단위로 표시. WCAG 1.4.1 — 색상 + 밑줄 스타일(정타 solid/오타 wavy/커서 굵은 solid).
// ko=음절 단위, en=문자 단위(대소문자 무시).
export function TargetText({ target, typed, lang }: { target: string; typed: TypeState; lang: Lang }) {
  const text = typeText(typed);
  const cursorIndex = committedCount(typed);
  const cells = Array.from(target);
  const typedCells = Array.from(text);

  const eq = (a: string, b: string) => (lang === "en" ? a.toLowerCase() === b.toLowerCase() : a === b);

  return (
    <div className="flex flex-wrap justify-center gap-x-0.5 gap-y-2 text-4xl font-semibold tracking-wide sm:text-5xl">
      {cells.map((ch, i) => {
        const isCursor = i === cursorIndex;
        let status: "correct" | "wrong" | "pending" = "pending";
        if (i < typedCells.length) status = eq(typedCells[i], ch) ? "correct" : "wrong";

        let color = "var(--color-text-muted)";
        let decoration = "none";
        let decorationStyle: "solid" | "wavy" = "solid";
        let thickness = "2px";
        let animate = false;

        if (isCursor) {
          color = "var(--color-accent-hover)";
          decoration = "underline";
          thickness = "3px";
          animate = true;
        } else if (status === "correct") {
          color = "var(--color-success)";
          decoration = "underline";
        } else if (status === "wrong") {
          color = "var(--color-danger)";
          decoration = "underline";
          decorationStyle = "wavy";
        }

        return (
          <span
            key={i}
            className={`px-0.5 pb-1 transition-colors ${animate ? "ktype-caret" : ""}`}
            style={{
              color,
              textDecorationLine: decoration,
              textDecorationStyle: decorationStyle,
              textDecorationColor: isCursor ? "var(--color-accent)" : color,
              textDecorationThickness: thickness,
              textUnderlineOffset: "6px",
              minWidth: ch === " " ? "0.4em" : undefined,
            }}
          >
            {ch === " " ? " " : ch}
          </span>
        );
      })}
    </div>
  );
}
