import type { ReactNode } from "react";
import { type Lang } from "../typing/engine";
import { VirtualKeyboard, type VirtualKey, type KeyLayout } from "./VirtualKeyboard";
import { Mascot, type Mood } from "./Mascot";

// 게임 4종이 공유하는 껍데기 — 플레이 필드와 입력 바.
// 이전에는 같은 마크업이 네 파일에 복사돼 있어, 모바일 입력 같은 공통 개선을
// 한 곳만 고치고 나머지를 빠뜨리기 쉬웠다.

/** 터치 기기에서 플레이 필드를 줄이는 비율. 필드(440px) + 입력바 + 화면 자판이
 *  600px 임베드 높이 안에 모두 들어가야 한다. 게임 좌표계는 그대로 두고 표시만 축소. */
export const TOUCH_FIELD_SCALE = 0.66;

/** 플레이 필드 — 터치 기기에서는 좌표계를 유지한 채 시각적으로만 축소한다.
 *  overlay(게임오버 등)는 축소 밖에 둬야 버튼이 작아지지 않는다. */
export function ArcadeField({
  height,
  scale,
  background,
  children,
  overlay,
}: {
  height: number;
  scale: number;
  background: string;
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        height: Math.round(height * scale),
        background,
        border: "1px solid var(--color-border-subtle)",
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ width: `${100 / scale}%`, height, transform: `scale(${scale})` }}
      >
        {children}
      </div>
      {overlay}
    </div>
  );
}

/** 입력 바 + (터치 기기에서만) 화면 자판. 물리 키보드가 없는 기기의 유일한 입력 경로. */
export function ArcadeInputBar({
  mood,
  typedText,
  hint,
  lang,
  uiLang,
  layout,
  onKey,
  onTap,
  showKeyboard,
}: {
  mood: Mood;
  typedText: string;
  hint: string;
  lang: Lang;
  uiLang: Lang;
  layout: KeyLayout;
  onKey: (k: VirtualKey) => void;
  onTap: (tap: string) => void;
  showKeyboard: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <Mascot mood={mood} size={44} />
        <div
          className="flex h-12 flex-1 items-center justify-center rounded-xl text-2xl font-bold tracking-wide"
          style={{
            background: "var(--color-bg-card)",
            color: typedText ? "var(--color-accent-hover)" : "var(--color-text-muted)",
            border: "1px solid var(--color-border-subtle)",
          }}
        >
          {typedText || hint}
        </div>
      </div>
      {showKeyboard && (
        <VirtualKeyboard
          lang={lang}
          uiLang={uiLang}
          layout={layout}
          next={null}
          nextTap={null}
          onKey={onKey}
          onTap={onTap}
          compact
          hideHint
        />
      )}
    </>
  );
}
