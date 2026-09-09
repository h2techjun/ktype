import { useEffect, useState } from "react";
import { useGameStore } from "../store/useGameStore";
import { stagesFor } from "../data";
import { useProgressStore, isBetter } from "../store/useProgressStore";
import { useSettingsStore } from "../store/useSettingsStore";
import { computeSpeed, computeAccuracy, stars } from "../lib/metrics";
import { buildShareText, shareResult, type ShareOutcome } from "../lib/share";
import { earnedBadges } from "../lib/badges";
import { Mascot } from "./Mascot";

const CONFETTI_COLORS = ["#128fe8", "#3aabf7", "#10b981", "#f59e0b", "#38bdf8"];
const PASS_ACCURACY = 95; // 정확도 게이트 — 근거: 초급 단계 정확도 우선(오답 근육기억 방지)

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${(i * 33 + 7) % 100}%`,
            top: 0,
            width: 8,
            height: 8,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            borderRadius: i % 2 ? "50%" : 0,
            animation: `ktype-confetti-fall ${2.4 + (i % 4) * 0.5}s linear ${(i % 7) * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function ResultCard() {
  const stage = useGameStore((s) => s.currentStage());
  const stageId = useGameStore((s) => s.stageId);
  const correctKeys = useGameStore((s) => s.correctKeys);
  const errorKeys = useGameStore((s) => s.errorKeys);
  const maxCombo = useGameStore((s) => s.maxCombo);
  const startMs = useGameStore((s) => s.startMs);
  const nowMs = useGameStore((s) => s.nowMs);
  const startStage = useGameStore((s) => s.startStage);
  const backToSelect = useGameStore((s) => s.backToSelect);
  const lang = useGameStore((s) => s.lang); // 타이핑 언어(다시 시작 시 전달)
  const uiLang = useSettingsStore((s) => s.uiLang); // 표시 언어

  const elapsed = startMs != null ? nowMs - startMs : 0;
  const speed = computeSpeed(correctKeys, elapsed);
  const accuracy = computeAccuracy(correctKeys, errorKeys);
  const star = stars(accuracy, speed.cpm);
  const passed = accuracy >= PASS_ACCURACY;
  const badges = earnedBadges(accuracy, speed.cpm, maxCombo);

  // 같은 언어 커리큘럼에서 바로 다음 스테이지
  const stageList = stagesFor(lang);
  const nextStage = stageList[stageList.findIndex((st) => st.id === stageId) + 1];

  const record = { cpm: speed.cpm, wpm: speed.wpm, accuracy, stars: star, maxCombo };
  // 신기록 여부는 저장 "전" 스냅샷과 비교 — effect 가 두 번 돌아도(StrictMode) 같은 답.
  const [prevBest] = useState(() => (stageId ? useProgressStore.getState().best[stageId] : undefined));
  const isNewBest = isBetter(record, prevBest);
  const [shareMsg, setShareMsg] = useState<ShareOutcome | null>(null);

  useEffect(() => {
    if (!stageId) return;
    useProgressStore.getState().record(stageId, record);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onShare = async () => {
    const text = buildShareText(stage?.title.ko ?? "한글 타자", speed.cpm, accuracy, star);
    setShareMsg(await shareResult(text));
  };

  const Stat = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text-hero)" }}>
        {value}
      </span>
      <span className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-8">
      {passed && <Confetti />}

      <div
        className="ktype-pop relative flex w-full flex-col items-center gap-4 rounded-2xl px-6 py-8"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border-default)" }}
      >
        <div className="ktype-float">
          <Mascot mood={passed ? "celebrate" : "oops"} size={84} />
        </div>

        <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          {stage?.title[uiLang]} {passed ? (uiLang === "en" ? "cleared" : "완료") : (uiLang === "en" ? "try again" : "다시 도전")}
        </span>

        <div className="text-5xl tracking-widest" aria-label={`별 ${star}개`}>
          {"★".repeat(star)}
          <span style={{ color: "var(--color-border-strong)" }}>{"★".repeat(3 - star)}</span>
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {badges.map((b) => (
              <span key={b.id} className="ktype-pop rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "var(--color-accent-bg)", color: "var(--color-accent-hover)", border: "1px solid var(--color-accent)" }}>
                {b.emoji} {b.label[uiLang]}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isNewBest && (
            <span
              className="ktype-pop rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: "var(--color-success-bg)", color: "var(--color-success)" }}
            >
              🎉 {uiLang === "en" ? "New best" : "신기록"}
            </span>
          )}
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={
              passed
                ? { background: "var(--color-success-bg)", color: "var(--color-success)" }
                : { background: "var(--color-danger-bg)", color: "var(--color-danger)" }
            }
          >
            {uiLang === "en"
              ? passed ? `Accuracy ${accuracy}% · pass` : `Accuracy ${accuracy}% · goal ${PASS_ACCURACY}%`
              : passed ? `정확도 ${accuracy}% · 통과` : `정확도 ${accuracy}% · 목표 ${PASS_ACCURACY}%`}
          </span>
        </div>

        <div className="flex w-full justify-around pt-1">
          <Stat label={uiLang === "en" ? "CPM" : "타/분"} value={String(speed.cpm)} />
          <Stat label="WPM" value={String(speed.wpm)} />
          <Stat label={uiLang === "en" ? "Max Combo" : "최대 콤보"} value={String(maxCombo)} />
        </div>

        {!passed && (
          <p className="text-center text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            {uiLang === "en" ? "Accuracy first! Type slowly and precisely." : "속도보다 정확도 먼저! 천천히, 정확하게 쳐보세요."}
          </p>
        )}
      </div>

      <div className="relative flex w-full flex-col gap-2">
        {/* 통과했으면 다음 단계로 바로 이어간다 — 매번 목록으로 돌아가야 하면 흐름이 끊긴다. */}
        {passed && nextStage ? (
          <button
            onClick={() => startStage(nextStage.id, lang)}
            className="w-full rounded-xl py-3 text-base font-semibold transition-transform active:scale-95"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {uiLang === "en" ? "Next: " : "다음 단계: "}
            {nextStage.title[uiLang]} →
          </button>
        ) : null}
        <button
          onClick={() => stageId && startStage(stageId, lang)}
          className="w-full rounded-xl py-3 text-base font-semibold transition-transform active:scale-95"
          style={
            passed && nextStage
              ? { background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }
              : { background: "var(--color-accent)", color: "#fff" }
          }
        >
          {uiLang === "en" ? "Try again" : "다시 도전"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={onShare}
            className="flex-1 rounded-xl py-2.5 text-sm transition-transform active:scale-95"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}
          >
            {shareMsg === "copied" ? (uiLang === "en" ? "Copied ✓" : "결과 복사됨 ✓") : shareMsg === "shared" ? (uiLang === "en" ? "Shared ✓" : "공유됨 ✓") : (uiLang === "en" ? "Share result" : "결과 공유")}
          </button>
          <button
            onClick={backToSelect}
            className="flex-1 rounded-xl py-2.5 text-sm transition-transform active:scale-95"
            style={{ background: "var(--color-bg-elevated)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-subtle)" }}
          >
            {uiLang === "en" ? "List" : "목록으로"}
          </button>
        </div>
      </div>
    </div>
  );
}
