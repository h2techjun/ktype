import { useState } from "react";
import { KEYBOARD_ROWS, DUBEOLSIK_LAYOUT } from "../hangul/dubeolsik";
import { CJI_ROWS } from "../hangul/cheonjiin";
import type { Lang } from "../typing/engine";

/** 화면 자판 배열. 모바일 기본은 실제 휴대전화 표준인 천지인. */
export type KeyLayout = "qwerty" | "cheonjiin";

// 화면 자판 — 물리 키보드가 없는 환경(모바일·태블릿)의 유일한 입력 경로이자,
// 데스크탑에서는 "다음에 누를 키" 하이라이트로 자판 위치를 가르치는 학습 장치.
// 두 역할을 한 컴포넌트로 합쳐 연습 모드와 게임 4종이 모두 같은 자판을 쓴다.

/** 화면 자판이 내보내는 키 입력. 물리 keydown 과 같은 (code,key,shift) 형태. */
export interface VirtualKey {
  code: string;
  key: string;
  shift: boolean;
}

/** code → 영문 자판 각인. 두벌식과 물리 위치가 같으므로 같은 행 구조를 공유한다. */
function enCap(code: string): string {
  return code.replace("Key", "").toLowerCase();
}

const PUNCT_KEYS: Array<{ code: string; key: string }> = [
  { code: "Comma", key: "," },
  { code: "Period", key: "." },
  { code: "Slash", key: "?" },
];

const TEXT: Record<Lang, { space: string; back: string; shift: string; hint: string }> = {
  ko: {
    space: "스페이스",
    back: "지우기",
    shift: "Shift",
    hint: "화면 자판을 눌러도 되고, 키보드로 쳐도 됩니다",
  },
  en: {
    space: "space",
    back: "delete",
    shift: "Shift",
    hint: "Tap the on-screen keys, or type on your keyboard",
  },
};

interface Props {
  /** 연습·게임 대상 언어 */
  lang: Lang;
  /** 표시 언어(라벨) */
  uiLang: Lang;
  /** 다음에 눌러야 할 자모(ko) 또는 문자(en). 하이라이트용. */
  next: string | null;
  onKey: (k: VirtualKey) => void;
  /** 자판 배열. 영문은 언제나 쿼티. */
  layout?: KeyLayout;
  /** 천지인 탭 입력 콜백(layout="cheonjiin" 일 때 필수) */
  onTap?: (tap: string) => void;
  /** 다음에 눌러야 할 천지인 키 */
  nextTap?: string | null;
  /** 게임 화면용 축소 배치 */
  compact?: boolean;
  /** 안내 문구 숨김(공간이 좁은 게임 화면) */
  hideHint?: boolean;
}

export function VirtualKeyboard(props: Props) {
  const { lang, layout = "qwerty", onTap } = props;
  if (lang === "ko" && layout === "cheonjiin" && onTap) {
    return <CheonjiinKeyboard {...props} onTap={onTap} />;
  }
  return <QwertyKeyboard {...props} />;
}

function QwertyKeyboard({ lang, uiLang, next, onKey, compact, hideHint }: Props) {
  // sticky shift — 한 번 누르면 다음 한 타에만 적용(모바일 표준 동작).
  const [shift, setShift] = useState(false);
  const t = TEXT[uiLang];
  const keyH = compact ? "h-9" : "h-11 sm:h-12";
  const fontSize = compact ? "text-sm" : "text-base";

  const emit = (k: VirtualKey) => {
    onKey(k);
    if (shift) setShift(false);
  };

  const press = (code: string) => {
    if (lang === "ko") {
      emit({ code, key: "", shift });
      return;
    }
    const cap = enCap(code);
    emit({ code, key: shift ? cap.toUpperCase() : cap, shift });
  };

  const isNextKey = (code: string): boolean => {
    if (next === null) return false;
    if (lang === "ko") {
      const cap = DUBEOLSIK_LAYOUT[code];
      return !!cap && (cap.normal === next || cap.shift === next);
    }
    return enCap(code) === next.toLowerCase();
  };

  return (
    <div className="flex w-full flex-col items-center gap-1.5 select-none">
      {KEYBOARD_ROWS.map((row, r) => (
        <div key={r} className="flex w-full justify-center gap-1 sm:gap-1.5">
          {row.map((code) => {
            const cap = DUBEOLSIK_LAYOUT[code];
            const active = isNextKey(code);
            const label = lang === "ko" ? (shift && cap.shift ? cap.shift : cap.normal) : enCap(code);
            return (
              <button
                key={code}
                type="button"
                aria-label={label}
                onPointerDown={(e) => {
                  e.preventDefault(); // 포커스 이동·더블탭 확대·스크롤 방지
                  press(code);
                }}
                className={`flex ${keyH} min-w-0 flex-1 flex-col items-center justify-center rounded-md ${fontSize} font-medium transition-colors active:scale-95`}
                style={{
                  maxWidth: compact ? 44 : 56,
                  background: active ? "var(--color-accent)" : "var(--color-bg-card)",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                  border: `1px solid ${active ? "var(--color-accent-hover)" : "var(--color-border-subtle)"}`,
                }}
              >
                <span>{label}</span>
                {lang === "ko" && cap.shift && !compact && (
                  <span className="text-[9px]" style={{ color: active ? "#e0e0ff" : "var(--color-text-muted)" }}>
                    {cap.shift}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      {/* 기능 행 — Shift(쌍자음·대문자) · 문장부호 · 스페이스 · 백스페이스 */}
      <div className="flex w-full justify-center gap-1 sm:gap-1.5">
        <FnKey
          label="⇧"
          title={t.shift}
          h={keyH}
          active={shift}
          onPress={() => setShift((v) => !v)}
        />
        {PUNCT_KEYS.map((p) => (
          <FnKey
            key={p.code}
            label={p.key}
            title={p.key}
            h={keyH}
            active={next === p.key}
            onPress={() => emit({ code: p.code, key: p.key, shift: false })}
          />
        ))}
        <FnKey
          label={t.space}
          title={t.space}
          h={keyH}
          grow
          active={next === " "}
          onPress={() => emit({ code: "Space", key: " ", shift: false })}
        />
        <FnKey
          label="⌫"
          title={t.back}
          h={keyH}
          onPress={() => emit({ code: "Backspace", key: "Backspace", shift: false })}
        />
      </div>

      {!hideHint && (
        <div className="mt-1 text-center text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          {t.hint}
        </div>
      )}
    </div>
  );
}

// ── 천지인 자판 ─────────────────────────────────────────────────────────
// 실제 휴대전화의 3×4 배열을 그대로 옮긴다. 폰에서 쓰던 방식 그대로 연습해야
// 배운 것이 실제 입력 속도로 이어진다.

const CJI_TEXT: Record<Lang, { space: string; back: string; hint: string }> = {
  ko: {
    space: "스페이스",
    back: "지우기",
    hint: "ㅣ ㆍ ㅡ 조합으로 모음을, 자음은 같은 키를 반복해 바꿔요 · 같은 키를 이어 쓸 땐 → 로 끊어요",
  },
  en: {
    space: "space",
    back: "delete",
    hint: "Combine ㅣ ㆍ ㅡ for vowels; tap a consonant key again to cycle · press → to start a new letter on the same key",
  },
};

function CheonjiinKeyboard({
  uiLang,
  onTap,
  nextTap,
  compact,
  hideHint,
}: Props & { onTap: (tap: string) => void }) {
  const t = CJI_TEXT[uiLang];
  const keyH = compact ? "h-10" : "h-12 sm:h-14";

  const Key = ({ label, tap, wide }: { label: string; tap: string; wide?: boolean }) => {
    const active = nextTap === tap;
    return (
      <button
        type="button"
        aria-label={label}
        onPointerDown={(e) => {
          e.preventDefault();
          onTap(tap);
        }}
        className={`flex ${keyH} min-w-0 flex-1 items-center justify-center rounded-lg font-bold transition-colors active:scale-95 ${
          compact ? "text-base" : "text-lg"
        } ${wide ? "flex-[2]" : ""}`}
        style={{
          background: active ? "var(--color-accent)" : "var(--color-bg-card)",
          color: active ? "#fff" : "var(--color-text-secondary)",
          border: `1px solid ${active ? "var(--color-accent-hover)" : "var(--color-border-subtle)"}`,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col items-center gap-1.5 select-none">
      {CJI_ROWS.map((row, r) => (
        <div key={r} className="flex w-full gap-1.5">
          {row.map((k) => (
            <Key key={k} label={k} tap={k} />
          ))}
        </div>
      ))}
      <div className="flex w-full gap-1.5">
        {/* → = 같은 키를 이어 눌러야 하는 글자("안"+"녕")를 구분하는 커서 이동 */}
        <Key label="→" tap="Commit" />
        <Key label="ㅇㅁ" tap="ㅇㅁ" />
        <Key label="⌫" tap="Backspace" />
      </div>
      <div className="flex w-full gap-1.5">
        <Key label="." tap="." />
        <Key label="," tap="," />
        <Key label="?" tap="?" />
        <Key label={t.space} tap=" " wide />
      </div>
      {!hideHint && (
        <div className="mt-1 text-center text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          {t.hint}
        </div>
      )}
    </div>
  );
}

function FnKey({
  label,
  title,
  h,
  onPress,
  active,
  grow,
}: {
  label: string;
  title: string;
  h: string;
  onPress: () => void;
  active?: boolean;
  grow?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={title}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`flex ${h} items-center justify-center rounded-md px-2 text-xs font-medium transition-colors active:scale-95 ${grow ? "flex-[3]" : "flex-1"}`}
      style={{
        maxWidth: grow ? 200 : 56,
        background: active ? "var(--color-accent)" : "var(--color-bg-elevated)",
        color: active ? "#fff" : "var(--color-text-tertiary)",
        border: `1px solid ${active ? "var(--color-accent-hover)" : "var(--color-border-subtle)"}`,
      }}
    >
      {label}
    </button>
  );
}
