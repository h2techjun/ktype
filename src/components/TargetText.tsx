import type { CSSProperties } from "react";
import { typeText, committedCount, type TypeState, type Lang } from "../typing/engine";

// 목표 텍스트 — 워들식 음절 타일. 셀마다 상태(정타·오타·커서·대기)를 색 + 테두리/밑줄로
// 이중 표시(WCAG 1.4.1). ko=음절 단위, en=문자 단위(대소문자 무시).
// 긴 글(TILE_MAX 초과)은 타일 대신 밑줄 텍스트로 떨어뜨려 줄바꿈 부담을 줄인다.
const TILE_MAX = 28;

type CellStatus = "correct" | "wrong" | "cursor" | "pending";

export function TargetText({ target, typed, lang, done }: { target: string; typed: TypeState; lang: Lang; done?: boolean }) {
  const text = typeText(typed);
  // 완성 보여주기 — 마지막 음절이 아직 조합 상태여도 전부 정타로 칠한다(커서 없음).
  const cursorIndex = done ? -1 : committedCount(typed);
  const cells = Array.from(target);
  const typedCells = Array.from(text);
  const tiles = cells.length <= TILE_MAX;

  const eq = (a: string, b: string) => (lang === "en" ? a.toLowerCase() === b.toLowerCase() : a === b);
  const statusOf = (ch: string, i: number): CellStatus => {
    if (done) return "correct";
    if (i === cursorIndex) return "cursor";
    if (i < typedCells.length) return eq(typedCells[i], ch) ? "correct" : "wrong";
    return "pending";
  };

  return (
    <div
      className={`flex flex-wrap justify-center ${tiles ? "gap-1.5" : "gap-x-0.5 gap-y-2 text-3xl font-semibold tracking-wide sm:text-4xl"} ${done ? "ktype-done" : ""}`}
      aria-label={target}
    >
      {cells.map((ch, i) => {
        const status = statusOf(ch, i);
        // 커서 칸에는 조합 중인 글자(ㄱ→고→곰)를 그대로 보여준다 — IME 멘탈모델.
        const composing = status === "cursor" && typedCells[i] ? typedCells[i] : null;
        return tiles ? (
          <Tile key={i} ch={ch} shown={status === "wrong" ? typedCells[i] ?? ch : composing ?? ch} status={status} ghost={composing !== null} />
        ) : (
          <Underlined key={i} ch={ch} status={status} />
        );
      })}
    </div>
  );
}

const TILE_STYLE: Record<CellStatus, CSSProperties> = {
  pending: { background: "var(--color-bg-elevated)", color: "var(--color-text-muted)", border: "2px solid var(--color-border-default)", boxShadow: "0 3px 0 0 #0b0d14" },
  cursor: { background: "var(--color-accent-bg)", color: "var(--color-text-hero)", border: "2px solid var(--color-accent-hover)", boxShadow: "0 3px 0 0 #0a3a5c, 0 0 18px -2px var(--color-accent)" },
  correct: { background: "var(--color-success-bg)", color: "#d1fae5", border: "2px solid var(--color-success)", boxShadow: "0 3px 0 0 #053b2d" },
  wrong: { background: "var(--color-danger-bg)", color: "#fecaca", border: "2px solid var(--color-danger)", boxShadow: "0 3px 0 0 #3b0f18", textDecoration: "underline wavy" },
};

/** 타일 — 게임 톤의 핵심 그래픽. 공백은 좁은 투명 칸으로 둬 단어 경계를 보여준다. */
function Tile({ ch, shown, status, ghost }: { ch: string; shown: string; status: CellStatus; ghost: boolean }) {
  if (ch === " ") return <span className="block w-3" aria-hidden />;
  return (
    <span
      className={`relative flex h-12 min-w-12 items-center justify-center rounded-xl px-1.5 text-2xl font-black transition-colors duration-150 sm:h-14 sm:min-w-14 sm:text-3xl ${status === "cursor" ? "ktype-tile-cursor" : status === "correct" ? "ktype-tile-pop" : ""}`}
      style={TILE_STYLE[status]}
    >
      {shown}
      {/* 조합 중일 때 목표 글자를 작게 위에 띄워 "무엇을 향해 가는지" 보여준다 */}
      {ghost && shown !== ch && (
        <span className="absolute -top-2 right-0.5 rounded px-1 text-[10px] font-bold leading-4" style={{ background: "var(--color-accent)", color: "#fff" }}>{ch}</span>
      )}
    </span>
  );
}

/** 긴 글용 — 밑줄 텍스트(정타 solid · 오타 wavy · 커서 굵은 깜빡임). */
function Underlined({ ch, status }: { ch: string; status: CellStatus }) {
  const color =
    status === "cursor" ? "var(--color-accent-hover)" : status === "correct" ? "var(--color-success)" : status === "wrong" ? "var(--color-danger)" : "var(--color-text-muted)";
  return (
    <span
      className={`px-0.5 pb-1 transition-colors ${status === "cursor" ? "ktype-caret" : ""}`}
      style={{
        color,
        textDecorationLine: status === "pending" ? "none" : "underline",
        textDecorationStyle: status === "wrong" ? "wavy" : "solid",
        textDecorationColor: status === "cursor" ? "var(--color-accent)" : color,
        textDecorationThickness: status === "cursor" ? "3px" : "2px",
        textUnderlineOffset: "6px",
        minWidth: ch === " " ? "0.4em" : undefined,
      }}
    >
      {ch === " " ? " " : ch}
    </span>
  );
}
