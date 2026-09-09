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
import { buildQuickStage } from "../quick/quickRound";

// 브라우저 런타임 타임스탬프(워크플로 스크립트가 아닌 앱 코드라 Date.now 사용 가능).
const now = (): number => Date.now();

export type GamePhase = "select" | "playing" | "done";
export type HitKind = "key" | "correct" | "error" | "complete" | null;

/** 아이템 완성 후 완성된 글자를 보여주는 시간(ms). 이 동안 온 키는 다음 아이템으로 바로 넘긴다. */
export const ITEM_HOLD_MS = 650;

interface GameState {
  phase: GamePhase;
  stageId: string | null;
  /** 커리큘럼 밖 가상 스테이지(스피드체크). 있으면 findStage 대신 이것을 쓴다. */
  customStage: TypingStage | null;
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
  /** 아이템 완성 → 다음으로 넘어가기 전 "보여주기" 구간. */
  itemDone: boolean;
  holdStartMs: number | null;
  /** 방금 버린 오타 글자(피드백 표시용). */
  lastWrong: string | null;
  // 사운드·이펙트 트리거
  lastHit: HitKind;
  hitSeq: number;
  // 파생 조회
  currentStage(): TypingStage | undefined;
  currentTarget(): string;
  // 액션
  startStage(id: string, lang: Lang): void;
  /** 스피드체크 — 무작위 짧은 문장 3개로 즉시 시작(스테이지 선택 없음). */
  startQuick(lang: Lang): void;
  pressKey(code: string, key: string, shift: boolean): void;
  /** 천지인 자판 탭 하나(모바일 입력 경로). */
  tapKey(tap: string): void;
  tick(): void;
  /** 보여주기 구간이 끝났을 때 다음 아이템(또는 결과)으로. */
  advanceItem(): void;
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
  itemDone: false,
  holdStartMs: null as number | null,
  lastWrong: null as string | null,
  lastHit: null as HitKind,
  hitSeq: 0,
});

export const useGameStore = create<GameState>((set, get) => ({
  phase: "select",
  stageId: null,
  customStage: null,
  lang: "ko",
  ...freshState("ko"),

  currentStage: () => {
    const { stageId, customStage } = get();
    if (customStage && stageId === customStage.id) return customStage;
    return stageId ? findStage(stageId) : undefined;
  },
  currentTarget: () => {
    const st = get().currentStage();
    return st ? st.items[get().itemIndex]?.text ?? "" : "";
  },

  startStage: (id, lang) => {
    if (!findStage(id)) return;
    set({ phase: "playing", stageId: id, customStage: null, lang, ...freshState(lang) });
  },

  startQuick: (lang) => {
    const stage = buildQuickStage(lang);
    set({ phase: "playing", stageId: stage.id, customStage: stage, lang, ...freshState(lang) });
  },

  backToSelect: () => set({ phase: "select", stageId: null, customStage: null, ...freshState(get().lang) }),

  tick: () => {
    if (get().phase === "playing" && get().startMs !== null) set({ nowMs: now() });
  },

  advanceItem: () => {
    const s = get();
    if (s.phase !== "playing" || !s.itemDone) return;
    const stage = s.currentStage();
    if (!stage) return;
    // 보여주기 구간은 타자 시간이 아니다 — 시작 시각을 그만큼 뒤로 밀어 속도에서 제외한다.
    const held = s.holdStartMs != null ? now() - s.holdStartMs : 0;
    const startMs = s.startMs != null ? s.startMs + held : null;
    const lastItem = s.itemIndex + 1 >= stage.items.length;
    set({
      startMs, nowMs: now(),
      phase: lastItem ? "done" : "playing",
      itemIndex: lastItem ? s.itemIndex : s.itemIndex + 1,
      typed: emptyType(s.lang),
      itemPrevCorrect: 0,
      itemDone: false,
      holdStartMs: null,
    });
  },

  pressKey: (code, key, shift) => {
    let s = get();
    if (s.phase !== "playing" || !s.currentStage()) return;
    if (key === "Backspace") {
      if (s.itemDone) return;
      // 백스페이스 — 통계 미집계. itemPrevCorrect(콤보 high-water)는 낮추지 않는다.
      set({ typed: applyType(s.typed, code, key, shift) });
      return;
    }
    if (s.itemDone) {
      // 보여주기 도중 친 키 = 빠른 타자. 기다리게 하지 않고 다음 아이템에 바로 적용한다.
      get().advanceItem();
      s = get();
      if (s.phase !== "playing") return;
    }
    const next = applyType(s.typed, code, key, shift);
    if (next === s.typed) return; // 게임과 무관한 키
    commitInput(next);
  },

  tapKey: (tap) => {
    let s = get();
    if (s.phase !== "playing" || !s.currentStage()) return;
    if (tap === "Backspace") {
      if (s.itemDone) return;
      set({ typed: applyTap(s.typed, tap, now()) });
      return;
    }
    if (s.itemDone) {
      get().advanceItem();
      s = get();
      if (s.phase !== "playing") return;
    }
    commitInput(applyTap(s.typed, tap, now()));
  },
}));

/** 오타가 난 입력을 마지막 정타 상태로 되돌린다.
 *  물리 키보드는 한 자모만 물리면 되지만, 천지인은 조합이 끝나 "확정되는 순간" 오타가
 *  드러나므로(예: 코 ← 노) 틀린 음절 전체를 걷어내야 다시 칠 수 있다.
 *  조합 중(seq/key)인 상태에 멈추면 다음 탭이 계속 오판되므로 확정 상태까지 물린다. */
export function revertToCorrect(s: TypeState, target: string): TypeState {
  let cur = s;
  for (let i = 0; i < 64; i += 1) {
    const composing = cur.lang === "ko" && (cur.tap.seq !== "" || cur.tap.key !== null);
    if (typeText(cur) === "" && !composing) return cur;
    if (!composing && !hasTypeError(cur, target)) return cur;
    cur = applyType(cur, "Backspace", "Backspace", false);
  }
  return emptyType(s.lang);
}

/** 물리 키보드·천지인 자판 공통 — 입력 결과를 통계·진행에 반영한다.
 *  두 입력 경로가 같은 채점 로직을 쓰도록 한 곳에 모았다.
 *
 *  오타 정책 = 자동 리셋. 틀린 입력은 버리고 오타만 집계해, 백스페이스 없이 바로
 *  정타를 다시 칠 수 있다(초보는 백스페이스 위치도 헤맨다 — 마스터 지시).
 *  완성 정책 = 보여주기. 마지막 글자가 조합되는 것까지 화면에 남긴 뒤 넘어간다. */
function commitInput(nextTyped: TypeState): void {
  const set = useGameStore.setState;
  const s = useGameStore.getState();
  const stage = s.currentStage();
  if (!stage) return;
  const target = stage.items[s.itemIndex]?.text ?? "";
  const lang = s.lang;

  const startMs = s.startMs ?? now();
  const after = typeText(nextTyped);
  const wrong = hasTypeError(nextTyped, target);
  const hitSeq = s.hitSeq + 1;
  const keystrokes = s.keystrokes + 1;

  if (wrong) {
    const cells = Array.from(after);
    set({
      typed: revertToCorrect(nextTyped, target),
      keystrokes, errorKeys: s.errorKeys + 1, combo: 0,
      startMs, nowMs: now(),
      lastWrong: cells[cells.length - 1] ?? null,
      lastHit: "error", hitSeq,
    });
    return;
  }

  let { combo, maxCombo, itemPrevCorrect } = s;
  const correctKeys = s.correctKeys + 1;
  let syllableCompleted = false;
  const cn = correctCells(after, target, lang);
  if (cn > itemPrevCorrect) {
    combo += cn - itemPrevCorrect;
    maxCombo = Math.max(maxCombo, combo);
    itemPrevCorrect = cn;
    syllableCompleted = true;
  }

  if (textComplete(after, target, lang)) {
    set({
      typed: nextTyped, keystrokes, correctKeys, combo, maxCombo, itemPrevCorrect,
      correctSyllables: s.correctSyllables + Array.from(target).length,
      startMs, nowMs: now(),
      itemDone: true, holdStartMs: now(),
      lastHit: "complete", hitSeq,
    });
    return;
  }

  const lastHit: HitKind = syllableCompleted ? "correct" : "key";
  set({
    typed: nextTyped, keystrokes, correctKeys, combo, maxCombo,
    itemPrevCorrect, startMs, nowMs: now(), lastHit, hitSeq,
  });
}
