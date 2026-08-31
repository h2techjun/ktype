import { describe, it, expect } from "vitest";
import { keyToJamo, DUBEOLSIK_LAYOUT, KEYBOARD_ROWS } from "./dubeolsik";

describe("keyToJamo", () => {
  it("일반 자모", () => {
    expect(keyToJamo("KeyR", false)).toBe("ㄱ");
    expect(keyToJamo("KeyK", false)).toBe("ㅏ");
    expect(keyToJamo("KeyD", false)).toBe("ㅇ");
    expect(keyToJamo("KeyM", false)).toBe("ㅡ");
  });
  it("Shift → 쌍자음·이중모음", () => {
    expect(keyToJamo("KeyR", true)).toBe("ㄲ");
    expect(keyToJamo("KeyT", true)).toBe("ㅆ");
    expect(keyToJamo("KeyO", true)).toBe("ㅒ");
  });
  it("Shift 매핑 없는 키는 일반값 유지", () => {
    expect(keyToJamo("KeyK", true)).toBe("ㅏ"); // ㅏ 는 shift 없음
  });
  it("매핑 없는 키는 null", () => {
    expect(keyToJamo("Space", false)).toBeNull();
    expect(keyToJamo("Digit1", false)).toBeNull();
  });
});

describe("레이아웃 무결성", () => {
  it("초성 자음이 모두 자판에 존재", () => {
    const all = Object.values(DUBEOLSIK_LAYOUT).flatMap((c) =>
      c.shift ? [c.normal, c.shift] : [c.normal],
    );
    for (const j of ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㅃ", "ㅉ", "ㅆ", "ㅎ"]) {
      expect(all).toContain(j);
    }
  });
  it("키보드 행에 26 키(모든 자모 키)", () => {
    const flat = KEYBOARD_ROWS.flat();
    expect(flat).toHaveLength(26);
    for (const code of flat) expect(DUBEOLSIK_LAYOUT[code]).toBeDefined();
  });
});
