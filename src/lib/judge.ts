// 타이핑 판정 순수함수. 목표 텍스트와 확정 입력을 음절(문자) 단위로 비교한다.
// 공백·문장부호도 하나의 셀로 취급(Array.from 기준).

import { imeText, jamoSequence, type ImeState } from "../hangul/ime";

export type SyllableStatus = "correct" | "wrong" | "pending";

/** 목표와 입력을 셀 단위 비교. 입력이 닿지 않은 셀은 pending. */
export function judgeSyllables(target: string, typed: string): SyllableStatus[] {
  const t = Array.from(target);
  const u = Array.from(typed);
  return t.map((ch, i) => {
    if (i >= u.length) return "pending";
    return u[i] === ch ? "correct" : "wrong";
  });
}

/** 라운드 완료 = 목표와 정확히 일치. */
export function isRoundComplete(target: string, typed: string): boolean {
  return typed === target;
}

/** 첫 오타 셀 인덱스. 없으면 -1. (확정된 음절 비교용) */
export function firstWrongIndex(target: string, typed: string): number {
  const t = Array.from(target);
  const u = Array.from(typed);
  const n = Math.min(t.length, u.length);
  for (let i = 0; i < n; i++) {
    if (u[i] !== t[i]) return i;
  }
  return -1;
}

/** 타이핑 오타 여부 — 지금까지 친 자모 시퀀스가 목표 자모 시퀀스의 접두가 아니면 오타.
 *  받침이 다음 초성으로 이동하는 두벌식 특성상 음절 경계를 넘나들므로, 음절별이 아니라
 *  전체 자모 시퀀스로 비교해야 한다. (예: "사과"를 치려면 "삭"을 거치는데 이는 정상 진행) */
export function hasTypingError(target: string, ime: ImeState): boolean {
  const typedSeq = jamoSequence(imeText(ime));
  const targetSeq = jamoSequence(target);
  if (typedSeq.length > targetSeq.length) return true;
  return !typedSeq.every((j, i) => targetSeq[i] === j);
}
