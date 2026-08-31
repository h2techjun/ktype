import { useEffect, useState } from "react";

// 물리 키보드가 없는 환경 판별. 화면 자판을 띄울지 결정하는 유일한 기준이다.
// (hover:none + pointer:coarse) = 마우스 없이 손가락으로만 조작하는 기기.
// 미디어쿼리라 태블릿에 블루투스 키보드를 붙여도 화면 자판이 남지만,
// 자판이 떠 있는 것은 물리 입력을 막지 않으므로 안전한 쪽으로 기운 판정이다.
const QUERY = "(hover: none) and (pointer: coarse)";

export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const sync = () => setTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return touch;
}
