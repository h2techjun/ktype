// 타이핑 속도·정확도·콤보 계산 순수함수.
// 한글 타자 관례상 주 지표는 "타/분"(CPM, 자모 키스트로크 기준).
// WPM 은 국제 관례(5 keystroke = 1 word)로 환산해 병기한다.

export interface Speed {
  cpm: number; // 분당 타수 (keystroke/min)
  wpm: number; // 분당 단어 (net, keystroke/5/min)
}

/** 키스트로크 수와 경과 시간(ms) → 속도. 경과 0 이면 0. */
export function computeSpeed(keystrokes: number, elapsedMs: number): Speed {
  if (elapsedMs <= 0) return { cpm: 0, wpm: 0 };
  const minutes = elapsedMs / 60_000;
  const cpm = Math.round(keystrokes / minutes);
  const wpm = Math.round(keystrokes / 5 / minutes);
  return { cpm, wpm };
}

/** 정타·오타 수 → 정확도(%). 입력 없으면 100. */
export function computeAccuracy(correct: number, wrong: number): number {
  const total = correct + wrong;
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}

/** 콤보 진행 — 정타면 +1, 오타면 0. */
export function nextCombo(prev: number, isCorrect: boolean): number {
  return isCorrect ? prev + 1 : 0;
}

/** 완주 등급(1~3별). 정확도·속도 임계 — 완주 시 최소 1별 보장. */
export function stars(accuracy: number, cpm: number): 1 | 2 | 3 {
  if (accuracy >= 97 && cpm >= 200) return 3;
  if (accuracy >= 90 && cpm >= 120) return 2;
  return 1;
}
