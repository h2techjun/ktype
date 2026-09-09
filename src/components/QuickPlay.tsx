import { useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { useProgressStore, isBetter } from "../store/useProgressStore";
import { useSettingsStore, resolveKeyLayout } from "../store/useSettingsStore";
import { nextExpectedJamo } from "../hangul/ime";
import { SHIFT_JAMO, shiftBase } from "../hangul/dubeolsik";
import { cjiNextTap } from "../hangul/cheonjiin";
import { useIsTouch } from "../lib/useIsTouch";
import { computeSpeed, computeAccuracy, stars } from "../lib/metrics";
import { typeText, type Lang } from "../typing/engine";
import { sound } from "../lib/sound";
import { shareResult, type ShareOutcome } from "../lib/share";
import { QUICK_STAGE_ID, QUICK_ITEM_COUNT, speedTier, cpmToNextTier, accuracyTiles, buildQuickShareText } from "../quick/quickRound";
import { useTypingKeys, useDocumentFocus, useCountUp } from "../quick/useTypingKeys";
import { TargetText } from "./TargetText";
import { JamoAssembly } from "./JamoAssembly";
import { VirtualKeyboard } from "./VirtualKeyboard";
import { LangToggle } from "./LangToggle";
import { Mascot } from "./Mascot";

// 첫 화면 = 스피드체크. 메뉴를 고르기 전에 이미 타이핑이 시작돼 있어야 한다.
// (라이브 실측: 방문자는 언어→모드→스테이지 3단계를 못 넘기고 7초 안에 떠났다.)
//   · 아무 키나 누르면 타이머 시작, 문장 3개, 15~20초
//   · 결과 = 등급(동물)·타/분 카운트업·정확도 타일 → 공유·재도전·게임/연습 진입
const T = {
  ko: {
    title: "스피드체크", sub: `문장 ${QUICK_ITEM_COUNT}개 · 15초`, practice: "📚 단계별 연습", games: "🎮 게임",
    hint: "아무 키나 눌러 시작", tapHint: "아래 자판을 눌러 시작", cheonjiin: "📱 천지인", qwerty: "⌨️ 두벌식", focusHint: "여기를 클릭하고 타이핑 ⌨️", next: "다음", cpm: "타/분", acc: "정확도", combo: "콤보",
    best: "내 최고", again: "한 번 더", enter: "Enter ↵", share: "결과 공유", copied: "복사됨 ✓", shared: "공유됨 ✓", failed: "공유 실패",
    shiftHint: (base: string, jamo: string) => `⇧ Shift + ${base} = ${jamo}`, wrongChip: (ch: string) => `✗ ${ch}`,
    newBest: "🎉 신기록", nextTier: (emoji: string, name: string, n: number) => `${emoji} ${name}까지 ${n}타/분`, top: "최고 등급 달성!",
    grade: (name: string) => `${name} 등급`,
    toGames: "🎮 게임으로 겨루기", toPractice: "📚 단계별 연습",
  },
  en: {
    title: "Speed check", sub: `${QUICK_ITEM_COUNT} sentences · 15s`, practice: "📚 Practice", games: "🎮 Games",
    hint: "Press any key to start", tapHint: "Tap the keys below to start", cheonjiin: "📱 Cheonjiin", qwerty: "⌨️ 2-set", focusHint: "Click here, then type ⌨️", next: "next", cpm: "CPM", acc: "accuracy", combo: "combo",
    best: "Best", again: "Again", enter: "Enter ↵", share: "Share", copied: "Copied ✓", shared: "Shared ✓", failed: "Failed",
    shiftHint: (base: string, jamo: string) => `⇧ Hold Shift + ${base} for ${jamo}`, wrongChip: (ch: string) => `✗ ${ch}`,
    newBest: "🎉 New best", nextTier: (emoji: string, name: string, n: number) => `${n} CPM to ${emoji} ${name}`, top: "Top tier reached!",
    grade: (name: string) => `${name} tier`,
    toGames: "🎮 Play the games", toPractice: "📚 Step-by-step practice",
  },
} as const;

const bestKey = (lang: Lang) => `quick:${lang}`;

export function QuickPlay({ onPractice, onGames }: { onPractice: () => void; onGames: () => void }) {
  const uiLang = useSettingsStore((s) => s.uiLang);
  const setUiLang = useSettingsStore((s) => s.setUiLang);
  const targetLang = useSettingsStore((s) => s.targetLang);
  const setTargetLang = useSettingsStore((s) => s.setTargetLang);
  const phase = useGameStore((s) => s.phase);
  const stageId = useGameStore((s) => s.stageId);
  const startQuick = useGameStore((s) => s.startQuick);
  const t = T[uiLang];

  // 마운트 즉시 라운드 준비 — 타이머는 첫 키에서만 돈다(startMs 지연).
  useEffect(() => {
    const st = useGameStore.getState();
    if (st.stageId !== QUICK_STAGE_ID) startQuick(targetLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTarget = (lang: Lang) => {
    setTargetLang(lang);
    startQuick(lang);
  };

  const isQuick = stageId === QUICK_STAGE_ID;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col gap-3 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-black tracking-tight" style={{ color: "var(--color-text-hero)" }}>⚡ {t.title}</span>
          <LangToggle
            value={targetLang}
            onChange={changeTarget}
            ariaLabel="practice language"
            options={[{ lang: "ko", label: "🇰🇷 한글" }, { lang: "en", label: "🔤 ABC" }]}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <NavChip onClick={onPractice}>{t.practice}</NavChip>
          <NavChip onClick={onGames}>{t.games}</NavChip>
          <LangToggle value={uiLang} onChange={setUiLang} ariaLabel="display language" />
        </div>
      </div>

      {isQuick && phase === "done" ? (
        <QuickResult uiLang={uiLang} onAgain={() => startQuick(targetLang)} onGames={onGames} onPractice={onPractice} />
      ) : (
        <QuickTyping uiLang={uiLang} />
      )}
    </div>
  );
}

function NavChip({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-bold transition-transform hover:-translate-y-0.5 active:translate-y-0"
      style={{ background: "var(--color-bg-card)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-default)" }}
    >
      {children}
    </button>
  );
}

function QuickTyping({ uiLang }: { uiLang: Lang }) {
  const t = T[uiLang];
  const phase = useGameStore((s) => s.phase);
  const typed = useGameStore((s) => s.typed);
  const lang = useGameStore((s) => s.lang);
  const itemIndex = useGameStore((s) => s.itemIndex);
  const correctKeys = useGameStore((s) => s.correctKeys);
  const errorKeys = useGameStore((s) => s.errorKeys);
  const combo = useGameStore((s) => s.combo);
  const startMs = useGameStore((s) => s.startMs);
  const nowMs = useGameStore((s) => s.nowMs);
  const stage = useGameStore((s) => s.currentStage());
  const itemDone = useGameStore((s) => s.itemDone);
  const best = useProgressStore((s) => s.best[bestKey(lang)]);

  const keyLayoutPref = useSettingsStore((s) => s.keyLayout);
  const setKeyLayout = useSettingsStore((s) => s.setKeyLayout);
  const touch = useIsTouch();
  const layout = resolveKeyLayout(keyLayoutPref, touch);
  const focused = useDocumentFocus();
  const { mood, shake, wrong } = useTypingKeys(lang, phase === "playing");

  if (phase !== "playing" || !stage) return null;

  const item = stage.items[itemIndex];
  const target = item?.text ?? "";
  const nextItem = stage.items[itemIndex + 1];
  const started = startMs != null;
  const elapsed = started ? nowMs - startMs : 0;
  const speed = computeSpeed(correctKeys, elapsed);
  const accuracy = computeAccuracy(correctKeys, errorKeys);
  const nextJamo = lang === "ko" ? nextExpectedJamo(target, typed.ime) : null;
  const nextKey = lang === "ko" ? nextJamo : Array.from(target)[Array.from(typeText(typed)).length] ?? null;
  const rawNextTap = nextJamo ? cjiNextTap(nextJamo, typed.tap.seq) : null;
  const nextTap = rawNextTap !== null && typed.tap.key === rawNextTap ? "Commit" : rawNextTap;
  const needsFocus = !touch && !focused && !started;
  const tier = speedTier(speed.cpm);
  const shiftJamo = nextJamo && SHIFT_JAMO.has(nextJamo) ? nextJamo : null;
  const shiftFrom = shiftJamo ? shiftBase(shiftJamo) : null;

  return (
    <>
      <div className="ktype-glow-bg" style={{ ["--ktype-glow" as string]: started ? tier.color : "var(--color-accent)" }} aria-hidden />
      {/* 라이브 HUD — 타/분이 주인공. 치는 동안 숫자가 자라는 게 첫 7초의 보상이다. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="ktype-float"><Mascot mood={mood} size={56} /></div>
          <div className="flex flex-col">
            <span className="text-4xl font-black leading-none tabular-nums" style={{ color: started ? tier.color : "var(--color-text-muted)", textShadow: started ? `0 0 18px ${tier.color}66` : "none" }}>
              {speed.cpm}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: "var(--color-text-muted)" }}>{t.cpm} {started ? tier.emoji : ""}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Mini label={t.acc} value={`${accuracy}%`} warn={accuracy < 95 && started} />
          <Mini label={t.combo} value={combo > 0 ? `${combo}×` : "—"} glow={combo >= 3} />
          <div className="flex items-center gap-1" aria-label={`${itemIndex + 1} / ${stage.items.length}`}>
            {stage.items.map((_, i) => (
              <span key={i} className="block h-2 w-2 rounded-full transition-colors" style={{ background: i < itemIndex ? "var(--color-success)" : i === itemIndex ? "var(--color-accent-hover)" : "var(--color-border-strong)" }} />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`relative flex flex-col items-center gap-3 rounded-3xl px-4 py-6 ${shake ? "ktype-shake" : ""}`}
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-default)", boxShadow: "0 6px 0 0 #0b0d14" }}
        onClick={() => { sound.unlock(); window.focus(); }}
      >
        <TargetText target={target} typed={typed} lang={lang} done={itemDone} />
        {wrong && (
          <span className="ktype-wrong-chip absolute right-3 top-3 rounded-full px-2.5 py-1 text-sm font-black" style={{ background: "var(--color-danger-bg)", color: "#fecaca", border: "1px solid var(--color-danger)" }}>
            {t.wrongChip(wrong)}
          </span>
        )}
        {itemDone && (
          <span className="ktype-pop absolute left-3 top-3 rounded-full px-2.5 py-1 text-sm font-black" style={{ background: "var(--color-success-bg)", color: "#d1fae5", border: "1px solid var(--color-success)" }}>
            ✓
          </span>
        )}
        {(item?.roman || item?.gloss) && (
          <div className="text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            {item?.roman && <span className="italic">{item.roman}</span>}
            {item?.roman && item?.gloss && <span> · </span>}
            {item?.gloss && <span>{item.gloss}</span>}
          </div>
        )}
        {nextItem && (
          <div className="text-center text-sm" style={{ color: "var(--color-text-muted)", opacity: 0.55 }}>
            {t.next} · {nextItem.text}
          </div>
        )}
        {!started && !needsFocus && (
          <div className="ktype-pulse mt-1 rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: "var(--color-accent-bg)", color: "var(--color-accent-hover)", border: "1px solid var(--color-accent)" }}>
            {touch ? `👇 ${t.tapHint}` : `⌨️ ${t.hint}`} · {t.sub}
          </div>
        )}
        {needsFocus && (
          <button
            type="button"
            className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-3xl backdrop-blur-[2px]"
            style={{ background: "rgba(7,8,11,0.55)" }}
            onClick={() => window.focus()}
          >
            <span className="ktype-pulse rounded-full px-5 py-2.5 text-base font-black" style={{ background: "var(--color-accent)", color: "#fff", boxShadow: "0 4px 0 0 #0a3a5c" }}>
              {t.focusHint}
            </span>
          </button>
        )}
      </div>

      {lang === "ko" && <JamoAssembly ime={typed.ime} compact />}

      {shiftJamo && shiftFrom && (
        <div className="ktype-pop mx-auto rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--color-warning)", color: "#1a1206" }}>
          {t.shiftHint(shiftFrom, shiftJamo)}
        </div>
      )}

      {best && !started && !touch && (
        <div className="text-center text-xs font-semibold" style={{ color: "var(--color-text-tertiary)" }}>
          {t.best} · {speedTier(best.cpm).emoji} {best.cpm} {t.cpm} · {best.accuracy}%
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        {lang === "ko" && touch && (
          <div className="flex justify-center gap-1.5">
            {(["cheonjiin", "qwerty"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setKeyLayout(v)}
                className="rounded-full px-3 py-1 text-[11px] font-semibold"
                style={{
                  background: layout === v ? "var(--color-accent-bg)" : "transparent",
                  color: layout === v ? "var(--color-accent-hover)" : "var(--color-text-muted)",
                  border: `1px solid ${layout === v ? "var(--color-accent)" : "var(--color-border-subtle)"}`,
                }}
              >
                {v === "cheonjiin" ? t.cheonjiin : t.qwerty}
              </button>
            ))}
          </div>
        )}
        <VirtualKeyboard
          lang={lang}
          uiLang={uiLang}
          layout={layout}
          next={nextKey}
          nextTap={nextTap}
          compact={!touch}
          hideHint
          onTap={(tap) => { sound.unlock(); useGameStore.getState().tapKey(tap); }}
          onKey={(k) => { sound.unlock(); useGameStore.getState().pressKey(k.code, k.key, k.shift); }}
        />
      </div>
    </>
  );
}

function Mini({ label, value, warn, glow }: { label: string; value: string; warn?: boolean; glow?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-xl font-extrabold tabular-nums"
        style={{
          color: warn ? "var(--color-warning)" : glow ? "var(--color-accent-hover)" : "var(--color-text-secondary)",
          textShadow: glow ? "0 0 14px var(--color-accent)" : "none",
        }}
      >
        {value}
      </span>
      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{label}</span>
    </div>
  );
}

function QuickResult({ uiLang, onAgain, onGames, onPractice }: { uiLang: Lang; onAgain: () => void; onGames: () => void; onPractice: () => void }) {
  const t = T[uiLang];
  const lang = useGameStore((s) => s.lang);
  const correctKeys = useGameStore((s) => s.correctKeys);
  const errorKeys = useGameStore((s) => s.errorKeys);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const startMs = useGameStore((s) => s.startMs);
  const nowMs = useGameStore((s) => s.nowMs);

  const elapsed = startMs != null ? nowMs - startMs : 0;
  const speed = computeSpeed(correctKeys, elapsed);
  const accuracy = computeAccuracy(correctKeys, errorKeys);
  const tier = speedTier(speed.cpm);
  const toNext = cpmToNextTier(speed.cpm);
  const shown = useCountUp(speed.cpm);
  const record = { cpm: speed.cpm, wpm: speed.wpm, accuracy, stars: stars(accuracy, speed.cpm), maxCombo };
  // 신기록 여부는 저장 "전" 스냅샷과 비교한다 — effect 가 두 번 돌아도(StrictMode) 답이 같다.
  const [prevBest] = useState(() => useProgressStore.getState().best[bestKey(lang)]);
  const isNewBest = isBetter(record, prevBest);
  const [shareMsg, setShareMsg] = useState<ShareOutcome | null>(null);

  useEffect(() => {
    useProgressStore.getState().record(bestKey(lang), record);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Enter = 한 번 더. 결과를 본 뒤 마우스로 갈 필요가 없어야 연속 플레이가 된다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); onAgain(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAgain]);

  const onShare = async () => {
    setShareMsg(await shareResult(buildQuickShareText(lang, speed.cpm, accuracy, maxCombo)));
  };

  return (
    <div className="relative flex flex-col items-center gap-4 py-2">
      <div
        className="ktype-pop relative flex w-full flex-col items-center gap-2.5 rounded-3xl px-6 py-5"
        style={{ background: "var(--color-bg-card)", border: `1px solid ${tier.color}55`, boxShadow: `0 8px 0 0 #0b0d14, 0 0 40px -12px ${tier.color}` }}
      >
        <div className="ktype-float"><Mascot mood={accuracy >= 90 ? "celebrate" : "happy"} size={56} /></div>

        <div className="ktype-reveal flex items-center gap-2 rounded-full px-4 py-1.5 text-base font-black" style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}` }}>
          <span className="text-2xl">{tier.emoji}</span>
          <span>{t.grade(tier.label[uiLang])}</span>
        </div>

        <div className="flex items-end gap-2">
          <span className="text-6xl font-black leading-none tabular-nums" style={{ color: "var(--color-text-hero)", textShadow: `0 0 30px ${tier.color}55` }}>{shown}</span>
          <span className="pb-2 text-base font-bold" style={{ color: "var(--color-text-tertiary)" }}>{t.cpm}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-lg tracking-tight" aria-label={`${t.acc} ${accuracy}%`}>{accuracyTiles(accuracy)}</span>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            {t.acc} {accuracy}% · {t.combo} {maxCombo}× · {Math.round(elapsed / 100) / 10}s
          </span>
        </div>

        <p className="text-center text-sm" style={{ color: "var(--color-text-tertiary)" }}>{tier.note[uiLang]}</p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {isNewBest && (
            <span className="ktype-pop rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}>{t.newBest}</span>
          )}
          <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>
            {toNext ? t.nextTier(toNext.next.emoji, toNext.next.label[uiLang], toNext.remaining) : t.top}
          </span>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={onAgain}
            className="ktype-btn-hard flex-[3] rounded-2xl py-3 text-lg font-black"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            🔁 {t.again} <span className="ml-1 text-xs font-semibold opacity-80">{t.enter}</span>
          </button>
          <button
            onClick={onShare}
            className="ktype-btn-hard flex-[2] rounded-2xl py-3 text-base font-bold"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-hero)", border: "1px solid var(--color-border-default)" }}
          >
            📤 {shareMsg === "copied" ? t.copied : shareMsg === "shared" ? t.shared : shareMsg === "failed" ? t.failed : t.share}
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={onGames} className="flex-1 rounded-2xl py-2.5 text-sm font-bold active:scale-95" style={{ background: "var(--color-bg-card)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{t.toGames}</button>
          <button onClick={onPractice} className="flex-1 rounded-2xl py-2.5 text-sm font-bold active:scale-95" style={{ background: "var(--color-bg-card)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}>{t.toPractice}</button>
        </div>
      </div>
    </div>
  );
}
