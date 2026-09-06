import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "修改 Prompt 生成器",
  description: "输入 CSS 选择器和修改描述，一键生成给 Hermes 的结构化 prompt",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
