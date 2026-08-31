import { useEffect } from "react";
import { isTypableKey, type Lang } from "../typing/engine";
import type { InputAction } from "./inputAction";
import { sound } from "../lib/sound";

// 게임 4종의 물리 키보드 입력을 한 곳으로. 이전에는 같은 keydown 핸들러가
// 네 컴포넌트에 복사돼 있어, 입력 가드를 고칠 때 한 곳을 빠뜨리기 쉬웠다.
export function useArcadeInput(lang: Lang, dispatch: (a: InputAction) => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (!isTypableKey(lang, e.code, e.key, e.shiftKey)) return;
      e.preventDefault();
      sound.unlock();
      sound.key(performance.now());
      dispatch({ t: "key", code: e.code, key: e.key, shift: e.shiftKey });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lang, dispatch]);
}

/** 쿼티 화면 자판 → 게임 리듀서. 물리 입력과 같은 효과음·형태를 유지한다. */
export function arcadeVirtualKey(
  dispatch: (a: InputAction) => void,
): (k: { code: string; key: string; shift: boolean }) => void {
  return (k) => {
    sound.unlock();
    sound.key(performance.now());
    dispatch({ t: "key", ...k });
  };
}

/** 천지인 화면 자판 → 게임 리듀서. */
export function arcadeTap(dispatch: (a: InputAction) => void): (tap: string) => void {
  return (tap) => {
    sound.unlock();
    sound.key(performance.now());
    dispatch({ t: "tap", tap, nowMs: performance.now() });
  };
}
