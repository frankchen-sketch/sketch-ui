"use client";

import { useState } from "react";
import { VisualEditor } from "@/components/VisualEditor";

export default function Page() {
  const [mode, setMode] = useState<"input" | "editor">("input");
  const [pageUrl, setPageUrl] = useState("");

  const startEditing = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setPageUrl(trimmed);
    setMode("editor");
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <header
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid #e5e5e5",
          background: "white",
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>
            🔍 Sketch UI
          </span>
          {mode === "editor" && (
            <button
              onClick={() => { setMode("input"); setPageUrl(""); }}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid #e5e5e5",
                background: "white",
                fontSize: 12,
                cursor: "pointer",
                color: "#555",
              }}
            >
              ← 新页面
            </button>
          )}
        </div>
        {mode === "editor" && (
          <span style={{ fontSize: 12, color: "#888", fontFamily: "monospace" }}>
            {pageUrl}
          </span>
        )}
      </header>

      {/* Main content */}
      {mode === "input" ? (
        <UrlInput onStart={startEditing} />
      ) : (
        <VisualEditor
          pageUrl={pageUrl}
          onBack={() => { setMode("input"); setPageUrl(""); }}
        />
      )}
    </div>
  );
}

/* ---------- URL input screen ---------- */

function UrlInput({ onStart }: { onStart: (url: string) => void }) {
  const [url, setUrl] = useState("");

  const presets = [
    { label: "Furriq", url: "https://www.furriq.com", icon: "🐱" },
    { label: "GridPaw", url: "https://gridpaw.com", icon: "🐾" },
    { label: "localhost:3000", url: "http://localhost:3000", icon: "💻" },
    { label: "localhost:4321", url: "http://localhost:4321", icon: "💻" },
  ];

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 40,
        background: "#fafafa",
      }}
    >
      <div style={{ fontSize: 48 }}>🔍</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
        可视化页面检查器
      </h1>
      <p style={{ fontSize: 14, color: "#666", textAlign: "center", maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
        输入页面 URL，悬停检查元素，点击选择，描述修改，一键生成给 Hermes 的结构化 prompt
      </p>

      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 520 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="输入 URL（如 https://www.furriq.com）"
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ddd",
            fontSize: 14,
            outline: "none",
          }}
          onKeyDown={(e) => e.key === "Enter" && onStart(url)}
          autoFocus
        />
        <button
          onClick={() => onStart(url)}
          disabled={!url.trim()}
          style={{
            padding: "12px 24px",
            borderRadius: 10,
            border: "none",
            background: url.trim() ? "#4f46e5" : "#e5e5e5",
            color: url.trim() ? "white" : "#999",
            fontSize: 14,
            fontWeight: 600,
            cursor: url.trim() ? "pointer" : "default",
          }}
        >
          开始检查
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {presets.map((p) => (
          <button
            key={p.url}
            onClick={() => onStart(p.url)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              background: "white",
              fontSize: 13,
              cursor: "pointer",
              color: "#444",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>
        远程站点通过 CF Worker 代理加载，绕过 CSP 限制<br />
        localhost 需要开发服务器运行中
      </div>
    </div>
  );
}
