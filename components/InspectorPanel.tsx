/**
 * InspectorPanel — shows selected element info and manages change list.
 * Lightweight sidebar for the visual editor mode.
 */

import { useState } from "react";
import { ElementInfo } from "@/lib/inspector/core";

interface Change {
  id: number;
  element: ElementInfo;
  description: string;
}

interface InspectorPanelProps {
  hovered: ElementInfo | null;
  selected: ElementInfo | null;
  changes: Change[];
  onAddChange: (element: ElementInfo, description: string) => void;
  onRemoveChange: (id: number) => void;
  onGenerate: () => void;
  pageUrl: string;
  generatedPrompt: string | null;
  onCopy: () => void;
  copied: boolean;
}

export function InspectorPanel({
  hovered,
  selected,
  changes,
  onAddChange,
  onRemoveChange,
  onGenerate,
  pageUrl,
  generatedPrompt,
  onCopy,
  copied,
}: InspectorPanelProps) {
  const [desc, setDesc] = useState("");
  const active = selected || hovered;

  const handleAdd = () => {
    if (!selected || !desc.trim()) return;
    onAddChange(selected, desc.trim());
    setDesc("");
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #e5e5e5", flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>
          元素检查器
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          悬停查看 · 点击选择 · Esc 取消
        </div>
      </div>

      {/* Selected element info */}
      {active && (
        <div style={{
          padding: "10px 14px",
          background: selected ? "#f0f0ff" : "#f8f8f8",
          borderBottom: "1px solid #e5e5e5",
          flexShrink: 0,
        }}>
          {/* Tag */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <code style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#7c3aed",
              background: "#ede9fe",
              padding: "2px 6px",
              borderRadius: 4,
            }}>
              &lt;{active.tag}&gt;
            </code>
            {active.id && (
              <code style={{ fontSize: 11, color: "#2563eb" }}>#{active.id}</code>
            )}
          </div>

          {/* Classes */}
          {active.classes.length > 0 && (
            <div style={{ fontSize: 11, color: "#555", marginBottom: 4, wordBreak: "break-all" }}>
              .{active.classes.join('.')}
            </div>
          )}

          {/* Selector */}
          <div style={{ fontSize: 10, color: "#888", fontFamily: "monospace", marginBottom: 4, wordBreak: "break-all" }}>
            {active.selector}
          </div>

          {/* Text preview */}
          {active.text && (
            <div style={{ fontSize: 11, color: "#666", marginTop: 4, lineHeight: 1.4, maxHeight: 40, overflow: "hidden" }}>
              "{active.text.slice(0, 80)}{active.text.length > 80 ? '…' : ''}"
            </div>
          )}

          {/* Dimensions */}
          <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>
            {active.rect.w}×{active.rect.h} @ ({active.rect.x}, {active.rect.y})
          </div>

          {/* Key styles */}
          {active.styles.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 3 }}>
              {active.styles.slice(0, 8).map((s) => (
                <span key={s.prop} style={{
                  fontSize: 9,
                  color: "#666",
                  background: "#f0f0f0",
                  padding: "1px 4px",
                  borderRadius: 3,
                  fontFamily: "monospace",
                }}>
                  {s.prop}: {s.value.slice(0, 20)}
                </span>
              ))}
              {active.styles.length > 8 && (
                <span style={{ fontSize: 9, color: "#999" }}>+{active.styles.length - 8}</span>
              )}
            </div>
          )}

          {/* Add change form (only when selected) */}
          {selected && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={"描述修改，例如：\n• 把标题改成 \"AI Cat Breed Finder\"\n• 删除这个元素\n• 颜色改成 #8a4b18"}
                rows={3}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  fontSize: 12,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button
                onClick={handleAdd}
                disabled={!desc.trim()}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: desc.trim() ? "#4f46e5" : "#e5e5e5",
                  color: desc.trim() ? "white" : "#999",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: desc.trim() ? "pointer" : "default",
                }}
              >
                + 添加到修改列表
              </button>
            </div>
          )}
        </div>
      )}

      {/* Changes list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px" }}>
        {changes.length === 0 ? (
          <div style={{ fontSize: 12, color: "#999", textAlign: "center", padding: "20px 0" }}>
            {active ? "选择元素后描述修改" : "悬停在页面元素上开始检查"}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 8 }}>
              已标记 {changes.length} 处修改
            </div>
            {changes.map((c, i) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  gap: 8,
                  padding: "8px 0",
                  borderBottom: "1px solid #f0f0f0",
                  fontSize: 11,
                }}
              >
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#4f46e5",
                  background: "#eef2ff",
                  borderRadius: 3,
                  padding: "1px 4px",
                  flexShrink: 0,
                  height: "fit-content",
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <code style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 2 }}>
                    {c.element.selector}
                  </code>
                  <div style={{ color: "#1a1a1a" }}>{c.description}</div>
                </div>
                <button
                  onClick={() => onRemoveChange(c.id)}
                  style={{
                    border: "none", background: "none", color: "#ccc",
                    cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Generate button */}
      {changes.length > 0 && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid #e5e5e5", flexShrink: 0 }}>
          <button
            onClick={onGenerate}
            style={{
              width: "100%",
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#4f46e5",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            生成 Prompt ({changes.length} 处修改)
          </button>
        </div>
      )}

      {/* Generated prompt */}
      {generatedPrompt && (
        <div style={{
          padding: "10px 14px",
          borderTop: "1px solid #e5e5e5",
          maxHeight: 300,
          overflowY: "auto",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>Prompt</span>
            <button
              onClick={onCopy}
              style={{
                padding: "4px 10px", borderRadius: 4, border: "1px solid #ddd",
                background: "white", fontSize: 11, cursor: "pointer", color: "#333",
              }}
            >
              {copied ? "✓ 已复制" : "复制"}
            </button>
          </div>
          <pre style={{
            fontSize: 10,
            lineHeight: 1.5,
            color: "#333",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "ui-monospace, monospace",
            background: "#f8f8f8",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #eee",
            margin: 0,
            maxHeight: 200,
            overflowY: "auto",
          }}>
            {generatedPrompt}
          </pre>
        </div>
      )}
    </div>
  );
}
