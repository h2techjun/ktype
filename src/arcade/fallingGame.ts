import {
  emptyType,
  typeText,
  textPrefixMatches,
  textComplete,
  correctCells,
  type TypeState,
  type Lang,
} from "../typing/engine";
import { applyInput, isEraseInput, type InputAction } from "./inputAction";
import { pickWord, type GameWord } from "./words";

// 별똥별(낙하 단어 격추) 게임의 순수 상태 머신. 렌더와 분리해 테스트 가능하게 한다.
// 좌표: xPct = 가로 위치(%), y = 세로 위치(px, 0=꼭대기 → FIELD_H=바닥).

export const FIELD_H = 440;
const START_LIVES = 5;

export interface Faller {
  id: number;
  word: GameWord;
  xPct: number;
  y: number;
}

export interface KillFx {
  id: number;
  xPct: number;
  y: number;
  text: string;
}

export interface FallingState {
  lang: Lang;
  fallers: Faller[];
  typed: TypeState;
  score: number;
  lives: number;
  level: number;
  elapsedMs: number;
  spawnTimer: number;
  nextId: number;
  status: "playing" | "over";
  fx: KillFx | null;
  shake: number;
}

export type FallingAction =
  | { t: "tick"; dt: number }
  | InputAction
  | { t: "reset" };

export function initFalling(lang: Lang): FallingState {
  return {
    lang,
    fallers: [],
    typed: emptyType(lang),
    score: 0,
    lives: START_LIVES,
    level: 1,
    elapsedMs: 0,
    spawnTimer: 600,
    nextId: 1,
    status: "playing",
    fx: null,
    shake: 0,
  };
}

const fallSpeed = (level: number): number => 0.028 + level * 0.007;
const spawnInterval = (level: number): number => Math.max(2000 - level * 150, 850);
const maxLen = (lang: Lang, level: number): number =>
  lang === "en" ? Math.min(3 + level, 7) : Math.min(2 + Math.floor(level / 2), 4);
const scoreFor = (w: GameWord, level: number): number => Array.from(w.text).length * 10 + level * 5;

function spawn(s: FallingState): Faller {
  return {
    id: s.nextId,
    word: pickWord(s.lang, maxLen(s.lang, s.level)),
    xPct: 8 + Math.random() * 78,
    y: 0,
  };
}

export function fallingReducer(s: FallingState, a: FallingAction): FallingState {
  if (a.t === "reset") return initFalling(s.lang);

  if (a.t === "tick") {
    if (s.status !== "playing") return s;
    const elapsedMs = s.elapsedMs + a.dt;
    const level = 1 + Math.floor(elapsedMs / 18000);
    const speed = fallSpeed(level);

    const moved = s.fallers.map((f) => ({ ...f, y: f.y + speed * a.dt }));
    const landed = moved.filter((f) => f.y >= FIELD_H);
    let fallers = moved.filter((f) => f.y < FIELD_H);
    const lives = s.lives - landed.length;
    const shake = s.shake + (landed.length > 0 ? 1 : 0);

    let typed = s.typed;
    const cur = typeText(s.typed);
    if (cur && landed.some((f) => textPrefixMatches(cur, f.word.text, s.lang))) typed = emptyType(s.lang);

    let spawnTimer = s.spawnTimer - a.dt;
    let nextId = s.nextId;
    if (spawnTimer <= 0) {
      spawnTimer += spawnInterval(level);
      fallers = [...fallers, spawn({ ...s, level })];
      nextId += 1;
    }

    const status = lives <= 0 ? "over" : "playing";
    return { ...s, fallers, lives, level, elapsedMs, spawnTimer, nextId, typed, status, shake, fx: null };
  }

  // a.t === "key" | "tap" — 물리 키보드·천지인 공통 입력
  if (s.status !== "playing") return s;

  if (isEraseInput(a)) {
    return { ...s, typed: applyInput(s.typed, a) };
  }

  const nextTyped = applyInput(s.typed, a);
  if (nextTyped === s.typed) return s; // 게임과 무관한 키
  const txt = typeText(nextTyped);

  // 완성 → 격추
  const hit = s.fallers.find((f) => textComplete(txt, f.word.text, s.lang));
  if (hit) {
    return {
      ...s,
      fallers: s.fallers.filter((f) => f.id !== hit.id),
      typed: emptyType(s.lang),
      score: s.score + scoreFor(hit.word, s.level),
      fx: { id: hit.id, xPct: hit.xPct, y: hit.y, text: hit.word.text },
    };
  }

  // 접두 매칭 → 계속 입력
  if (s.fallers.some((f) => textPrefixMatches(txt, f.word.text, s.lang))) {
    return { ...s, typed: nextTyped, fx: null };
  }

  // 오타 — 입력 초기화
  return { ...s, typed: emptyType(s.lang), shake: s.shake + 1, fx: null };
}

// 렌더에서 타겟 하이라이트에 쓰는 헬퍼 재노출.
export { textPrefixMatches, typeText, correctCells };
