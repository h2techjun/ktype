import {
  emptyType,
  typeText,
  textPrefixMatches,
  textComplete,
  type TypeState,
  type Lang,
} from "../typing/engine";
import { applyInput, isEraseInput, type InputAction } from "./inputAction";
import { pickWord, type GameWord } from "./words";

// 스피드런 — 단어 하나씩 순차 제시, 제한 시간 안에 최대한 많이·빠르게. 오타는 콤보 리셋.
export const SPEED_DURATION = 40000;
const maxLenFor = (lang: Lang): number => (lang === "en" ? 6 : 4);

export interface SpeedState {
  lang: Lang;
  word: GameWord;
  typed: TypeState;
  score: number;
  cleared: number;
  combo: number;
  maxCombo: number;
  timeLeftMs: number;
  status: "playing" | "over";
  shake: number;
  fxSeq: number;
}

export type SpeedAction =
  | { t: "tick"; dt: number }
  | InputAction
  | { t: "reset" };

export function initSpeed(lang: Lang): SpeedState {
  return {
    lang,
    word: pickWord(lang, maxLenFor(lang)),
    typed: emptyType(lang),
    score: 0,
    cleared: 0,
    combo: 0,
    maxCombo: 0,
    timeLeftMs: SPEED_DURATION,
    status: "playing",
    shake: 0,
    fxSeq: 0,
  };
}

export function speedReducer(s: SpeedState, a: SpeedAction): SpeedState {
  if (a.t === "reset") return initSpeed(s.lang);

  if (a.t === "tick") {
    if (s.status !== "playing") return s;
    const timeLeftMs = s.timeLeftMs - a.dt;
    if (timeLeftMs <= 0) return { ...s, timeLeftMs: 0, status: "over" };
    return { ...s, timeLeftMs };
  }

  if (s.status !== "playing") return s;

  if (isEraseInput(a)) {
    return { ...s, typed: applyInput(s.typed, a) };
  }

  const nextTyped = applyInput(s.typed, a);
  if (nextTyped === s.typed) return s;
  const txt = typeText(nextTyped);

  if (textComplete(txt, s.word.text, s.lang)) {
    const combo = s.combo + 1;
    return {
      ...s,
      word: pickWord(s.lang, maxLenFor(s.lang)),
      typed: emptyType(s.lang),
      score: s.score + Array.from(s.word.text).length * 10 + combo * 2,
      cleared: s.cleared + 1,
      combo,
      maxCombo: Math.max(s.maxCombo, combo),
      fxSeq: s.fxSeq + 1,
    };
  }

  if (textPrefixMatches(txt, s.word.text, s.lang)) {
    return { ...s, typed: nextTyped };
  }

  return { ...s, typed: emptyType(s.lang), combo: 0, shake: s.shake + 1 };
}
