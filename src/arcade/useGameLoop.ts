import { useEffect, useRef } from "react";

// requestAnimationFrame 게임 루프. callback 은 프레임 간 경과(ms)를 받는다.
// running=false 면 멈춘다. callback 은 ref 로 최신을 유지해 재구독 없이 갱신.
export function useGameLoop(callback: (dtMs: number) => void, running: boolean): void {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(t - last, 50); // 탭 비활성 후 큰 점프 방지
      last = t;
      cbRef.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}
