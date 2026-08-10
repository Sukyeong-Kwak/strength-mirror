import type { Metadata, Viewport } from "next";

import { fontVariables, fontWeightStyle } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: "강점 남기기",
  // 부록 A 의 강점 설명문이 아닌 곳에서는 '함께' 를 쓰지 않는다
  description: "서로에게서 본 강점을 남기고, 모이면 결과를 볼 수 있어요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

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
