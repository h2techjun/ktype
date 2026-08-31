import { create } from "zustand";
import {
  emptyType,
  applyType,
  applyTap,
  typeText,
  hasTypeError,
  textComplete,
  correctCells,
  type TypeState,
  type Lang,
} from "../typing/engine";
import { findStage, type TypingStage } from "../data";

// 브라우저 런타임 타임스탬프(워크플로 스크립트가 아닌 앱 코드라 Date.now 사용 가능).
const now = (): number => Date.now();

export type GamePhase = "select" | "playing" | "done";
export type HitKind = "key" | "correct" | "error" | "complete" | null;

interface GameState {
  phase: GamePhase;
  stageId: string | null;
  lang: Lang;
  itemIndex: number;
  typed: TypeState;
  // 통계
  startMs: number | null;
  nowMs: number;
  keystrokes: number;
  correctKeys: number;
  errorKeys: number;
  combo: number;
  maxCombo: number;
  correctSyllables: number;
  itemPrevCorrect: number;
  // 사운드·이펙트 트리거
  lastHit: HitKind;
  hitSeq: number;
  // 파생 조회
  currentStage(): TypingStage | undefined;
  currentTarget(): string;
  // 액션
  startStage(id: string, lang: Lang): void;
  pressKey(code: string, key: string, shift: boolean): void;
  /** 천지인 자판 탭 하나(모바일 입력 경로). */
  tapKey(tap: string): void;
  tick(): void;
  backToSelect(): void;
}

const freshState = (lang: Lang) => ({
  itemIndex: 0,
  typed: emptyType(lang),
  startMs: null as number | null,
  nowMs: 0,
  keystrokes: 0,
  correctKeys: 0,
  errorKeys: 0,
  combo: 0,
  maxCombo: 0,
  correctSyllables: 0,
  itemPrevCorrect: 0,
  lastHit: null as HitKind,
  hitSeq: 0,
});

export const useGameStore = create<GameState>((set, get) => ({
  phase: "select",
  stageId: null,
  lang: "ko",
  ...freshState("ko"),

  currentStage: () => {
    const id = get().stageId;
    return id ? findStage(id) : undefined;
  },
  currentTarget: () => {
    const st = get().currentStage();
    return st ? st.items[get().itemIndex]?.text ?? "" : "";
  },

  startStage: (id, lang) => {
    if (!findStage(id)) return;
    set({ phase: "playing", stageId: id, lang, ...freshState(lang) });
  },

  backToSelect: () => set({ phase: "select", stageId: null, ...freshState(get().lang) }),

  tick: () => {
    if (get().phase === "playing" && get().startMs !== null) set({ nowMs: now() });
  },

  pressKey: (code, key, shift) => {
    const s = get();
    if (s.phase !== "playing" || !s.currentStage()) return;
    // 백스페이스 — 통계 미집계. itemPrevCorrect(콤보 high-water)는 낮추지 않는다.
    if (key === "Backspace") {
      set({ typed: applyType(s.typed, code, key, shift) });
      return;
    }
    const next = applyType(s.typed, code, key, shift);
    if (next === s.typed) return; // 게임과 무관한 키
    commitInput(next);
  },

  tapKey: (tap) => {
    const s = get();
    if (s.phase !== "playing" || !s.currentStage()) return;
    if (tap === "Backspace") {
      set({ typed: applyTap(s.typed, tap, now()) });
      return;
    }
    commitInput(applyTap(s.typed, tap, now()));
  },
}));

/** 물리 키보드·천지인 자판 공통 — 입력 결과를 통계·진행에 반영한다.
 *  두 입력 경로가 같은 채점 로직을 쓰도록 한 곳에 모았다. */
function commitInput(nextTyped: TypeState): void {
  const set = useGameStore.setState;
  const s = useGameStore.getState();
  const stage = s.currentStage();
  if (!stage) return;
  const target = stage.items[s.itemIndex]?.text ?? "";
  const lang = s.lang;

  {
    const startMs = s.startMs ?? now();
    const after = typeText(nextTyped);
    const wrong = hasTypeError(nextTyped, target);

    let { keystrokes, correctKeys, errorKeys, combo, maxCombo, itemPrevCorrect } = s;
    let syllableCompleted = false;
    keystrokes += 1;
    if (wrong) {
      errorKeys += 1;
      combo = 0;
    } else {
      correctKeys += 1;
      const cn = correctCells(after, target, lang);
      if (cn > itemPrevCorrect) {
        combo += cn - itemPrevCorrect;
        maxCombo = Math.max(maxCombo, combo);
        itemPrevCorrect = cn;
        syllableCompleted = true;
      }
    }

    const hitSeq = s.hitSeq + 1;

    if (textComplete(after, target, lang)) {
      const correctSyllables = s.correctSyllables + Array.from(target).length;
      const lastItem = s.itemIndex + 1 >= stage.items.length;
      set({
        keystrokes, correctKeys, errorKeys, combo, maxCombo, correctSyllables,
        startMs, nowMs: now(),
        phase: lastItem ? "done" : "playing",
        itemIndex: lastItem ? s.itemIndex : s.itemIndex + 1,
        typed: emptyType(lang),
        itemPrevCorrect: 0,
        lastHit: "complete", hitSeq,
      });
      return;
    }

    const lastHit: HitKind = wrong ? "error" : syllableCompleted ? "correct" : "key";
    set({
      typed: nextTyped, keystrokes, correctKeys, errorKeys, combo, maxCombo,
      itemPrevCorrect, startMs, nowMs: now(), lastHit, hitSeq,
    });
  }
}
