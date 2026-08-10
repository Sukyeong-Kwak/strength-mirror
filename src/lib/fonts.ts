import { Do_Hyeon } from "next/font/google";
import localFont from "next/font/local";

/**
 * 서체는 여기 한 곳에서만 정한다.
 *
 * 화면 제목과 사람·강점 이름은 전부 표제 서체를 쓰는데,
 * 컴포넌트마다 글씨체 이름을 적어두면 바꿀 때 빠뜨리는 곳이 생긴다.
 * 그래서 이 파일이 CSS 변수를 내보내고, globals.css 가 그 변수만 본다.
 *
 * ── 글씨체를 바꾸려면 ─────────────────────────────
 *   1. 위 import 를 원하는 글씨체로 바꾼다
 *        예: import { Jua } from "next/font/google";
 *   2. 아래 displayFont 의 호출을 바꾼다 (variable 이름은 그대로 둘 것)
 *   3. DISPLAY_WEIGHTS 를 그 글씨체가 가진 굵기로 맞춘다
 *   그러면 앱 전체가 따라 바뀐다. 다른 파일은 손대지 않는다.
 *
 *   후보를 눈으로 비교하려면 개발 중에 /fonts 를 열어본다.
 * ────────────────────────────────────────────────
 *
 * next/font 는 인자를 빌드 시점에 정적으로 읽는다.
 * 그래서 옵션을 변수로 빼거나 spread 하면 안 된다.
 */

/** 본문·버튼·숫자 — Pretendard (self-host, 가변 폰트 1개) */
export const bodyFont = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-body-family",
  weight: "45 920",
  display: "swap",
  preload: true,
});

/**
 * 표제 — 화면 제목과 사람·강점 이름.
 *
 * preload 를 끄는 이유: 한글 폰트는 Google 이 90여 개 구간으로 잘라서 주는데
 * 전부 미리 받으면 첫 화면이 느려진다. 필요한 구간만 그때 받게 둔다.
 */
export const displayFont = Do_Hyeon({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display-family",
  display: "swap",
  preload: false,
});

/**
 * 표제 서체의 굵기.
 *
 * 글씨체마다 가진 굵기가 다르다. 없는 굵기를 지정하면 브라우저가
 * 억지로 굵게 그려 획이 뭉개지므로, 그 글씨체가 실제로 가진 값만 적는다.
 * 지금 쓰는 도현체는 400 한 벌뿐이다.
 */
export const DISPLAY_WEIGHTS = {
  /** 화면 제목 (h1) */
  title: 400,
  /** 사람 이름 · 강점 이름 (.font-display) */
  name: 400,
} as const;

/** <html> 에 실어 globals.css 가 읽게 한다 */
export const fontVariables = `${bodyFont.variable} ${displayFont.variable}`;

export const fontWeightStyle = {
  "--font-display-weight-title": String(DISPLAY_WEIGHTS.title),
  "--font-display-weight-name": String(DISPLAY_WEIGHTS.name),
} as React.CSSProperties;
