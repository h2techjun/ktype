import { describe, it, expect } from "vitest";
import {
  CHO,
  JUNG,
  JONG,
  isHangulSyllable,
  splitSyllables,
  composeSyllable,
  decomposeSyllable,
  getChoseong,
  choseongHint,
  isAllHangul,
} from "./syllable";

describe("자모 상수", () => {
  it("초성 19 · 중성 21 · 종성 28", () => {
    expect(CHO).toHaveLength(19);
    expect(JUNG).toHaveLength(21);
    expect(JONG).toHaveLength(28);
    expect(JONG[0]).toBe("");
  });
});

describe("isHangulSyllable", () => {
  it("완성형 음절만 true", () => {
    expect(isHangulSyllable("사")).toBe(true);
    expect(isHangulSyllable("힣")).toBe(true);
    expect(isHangulSyllable("가")).toBe(true);
    expect(isHangulSyllable("ㄱ")).toBe(false); // 자모 단독
    expect(isHangulSyllable("a")).toBe(false);
    expect(isHangulSyllable("1")).toBe(false);
    expect(isHangulSyllable("")).toBe(false);
  });
});

describe("splitSyllables", () => {
  it("음절 단위 분해", () => {
    expect(splitSyllables("사과")).toEqual(["사", "과"]);
    expect(splitSyllables("일석이조")).toEqual(["일", "석", "이", "조"]);
    expect(splitSyllables("")).toEqual([]);
  });
});

describe("compose ↔ decompose 왕복", () => {
  it("한 = ㅎ(18) ㅏ(0) ㄴ(4)", () => {
    expect(decomposeSyllable("한")).toEqual({ choIdx: 18, jungIdx: 0, jongIdx: 4 });
    expect(composeSyllable(18, 0, 4)).toBe("한");
  });

  it("사 = ㅅ(9) ㅏ(0) 받침없음", () => {
    expect(decomposeSyllable("사")).toEqual({ choIdx: 9, jungIdx: 0, jongIdx: 0 });
    expect(composeSyllable(9, 0)).toBe("사");
  });

  it("과 = ㄱ(0) ㅘ(9) 받침없음", () => {
    expect(decomposeSyllable("과")).toEqual({ choIdx: 0, jungIdx: 9, jongIdx: 0 });
  });

  it("전 음절 왕복 일관성 (가–힣 전수)", () => {
    for (let code = 0xac00; code <= 0xd7a3; code++) {
      const ch = String.fromCharCode(code);
      const j = decomposeSyllable(ch)!;
      expect(composeSyllable(j.choIdx, j.jungIdx, j.jongIdx)).toBe(ch);
    }
  });

  it("한글 아닌 문자는 decompose null", () => {
    expect(decomposeSyllable("a")).toBeNull();
    expect(decomposeSyllable("ㄱ")).toBeNull();
  });
});

describe("초성 힌트", () => {
  it("getChoseong", () => {
    expect(getChoseong("과")).toBe("ㄱ");
    expect(getChoseong("사")).toBe("ㅅ");
    expect(getChoseong("한")).toBe("ㅎ");
  });

  it("choseongHint", () => {
    expect(choseongHint("사과")).toBe("ㅅㄱ");
    expect(choseongHint("김치")).toBe("ㄱㅊ");
    expect(choseongHint("일석이조")).toBe("ㅇㅅㅇㅈ");
  });
});

describe("isAllHangul", () => {
  it("완성형만으로 이루어진 단어 판별", () => {
    expect(isAllHangul("사과")).toBe(true);
    expect(isAllHangul("한국어")).toBe(true);
    expect(isAllHangul("K팝")).toBe(false);
    expect(isAllHangul("안녕 하세요")).toBe(false); // 공백
    expect(isAllHangul("")).toBe(false);
  });
});
