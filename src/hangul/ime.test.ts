import { describe, it, expect } from "vitest";
import {
  EMPTY_IME,
  applyJamo,
  applyLiteral,
  applyBackspace,
  commit,
  imeText,
  typeJamos,
} from "./ime";

describe("기본 조합 (초성→중성→종성)", () => {
  it("초성 단독은 낱자로 보인다", () => {
    expect(imeText(applyJamo(EMPTY_IME, "ㄱ"))).toBe("ㄱ");
  });

  it("초성+중성 = 완성형", () => {
    expect(typeJamos("ㄱㅏ")).toBe("가");
  });

  it("초성+중성+종성 = 받침 음절", () => {
    expect(typeJamos("ㄱㅏㅇ")).toBe("강");
    expect(typeJamos("ㅎㅏㄴ")).toBe("한");
  });

  it("모음 단독은 낱자 모음", () => {
    expect(typeJamos("ㅏ")).toBe("ㅏ");
  });
});

describe("종성 → 다음 초성 이동 (두벌식 핵심)", () => {
  it("받침 뒤 모음이 오면 받침이 다음 글자 초성으로", () => {
    // ㄱㅏㄴ = 간, +ㅏ → 가 + 나
    expect(typeJamos("ㄱㅏㄴㅏ")).toBe("가나");
    // ㅁㅓㄱ = 먹, +ㅓ → 머 + 거
    expect(typeJamos("ㅁㅓㄱㅓ")).toBe("머거");
  });

  it("겹받침이면 뒤 자음만 이동", () => {
    // ㄷㅏㄹㄱ = 닭, +ㅏ → 달 + 가
    expect(typeJamos("ㄷㅏㄹㄱㅏ")).toBe("달가");
  });
});

describe("겹받침 조합", () => {
  it("ㄹ+ㄱ = ㄺ (닭)", () => {
    expect(typeJamos("ㄷㅏㄹㄱ")).toBe("닭");
  });
  it("ㄴ+ㅈ = ㄵ (앉)", () => {
    expect(typeJamos("ㅇㅏㄴㅈ")).toBe("앉");
  });
  it("ㅂ+ㅅ = ㅄ (값)", () => {
    expect(typeJamos("ㄱㅏㅂㅅ")).toBe("값");
  });
});

describe("겹모음 조합", () => {
  it("ㅗ+ㅏ = ㅘ (과)", () => {
    expect(typeJamos("ㄱㅗㅏ")).toBe("과");
  });
  it("ㅗ+ㅣ = ㅚ (외)", () => {
    expect(typeJamos("ㅇㅗㅣ")).toBe("외");
  });
  it("ㅜ+ㅓ = ㅝ (원)", () => {
    expect(typeJamos("ㅇㅜㅓㄴ")).toBe("원");
  });
  it("ㅡ+ㅣ = ㅢ (의)", () => {
    expect(typeJamos("ㅇㅡㅣ")).toBe("의");
  });
  it("겹모음 안 되는 모음 연속은 분리", () => {
    // ㅏ 뒤 ㅏ 는 겹모음 아님 → 아 + ㅏ
    expect(typeJamos("ㅇㅏㅏ")).toBe("아ㅏ");
  });
});

describe("자음 연속 / 종성 불가 자음", () => {
  it("초성만 있는데 자음 또 오면 앞 자음 낱자 확정", () => {
    expect(typeJamos("ㄱㄴ")).toBe("ㄱㄴ");
  });
  it("ㄸㅃㅉ 는 종성 불가 → 새 음절 초성", () => {
    // ㄱㅏ + ㄸ → 가 + ㄸ
    expect(typeJamos("ㄱㅏㄸ")).toBe("가ㄸ");
  });
});

describe("백스페이스 (역분해)", () => {
  it("받침 제거", () => {
    let s = typeJamosState("ㄱㅏㅇ"); // 강
    s = applyBackspace(s);
    expect(imeText(s)).toBe("가");
  });
  it("겹받침은 뒤 자음만 제거", () => {
    let s = typeJamosState("ㄷㅏㄹㄱ"); // 닭
    s = applyBackspace(s);
    expect(imeText(s)).toBe("달");
  });
  it("겹모음은 뒤 모음만 제거", () => {
    let s = typeJamosState("ㄱㅗㅏ"); // 과
    s = applyBackspace(s);
    expect(imeText(s)).toBe("고");
  });
  it("중성→초성→빈 문자열 단계 제거", () => {
    let s = typeJamosState("ㄱㅏ"); // 가
    s = applyBackspace(s);
    expect(imeText(s)).toBe("ㄱ");
    s = applyBackspace(s);
    expect(imeText(s)).toBe("");
  });
  it("확정된 완성 음절도 자모 단위로 되살려 제거", () => {
    let s = typeJamosState("ㄱㅏㄴㅏ"); // 가나 (가=확정, 나=조합중)
    s = applyBackspace(s); // 나 → ㄴ
    expect(imeText(s)).toBe("가ㄴ");
    s = applyBackspace(s); // ㄴ → (빈 조합)
    expect(imeText(s)).toBe("가");
    s = applyBackspace(s); // 확정 가 되살림 → ㄱ
    expect(imeText(s)).toBe("ㄱ");
  });
  it("빈 상태 백스페이스는 무시", () => {
    expect(imeText(applyBackspace(EMPTY_IME))).toBe("");
  });
});

describe("commit / applyLiteral (공백·비자모)", () => {
  it("commit 은 조합 버퍼를 확정한다", () => {
    const s = commit(applyJamo(applyJamo(EMPTY_IME, "ㄱ"), "ㅏ"));
    expect(s.composing).toBeNull();
    expect(imeText(s)).toBe("가");
  });
  it("공백 입력은 조합 확정 후 공백 추가", () => {
    let s = typeJamosState("ㅇㅏㄴㄴㅕㅇ"); // 안녕
    s = applyLiteral(s, " ");
    s = applyJamo(s, "ㅎ");
    s = applyJamo(s, "ㅏ");
    expect(imeText(s)).toBe("안녕 하");
  });
});

// 테스트 헬퍼 — 상태를 반환 (typeJamos 는 텍스트만 반환)
import type { ImeState } from "./ime";
function typeJamosState(jamos: string): ImeState {
  let s = EMPTY_IME;
  for (const j of Array.from(jamos)) s = applyJamo(s, j);
  return s;
}
