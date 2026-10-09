import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "山海之间 · AI 自驾路书",
  description:
    "给出出发地、时间和偏好，生成可阅读、可修改、可保存、可分享的分日自驾路书。",
};

export const viewport: Viewport = {
  themeColor: "#111412",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased theme-page">{children}</body>
    </html>
  );
}
