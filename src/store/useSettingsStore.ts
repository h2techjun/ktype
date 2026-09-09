import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "../typing/engine";

// 두 개의 독립 언어 축:
//   uiLang     — 표시 언어(버튼·라벨·설명). 사용자의 모국어.
//   targetLang — 연습 언어(타이핑 대상: 자판·단어·문장). 배우려는 언어.
// 예) 외국인의 한국어 학습 = uiLang "en" + targetLang "ko".
/** 화면 자판 배열 선택. auto = 터치 기기면 천지인(휴대전화 표준), 아니면 쿼티. */
export type KeyLayoutPref = "auto" | "cheonjiin" | "qwerty";

interface SettingsState {
  uiLang: Lang;
  targetLang: Lang;
  keyLayout: KeyLayoutPref;
  setUiLang(lang: Lang): void;
  setTargetLang(lang: Lang): void;
  setKeyLayout(pref: KeyLayoutPref): void;
}

/** 임베드 부모(랜딩 페이지)가 넘긴 언어 — ?ui=en&target=ko. 방문자의 사이트 언어를 따라가야
 *  영어권 방문자가 한국어 UI 를 만나지 않는다. URL 에 있으면 저장값보다 우선. */
function langFromQuery(key: string): Lang | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get(key);
  return v === "ko" || v === "en" ? v : null;
}
const queryUi = langFromQuery("ui");
const queryTarget = langFromQuery("target");

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      uiLang: queryUi ?? "ko",
      targetLang: queryTarget ?? "ko",
      keyLayout: "auto",
      setUiLang: (uiLang) => set({ uiLang }),
      setTargetLang: (targetLang) => set({ targetLang }),
      setKeyLayout: (keyLayout) => set({ keyLayout }),
    }),
    {
      name: "ktype-settings:v2",
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...p,
          ...(queryUi ? { uiLang: queryUi } : {}),
          ...(queryTarget ? { targetLang: queryTarget } : {}),
        };
      },
    },
  ),
);

/** 선호 설정 + 기기 종류 → 실제로 그릴 자판. */
export function resolveKeyLayout(pref: KeyLayoutPref, touch: boolean): "cheonjiin" | "qwerty" {
  if (pref === "auto") return touch ? "cheonjiin" : "qwerty";
  return pref;
}
