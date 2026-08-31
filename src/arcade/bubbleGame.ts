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

// 버블 팝 — 떠다니는 단어 버블을 타이핑해 터뜨린다. 60초 점수 어택(생명 없음).
export const BUBBLE_DURATION = 60000;
const MAX_BUBBLES = 6;
const maxLenFor = (lang: Lang): number => (lang === "en" ? 5 : 3);

export interface Bubble {
  id: number;
  word: GameWord;
  xPct: number;
  yPct: number;
  vx: number;
  vy: number;
}

export interface BubbleState {
  lang: Lang;
  bubbles: Bubble[];
  typed: TypeState;
  score: number;
  popped: number;
  timeLeftMs: number;
  status: "playing" | "over";
  nextId: number;
  spawnTimer: number;
  fxSeq: number;
  fxPos: { xPct: number; yPct: number } | null;
  shake: number;
}

export type BubbleAction =
  | { t: "tick"; dt: number }
  | InputAction
  | { t: "reset" };

function makeBubble(id: number, lang: Lang): Bubble {
  const ang = Math.random() * Math.PI * 2;
  const spd = 0.006 + Math.random() * 0.006;
  return {
    id,
    word: pickWord(lang, maxLenFor(lang)),
    xPct: 15 + Math.random() * 70,
    yPct: 15 + Math.random() * 60,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
  };
}

export function initBubble(lang: Lang): BubbleState {
  let id = 1;
  const bubbles = [makeBubble(id++, lang), makeBubble(id++, lang), makeBubble(id++, lang)];
  return {
    lang,
    bubbles,
    typed: emptyType(lang),
    score: 0,
    popped: 0,
    timeLeftMs: BUBBLE_DURATION,
    status: "playing",
    nextId: id,
    spawnTimer: 2000,
    fxSeq: 0,
    fxPos: null,
    shake: 0,
  };
}

function bounce(b: Bubble, dt: number): Bubble {
  let xPct = b.xPct + b.vx * dt;
  let yPct = b.yPct + b.vy * dt;
  let vx = b.vx;
  let vy = b.vy;
  if (xPct < 8 || xPct > 88) {
    vx = -vx;
    xPct = Math.max(8, Math.min(88, xPct));
  }
  if (yPct < 8 || yPct > 82) {
    vy = -vy;
    yPct = Math.max(8, Math.min(82, yPct));
  }
  return { ...b, xPct, yPct, vx, vy };
}

export function bubbleReducer(s: BubbleState, a: BubbleAction): BubbleState {
  if (a.t === "reset") return initBubble(s.lang);

  if (a.t === "tick") {
    if (s.status !== "playing") return s;
    const timeLeftMs = s.timeLeftMs - a.dt;
    if (timeLeftMs <= 0) return { ...s, timeLeftMs: 0, status: "over" };
    let bubbles = s.bubbles.map((b) => bounce(b, a.dt));
    let spawnTimer = s.spawnTimer - a.dt;
    let nextId = s.nextId;
    if (spawnTimer <= 0 && bubbles.length < MAX_BUBBLES) {
      spawnTimer += 2400;
      bubbles = [...bubbles, makeBubble(nextId, s.lang)];
      nextId += 1;
    }
    return { ...s, bubbles, timeLeftMs, spawnTimer, nextId, fxPos: null };
  }

  if (s.status !== "playing") return s;

  if (isEraseInput(a)) {
    return { ...s, typed: applyInput(s.typed, a) };
  }

  const nextTyped = applyInput(s.typed, a);
  if (nextTyped === s.typed) return s;
  const txt = typeText(nextTyped);

  const hit = s.bubbles.find((b) => textComplete(txt, b.word.text, s.lang));
  if (hit) {
    return {
      ...s,
      bubbles: s.bubbles.filter((b) => b.id !== hit.id),
      typed: emptyType(s.lang),
      score: s.score + Array.from(hit.word.text).length * 15,
      popped: s.popped + 1,
      fxSeq: s.fxSeq + 1,
      fxPos: { xPct: hit.xPct, yPct: hit.yPct },
    };
  }

  if (s.bubbles.some((b) => textPrefixMatches(txt, b.word.text, s.lang))) {
    return { ...s, typed: nextTyped };
  }

  return { ...s, typed: emptyType(s.lang), shake: s.shake + 1 };
}
