import type { Metadata, Viewport } from "next";
import { Hahmlet } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// 본문·UI — Pretendard (self-host, 가변 폰트 1개)
const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
  preload: true,
});

// 표제 — Hahmlet. 화면 제목과 사람·강점 이름에 쓴다.
//
// 한글 세리프이면서 굵기가 100~900 가변이라 한 가족으로 위계를 만들 수 있다.
// 제목은 600, 이름은 500 으로 쓴다 (globals.css).
// 간판체(도현체 등)를 쓰지 않는 이유는 6-4 의 평면적인 종이 화면과 겉돌기 때문이다.
//
// next/font 가 빌드 시점에 내려받아 함께 배포한다. 외부 CDN 을 부르지 않는다.
// preload 를 끄는 이유: 한글 폰트는 Google 이 90여 개 구간으로 잘라서 주는데
// 전부 미리 받으면 첫 화면이 느려진다. 필요한 구간만 그때 받게 둔다.
const hahmlet = Hahmlet({
  subsets: ["latin"],
  // weight 를 적지 않으면 가변 축을 그대로 쓴다
  // Tailwind 의 --font-display 토큰과 이름이 겹치면 var() 가 자기를 가리킨다
  variable: "--font-hahmlet",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "강점 남기기",
  // 부록 A 의 강점 설명문이 아닌 곳에서는 '함께' 를 쓰지 않는다
  description: "서로에게서 본 강점을 남기고, 모이면 결과를 볼 수 있어요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBFAF8",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} ${hahmlet.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
