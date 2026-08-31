import { jamoSequence } from "../hangul/ime";

// 아케이드 타겟 매칭 — 입력한 자모 시퀀스가 목표 단어의 접두인지(받침 이동 포함).
export function typedPrefixMatches(typed: string, target: string): boolean {
  if (typed === "") return false;
  const t = jamoSequence(typed);
  const g = jamoSequence(target);
  if (t.length > g.length) return false;
  return t.every((j, i) => g[i] === j);
}
