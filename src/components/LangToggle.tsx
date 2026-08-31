import type { Lang } from "../typing/engine";

// 범용 언어 토글. 표시 언어·연습 언어 어디에나 재사용(value/onChange 주입).
interface Option {
  lang: Lang;
  label: string;
}

export function LangToggle({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  options?: Option[];
  ariaLabel?: string;
}) {
  const opts = options ?? [
    { lang: "ko", label: "한국어" },
    { lang: "en", label: "English" },
  ];

  return (
    <div
      className="inline-flex rounded-full p-0.5"
      style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-subtle)" }}
      role="group"
      aria-label={ariaLabel}
    >
      {opts.map((o) => {
        const active = value === o.lang;
        return (
          <button
            key={o.lang}
            onClick={() => onChange(o.lang)}
            className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            style={{ background: active ? "var(--color-accent)" : "transparent", color: active ? "#fff" : "var(--color-text-tertiary)" }}
            aria-pressed={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
