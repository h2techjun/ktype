// Web Audio 합성 사운드 — 오디오 파일 없이 오실레이터로 톤을 생성한다(저작권 프리, 0 바이트).
// AudioContext 는 브라우저 정책상 사용자 제스처 이후에만 소리가 나므로 lazy 생성 + resume.

let ctx: AudioContext | null = null;
let enabled = true;

function ac(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Wave = "sine" | "square" | "triangle" | "sawtooth";

/** 짧은 톤 하나(ADSR 간이). when = 시작 지연(초). */
function tone(freq: number, dur: number, type: Wave, gain: number, when = 0): void {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sound = {
  setEnabled(v: boolean): void {
    enabled = v;
  },
  isEnabled(): boolean {
    return enabled;
  },
  /** 사용자 제스처 시점에 오디오 컨텍스트를 깨운다(첫 입력 시 호출). */
  unlock(): void {
    ac();
  },
  /** 매 타건 — 낮고 짧은 클릭. seed 로 미세하게 음높이 변주(단조로움 방지). */
  key(seed: number): void {
    tone(200 + (seed % 5) * 12, 0.028, "square", 0.03);
  },
  /** 음절 정타 완성 — 밝은 딩. */
  correct(): void {
    tone(660, 0.09, "sine", 0.07);
  },
  /** 오타 — 낮은 부저. */
  error(): void {
    tone(150, 0.14, "sawtooth", 0.06);
  },
  /** 콤보 상승 — 콤보 수에 따라 음이 올라간다. */
  combo(n: number): void {
    tone(520 + Math.min(n, 14) * 36, 0.1, "triangle", 0.08);
  },
  /** 스테이지 완주 — 상승 아르페지오. */
  complete(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, "sine", 0.1, i * 0.09));
  },
};
