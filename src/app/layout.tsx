import type { Metadata, Viewport } from "next";

import { fontVariables, fontWeightStyle } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "강점 발굴",
  // 부록 A 의 강점 설명문이 아닌 곳에서는 '함께' 를 쓰지 않는다
  description: "하나님께서 서로에게 주신 강점을 발견해 남기고, 함께 모아 봐요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

// 예시 안내 띠는 그룹을 아는 레이아웃(/e/[slug] · /p/[id])이 그린다
export default function RootLayout({ children }: RootLayoutProps) {
  return (
    // 서체는 lib/fonts.ts 한 곳에서 정한다. 여기서는 실어 나르기만 한다
    <html
      lang="ko"
      className={`${fontVariables} h-full antialiased`}
      style={fontWeightStyle}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
