// 두벌식 표준 자판 배열. 물리 키 위치(KeyboardEvent.code)로 매핑하므로
// OS IME 켜짐/꺼짐과 무관하게 항상 같은 자모를 얻는다. (e.key 는 OS IME 가
// 조합한 결과라 자체 조합기와 충돌 — code 를 써야 함.)

export interface KeyCap {
  /** 일반 입력 자모 */
  normal: string;
  /** Shift 입력 자모(쌍자음·이중모음 낱자) */
  shift?: string;
}

/** KeyboardEvent.code → 자모. */
export const DUBEOLSIK_LAYOUT: Record<string, KeyCap> = {
  KeyQ: { normal: "ㅂ", shift: "ㅃ" },
  KeyW: { normal: "ㅈ", shift: "ㅉ" },
  KeyE: { normal: "ㄷ", shift: "ㄸ" },
  KeyR: { normal: "ㄱ", shift: "ㄲ" },
  KeyT: { normal: "ㅅ", shift: "ㅆ" },
  KeyY: { normal: "ㅛ" },
  KeyU: { normal: "ㅕ" },
  KeyI: { normal: "ㅑ" },
  KeyO: { normal: "ㅐ", shift: "ㅒ" },
  KeyP: { normal: "ㅔ", shift: "ㅖ" },
  KeyA: { normal: "ㅁ" },
  KeyS: { normal: "ㄴ" },
  KeyD: { normal: "ㅇ" },
  KeyF: { normal: "ㄹ" },
  KeyG: { normal: "ㅎ" },
  KeyH: { normal: "ㅗ" },
  KeyJ: { normal: "ㅓ" },
  KeyK: { normal: "ㅏ" },
  KeyL: { normal: "ㅣ" },
  KeyZ: { normal: "ㅋ" },
  KeyX: { normal: "ㅌ" },
  KeyC: { normal: "ㅊ" },
  KeyV: { normal: "ㅍ" },
  KeyB: { normal: "ㅠ" },
  KeyN: { normal: "ㅜ" },
  KeyM: { normal: "ㅡ" },
};

/** 물리 키 → 자모. Shift 여부 반영. 매핑 없으면 null. */
export function keyToJamo(code: string, shift: boolean): string | null {
  const cap = DUBEOLSIK_LAYOUT[code];
  if (!cap) return null;
  return shift && cap.shift ? cap.shift : cap.normal;
}

/** 온스크린 키보드 렌더용 행 구조. */
/** Shift 가 필요한 자모(쌍자음·ㅒㅖ). 외국인 학습자가 가장 많이 막히는 지점이라 화면에서 안내한다. */
export const SHIFT_JAMO = new Set(["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ", "ㅒ", "ㅖ"]);
/** Shift 자모 → 같은 키의 기본 자모(ㄲ→ㄱ). 안내 문구 "Shift + ㄱ" 용. */
export function shiftBase(jamo: string): string | null {
  for (const cap of Object.values(DUBEOLSIK_LAYOUT)) if (cap.shift === jamo) return cap.normal;
  return null;
}

export const KEYBOARD_ROWS: string[][] = [
  ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP"],
  ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL"],
  ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM"],
];
