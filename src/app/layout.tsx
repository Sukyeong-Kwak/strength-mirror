import type { Metadata, Viewport } from "next";
import { Gowun_Batang } from "next/font/google";
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

// 표제 — 고운바탕. 사람 이름과 강점 이름에만 쓴다 (6-3)
const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gowun-batang",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "강점 남기기",
  description: "서로에게서 본 강점을 남기고, 모이면 함께 봅니다",
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
      className={`${pretendard.variable} ${gowunBatang.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
