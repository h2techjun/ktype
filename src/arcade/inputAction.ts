import { applyType, applyTap, type TypeState } from "../typing/engine";

// 게임 리듀서가 받는 입력 액션. 물리 키보드와 천지인 자판 두 경로를 한 타입으로
// 묶어, 게임 로직이 어느 자판으로 쳤는지 신경 쓰지 않게 한다.
export type InputAction =
  | { t: "key"; code: string; key: string; shift: boolean }
  | { t: "tap"; tap: string; nowMs: number };

/** 글자를 지우는 입력인가(통계에 넣지 않고 되돌리기만 하는 경로). */
export function isEraseInput(a: InputAction): boolean {
  return a.t === "key" ? a.key === "Backspace" : a.tap === "Backspace";
}

/** 입력 액션 하나를 타이핑 상태에 적용. */
export function applyInput(typed: TypeState, a: InputAction): TypeState {
  return a.t === "key" ? applyType(typed, a.code, a.key, a.shift) : applyTap(typed, a.tap, a.nowMs);
}
