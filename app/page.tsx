"use client";

import { useState } from "react";

interface Change {
  id: number;
  selector: string;
  description: string;
  currentValue?: string;
}

export default function Page() {
  const [pageUrl, setPageUrl] = useState("");
  const [changes, setChanges] = useState<Change[]>([]);
  const [selector, setSelector] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  let nextId = changes.length > 0 ? Math.max(...changes.map((c) => c.id)) + 1 : 1;

  const addChange = () => {
    if (!selector.trim() || !description.trim()) return;
    setChanges((prev) => [
      ...prev,
      { id: nextId++, selector: selector.trim(), description: description.trim(), currentValue: currentValue.trim() || undefined },
    ]);
    setSelector("");
    setCurrentValue("");
    setDescription("");
  };

  const removeChange = (id: number) => {
    setChanges((prev) => prev.filter((c) => c.id !== id));
  };

  const generatePrompt = () => {
    if (changes.length === 0) return;

    const lines: string[] = [];
    lines.push(`# 修改请求`);
    lines.push("");
    if (pageUrl.trim()) {
      lines.push(`**页面:** ${pageUrl.trim()}`);
    }
    lines.push(`**修改数量:** ${changes.length}`);
    lines.push("");
    lines.push(`---`);
    lines.push("");

    for (let i = 0; i < changes.length; i++) {
      const c = changes[i];
      lines.push(`### 修改 ${i + 1}`);
      lines.push("");
      lines.push(`- **CSS 选择器:** \`${c.selector}\``);
      if (c.currentValue) {
        lines.push(`- **当前值:** ${c.currentValue}`);
      }
      lines.push(`- **修改内容:** ${c.description}`);
      lines.push("");
    }

    lines.push(`---`);
    lines.push("");
    lines.push(`请逐个修改以上元素，修改后确保页面整体风格一致。`);

    const result = lines.join("\n");
    setPrompt(result);
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f9fa",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "24px",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>
          修改 Prompt 生成器
        </h1>
        <p style={{ fontSize: 14, color: "#666", marginBottom: 32 }}>
          输入 CSS 选择器和修改描述，一键生成给 Hermes 的结构化 prompt
        </p>

        {/* Page URL */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 6 }}>
            页面 URL（可选）
          </label>
          <input
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="http://localhost:3000"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Add change form */}
        <div style={{
          background: "white",
          borderRadius: 12,
          border: "1px solid #e5e5e5",
          padding: 20,
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>
            添加修改
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                CSS 选择器
              </label>
              <input
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="#hero .title / .nav-link / button.primary"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 14,
                  fontFamily: "ui-monospace, monospace",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onKeyDown={(e) => e.key === "Enter" && addChange()}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                当前值（可选）
              </label>
              <input
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="当前文字/颜色/样式"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>
                修改描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="改成什么？颜色/文字/布局/间距..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 14,
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            <button
              onClick={addChange}
              disabled={!selector.trim() || !description.trim()}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: selector.trim() && description.trim() ? "#4f46e5" : "#e5e5e5",
                color: selector.trim() && description.trim() ? "white" : "#999",
                fontSize: 14,
                fontWeight: 600,
                cursor: selector.trim() && description.trim() ? "pointer" : "default",
                alignSelf: "flex-start",
              }}
            >
              + 添加修改
            </button>
          </div>
        </div>

        {/* Changes list */}
        {changes.length > 0 && (
          <div style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            padding: 20,
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 12 }}>
              已添加 {changes.length} 处修改
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {changes.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: 12,
                    borderRadius: 8,
                    background: "#f8f9fa",
                    border: "1px solid #eee",
                  }}
                >
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#4f46e5",
                    background: "#eef2ff",
                    borderRadius: 4,
                    padding: "2px 6px",
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <code style={{ fontSize: 13, color: "#333", wordBreak: "break-all" }}>
                      {c.selector}
                    </code>
                    {c.currentValue && (
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        当前: {c.currentValue}
                      </div>
                    )}
                    <div style={{ fontSize: 13, color: "#1a1a1a", marginTop: 4 }}>
                      {c.description}
                    </div>
                  </div>
                  <button
                    onClick={() => removeChange(c.id)}
                    style={{
                      border: "none",
                      background: "none",
                      color: "#999",
                      cursor: "pointer",
                      fontSize: 18,
                      lineHeight: 1,
                      padding: "0 4px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={generatePrompt}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                background: "#4f46e5",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              生成 Prompt {copied && "✓ 已复制"}
            </button>
          </div>
        )}

        {/* Generated prompt */}
        {prompt && (
          <div style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #e5e5e5",
            padding: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
                生成的 Prompt
              </h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(prompt);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#333",
                }}
              >
                {copied ? "✓ 已复制" : "复制"}
              </button>
            </div>
            <pre style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "#1a1a1a",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "ui-monospace, monospace",
              background: "#f8f9fa",
              padding: 16,
              borderRadius: 8,
              border: "1px solid #eee",
              maxHeight: 400,
              overflowY: "auto",
              margin: 0,
            }}>
              {prompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
