import { useSettingsStore } from "../store/useSettingsStore";
import { useProgressStore } from "../store/useProgressStore";
import { overallStat } from "../lib/progress";
import type { Lang } from "../typing/engine";
import { Mascot } from "./Mascot";
import { LangToggle } from "./LangToggle";

// 홈 허브 — 두 언어 축.
//   uiLang(화면 언어) = 버튼·설명,  targetLang(연습 언어) = 타이핑 대상.
interface GameEntry {
  id: string;
  emoji: string;
  accent: string;
  ready: boolean;
  ko: { name: string; desc: string };
  en: { name: string; desc: string };
}

const GAMES: GameEntry[] = [
  { id: "falling", emoji: "🌠", accent: "#128fe8", ready: true, ko: { name: "별똥별", desc: "떨어지는 단어를 타이핑해 격추" }, en: { name: "Meteor", desc: "Shoot down falling words" } },
  { id: "defense", emoji: "🛡️", accent: "#10b981", ready: true, ko: { name: "성문 방어", desc: "몰려오는 단어를 막아라" }, en: { name: "Gate Defense", desc: "Stop the incoming words" } },
  { id: "bubble", emoji: "🔵", accent: "#38bdf8", ready: true, ko: { name: "버블 팝", desc: "단어 버블을 터뜨려라" }, en: { name: "Bubble Pop", desc: "Pop the word bubbles" } },
  { id: "speed", emoji: "⚡", accent: "#f59e0b", ready: true, ko: { name: "스피드런", desc: "연속 단어를 빠르게" }, en: { name: "Speed Run", desc: "Clear words as fast as you can" } },
];

const TEXT: Record<Lang, {
  subtitle: string; displayLabel: string; practiceLabel: string;
  targetKo: string; targetEn: string; practiceName: string; practiceDesc: string; gamesLabel: string; soon: string; quick: string;
}> = {
  ko: {
    subtitle: "K-Type · 타자를 게임처럼",
    displayLabel: "화면",
    practiceLabel: "무엇을 연습할까요?",
    targetKo: "한글 타자",
    targetEn: "영어 타자",
    practiceName: "연습 모드",
    practiceDesc: "자판 → 단어 → 문장, 단계별로 익히기",
    gamesLabel: "🎮 타자 게임",
    soon: "준비중",
    quick: "⚡ 스피드체크",
  },
  en: {
    subtitle: "K-Type · type like a game",
    displayLabel: "Display",
    practiceLabel: "What do you want to practice?",
    targetKo: "Korean typing",
    targetEn: "English typing",
    practiceName: "Practice",
    practiceDesc: "Keys → words → sentences, step by step",
    gamesLabel: "🎮 Typing Games",
    soon: "Soon",
    quick: "⚡ Speed check",
  },
};

export function HomeScreen({ onQuick, onPractice, onGame }: { onQuick: () => void; onPractice: () => void; onGame: (id: string) => void }) {
  const uiLang = useSettingsStore((s) => s.uiLang);
  const setUiLang = useSettingsStore((s) => s.setUiLang);
  const targetLang = useSettingsStore((s) => s.targetLang);
  const setTargetLang = useSettingsStore((s) => s.setTargetLang);
  const best = useProgressStore((s) => s.best);
  const overall = overallStat(targetLang, best);
  const t = TEXT[uiLang];

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-6 px-4 py-8">
      {/* 스피드체크로 복귀(좌) · 화면 언어(우) */}
      <div className="flex items-center justify-between gap-2">
        <button onClick={onQuick} className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "var(--color-bg-card)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}>
          ← {t.quick}
        </button>
        <div className="flex items-center gap-2">
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{t.displayLabel}</span>
        <LangToggle value={uiLang} onChange={setUiLang} ariaLabel={t.displayLabel} />
        </div>
      </div>

      <header className="flex flex-col items-center gap-2 text-center">
        <div className="ktype-float"><Mascot mood="happy" size={80} /></div>
        <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--color-text-hero)" }}>
          {uiLang === "en" ? "K-Type" : "한글 타자"}
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>{t.subtitle}</p>
      </header>

      {/* 연습 언어(크게, 핵심 선택) */}
      <div className="flex flex-col items-center gap-2 rounded-2xl px-4 py-4" style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-default)" }}>
        <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>{t.practiceLabel}</span>
        <LangToggle
          value={targetLang}
          onChange={setTargetLang}
          ariaLabel={t.practiceLabel}
          options={[{ lang: "ko", label: `🇰🇷 ${t.targetKo}` }, { lang: "en", label: `🔤 ${t.targetEn}` }]}
        />
      </div>

      {/* 연습 모드 */}
      <button
        onClick={onPractice}
        className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all hover:-translate-y-0.5"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-default)" }}
      >
        <span className="text-3xl">📚</span>
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-lg font-bold" style={{ color: "var(--color-text-hero)" }}>{t.practiceName}</span>
          <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{t.practiceDesc}</span>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--color-bg-elevated)" }}>
              <div className="h-full rounded-full" style={{ width: `${overall.total ? Math.round((overall.done / overall.total) * 100) : 0}%`, background: "var(--color-accent)" }} />
            </div>
            <span className="text-[10px] tabular-nums" style={{ color: "var(--color-text-muted)" }}>{overall.done}/{overall.total} · {overall.stars}★</span>
          </div>
        </div>
        <span className="text-xl" style={{ color: "var(--color-accent-hover)" }}>›</span>
      </button>

      {/* 게임 모드 */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>{t.gamesLabel}</h2>
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((g) => {
            const info = g[uiLang];
            return (
              <button
                key={g.id}
                disabled={!g.ready}
                onClick={() => g.ready && onGame(g.id)}
                className="relative flex flex-col gap-1 rounded-2xl px-4 py-4 text-left transition-all enabled:hover:-translate-y-0.5 disabled:opacity-45"
                style={{ background: "var(--color-bg-card)", border: `1px solid ${g.ready ? "var(--color-border-default)" : "var(--color-border-subtle)"}` }}
              >
                <span className="text-3xl" style={{ filter: g.ready ? `drop-shadow(0 0 10px ${g.accent}66)` : "none" }}>{g.emoji}</span>
                <span className="mt-1 text-base font-bold" style={{ color: "var(--color-text-hero)" }}>{info.name}</span>
                <span className="text-[11px] leading-snug" style={{ color: "var(--color-text-muted)" }}>{info.desc}</span>
                {!g.ready && <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-tertiary)" }}>{t.soon}</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
