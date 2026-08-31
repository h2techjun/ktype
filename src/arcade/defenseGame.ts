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

// 성문 방어 — 좌/우 가장자리에서 성문(중앙)으로 다가오는 단어를 타이핑해 격파.
// 성문에 닿으면 HP 감소, HP 0 이면 함락. 웨이브가 오를수록 빨라진다.
const MAX_HP = 5;

export interface Attacker {
  id: number;
  word: GameWord;
  side: "left" | "right";
  pos: number; // 0=가장자리 → 100=성문
  laneYPct: number;
}

export interface DefenseState {
  lang: Lang;
  attackers: Attacker[];
  typed: TypeState;
  hp: number;
  score: number;
  wave: number;
  elapsedMs: number;
  spawnTimer: number;
  nextId: number;
  status: "playing" | "over";
  fxSeq: number;
  shake: number;
}

export type DefenseAction =
  | { t: "tick"; dt: number }
  | InputAction
  | { t: "reset" };

const attackSpeed = (wave: number): number => 0.016 + wave * 0.004;
const spawnInterval = (wave: number): number => Math.max(2600 - wave * 180, 1100);
const maxLen = (lang: Lang, wave: number): number =>
  lang === "en" ? Math.min(3 + wave, 7) : Math.min(2 + Math.floor(wave / 2), 4);

function spawn(nextId: number, wave: number, lang: Lang): Attacker {
  return {
    id: nextId,
    word: pickWord(lang, maxLen(lang, wave)),
    side: Math.random() < 0.5 ? "left" : "right",
    pos: 0,
    laneYPct: 18 + Math.random() * 60,
  };
}

export function initDefense(lang: Lang): DefenseState {
  return {
    lang,
    attackers: [],
    typed: emptyType(lang),
    hp: MAX_HP,
    score: 0,
    wave: 1,
    elapsedMs: 0,
    spawnTimer: 700,
    nextId: 1,
    status: "playing",
    fxSeq: 0,
    shake: 0,
  };
}

export function defenseReducer(s: DefenseState, a: DefenseAction): DefenseState {
  if (a.t === "reset") return initDefense(s.lang);

  if (a.t === "tick") {
    if (s.status !== "playing") return s;
    const elapsedMs = s.elapsedMs + a.dt;
    const wave = 1 + Math.floor(elapsedMs / 20000);
    const speed = attackSpeed(wave);

    const moved = s.attackers.map((at) => ({ ...at, pos: at.pos + speed * a.dt }));
    const breached = moved.filter((at) => at.pos >= 100);
    let attackers = moved.filter((at) => at.pos < 100);
    const hp = s.hp - breached.length;
    const shake = s.shake + (breached.length > 0 ? 1 : 0);

    let typed = s.typed;
    const cur = typeText(s.typed);
    if (cur && breached.some((at) => textPrefixMatches(cur, at.word.text, s.lang))) typed = emptyType(s.lang);

    let spawnTimer = s.spawnTimer - a.dt;
    let nextId = s.nextId;
    if (spawnTimer <= 0) {
      spawnTimer += spawnInterval(wave);
      attackers = [...attackers, spawn(nextId, wave, s.lang)];
      nextId += 1;
    }

    const status = hp <= 0 ? "over" : "playing";
    return { ...s, attackers, hp, wave, elapsedMs, spawnTimer, nextId, typed, status, shake };
  }

  if (s.status !== "playing") return s;

  if (isEraseInput(a)) {
    return { ...s, typed: applyInput(s.typed, a) };
  }

  const nextTyped = applyInput(s.typed, a);
  if (nextTyped === s.typed) return s;
  const txt = typeText(nextTyped);

  const hit = s.attackers.find((at) => textComplete(txt, at.word.text, s.lang));
  if (hit) {
    return {
      ...s,
      attackers: s.attackers.filter((at) => at.id !== hit.id),
      typed: emptyType(s.lang),
      score: s.score + Array.from(hit.word.text).length * 12 + s.wave * 3,
      fxSeq: s.fxSeq + 1,
    };
  }

  if (s.attackers.some((at) => textPrefixMatches(txt, at.word.text, s.lang))) {
    return { ...s, typed: nextTyped };
  }

  return { ...s, typed: emptyType(s.lang), shake: s.shake + 1 };
}

export { MAX_HP };
