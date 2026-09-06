import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Sketch UI — 可视化页面检查器",
  description: "输入 URL，悬停检查元素，点击选择，生成给 AI 的修改 prompt",
  metadataBase: new URL("https://sketch-ui.pages.dev"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body style={{ margin: 0, padding: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
