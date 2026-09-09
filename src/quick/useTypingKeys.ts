import { useEffect, useState } from "react";
import { useGameStore, ITEM_HOLD_MS } from "../store/useGameStore";
import { isTypableKey, type Lang } from "../typing/engine";
import { sound } from "../lib/sound";
import type { Mood } from "../components/Mascot";

// 연습·스피드체크가 공유하는 타이핑 입력 훅 —
//   물리 키보드 → 스토어, 100ms 타이머 틱, 히트 종류별 사운드, 마스코트 표정·흔들림.
// 같은 로직이 두 화면에 복사돼 있으면 사운드 하나 바꿀 때 한쪽을 빠뜨린다.
export function useTypingKeys(lang: Lang, active: boolean): { mood: Mood; shake: boolean; wrong: string | null } {
  const hitSeq = useGameStore((s) => s.hitSeq);
  const lastHit = useGameStore((s) => s.lastHit);
  const combo = useGameStore((s) => s.combo);
  const itemDone = useGameStore((s) => s.itemDone);
  const lastWrong = useGameStore((s) => s.lastWrong);
  const [mood, setMood] = useState<Mood>("idle");
  const [shake, setShake] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);

  // 완성 보여주기 — ITEM_HOLD_MS 뒤 자동으로 다음 아이템(빠른 타자는 키 입력으로 먼저 넘어간다).
  useEffect(() => {
    if (!active || !itemDone) return;
    const t = window.setTimeout(() => useGameStore.getState().advanceItem(), ITEM_HOLD_MS);
    return () => window.clearTimeout(t);
  }, [active, itemDone]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (!isTypableKey(lang, e.code, e.key, e.shiftKey)) return;
      e.preventDefault();
      sound.unlock();
      useGameStore.getState().pressKey(e.code, e.key, e.shiftKey);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lang, active]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => useGameStore.getState().tick(), 100);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (hitSeq === 0) return;
    if (lastHit === "complete") { sound.complete(); return; }
    if (lastHit === "error") { sound.error(); return; }
    sound.key(hitSeq);
    if (lastHit === "correct") sound.correct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitSeq]);

  useEffect(() => {
    if (hitSeq === 0) return;
    if (lastHit === "error") {
      setMood("oops");
      setShake(true);
      setWrong(lastWrong);
      const t1 = window.setTimeout(() => setShake(false), 240);
      const t2 = window.setTimeout(() => { setMood("idle"); setWrong(null); }, 700);
      return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
    }
    setWrong(null);
    setMood(lastHit === "complete" ? "celebrate" : combo >= 3 ? "happy" : "idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitSeq]);

  return { mood, shake, wrong };
}

/** 문서(iframe 포함)에 키보드 포커스가 있는가 — 없으면 키를 눌러도 게임에 안 들어온다. */
export function useDocumentFocus(): boolean {
  const [focused, setFocused] = useState(() => (typeof document === "undefined" ? true : document.hasFocus()));
  useEffect(() => {
    const on = () => setFocused(true);
    const off = () => setFocused(false);
    window.addEventListener("focus", on);
    window.addEventListener("blur", off);
    // 첫 렌더 뒤 다시 한 번 — iframe 안에서는 초기 hasFocus 가 늦게 바뀐다.
    const t = window.setTimeout(() => setFocused(document.hasFocus()), 50);
    return () => {
      window.removeEventListener("focus", on);
      window.removeEventListener("blur", off);
      window.clearTimeout(t);
    };
  }, []);
  return focused;
}

/** 결과 수치 카운트업(0 → target). reduced-motion 이면 즉시 target. */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target <= 0) { setValue(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}
