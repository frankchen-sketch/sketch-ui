"use client";

import { useState } from "react";
import { Palette, Group, uid } from "@/lib/tokens";

interface ImportPanelProps {
  palette: Palette;
  onImport: (groups: Group[], pageName: string) => void;
}

/** Pre-parsed page structures (loaded from public/) */
const PRESETS: Record<string, { url: string; name: string; file: string }> = {
  furriq: { url: "https://www.furriq.com/", name: "Furriq 首页", file: "imported-furriq.json" },
  gridpaw: { url: "https://gridpaw.com/", name: "GridPaw 首页", file: "imported-gridpaw.json" },
};

export function ImportPanel({ palette: p, onImport }: ImportPanelProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importFromPreset = async (key: string) => {
    const preset = PRESETS[key];
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/${preset.file}`);
      if (!res.ok) throw new Error(`文件不存在: ${preset.file}`);
      const data = await res.json();
      const groups = normalizeImportedGroups(data.groups || []);
      onImport(groups, preset.name);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const importFromUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      // Use a CORS proxy or local endpoint
      const res = await fetch(`/api/import?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) throw new Error(`导入失败: ${res.status}`);
      const data = await res.json();
      const groups = normalizeImportedGroups(data.groups || []);
      onImport(groups, data.name || new URL(url).hostname);
    } catch (e: any) {
      setError(e.message || "导入失败，请检查 URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "12px 8px" }}>
      {/* Title */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: p.onSurfaceVariant,
          padding: "0 4px",
        }}
      >
        导入页面布局
      </div>

      {/* Quick import from pre-parsed sites */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, color: p.onSurfaceVariant, padding: "0 4px" }}>
          已解析的站点：
        </div>
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => importFromPreset(key)}
            disabled={loading}
            className="m3-press"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${p.outlineVariant}`,
              background: p.surfaceContainerLow,
              color: p.onSurface,
              cursor: loading ? "default" : "pointer",
              fontSize: 12,
              textAlign: "left",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 18 }}>
              {key === "furriq" ? "🐱" : "🐾"}
            </span>
            <div>
              <div style={{ fontWeight: 600 }}>{preset.name}</div>
              <div style={{ fontSize: 10, color: p.onSurfaceVariant }}>
                {preset.url}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: p.outlineVariant, margin: "4px 0" }} />

      {/* Custom URL import */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, color: p.onSurfaceVariant, padding: "0 4px" }}>
          或粘贴 URL：
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: `1px solid ${p.outlineVariant}`,
              background: p.surfaceContainerLow,
              color: p.onSurface,
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => e.key === "Enter" && importFromUrl()}
          />
          <button
            onClick={importFromUrl}
            disabled={loading || !url.trim()}
            className="m3-press"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: url.trim() ? p.primary : p.surfaceContainerHighest,
              color: url.trim() ? p.onPrimary : p.onSurfaceVariant,
              fontSize: 12,
              fontWeight: 600,
              cursor: url.trim() ? "pointer" : "default",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "..." : "导入"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            fontSize: 11,
            color: p.error,
            padding: "6px 8px",
            borderRadius: 8,
            background: p.errorContainer,
          }}
        >
          {error}
        </div>
      )}

      {/* Help text */}
      <div
        style={{
          fontSize: 10,
          color: p.onSurfaceVariant,
          padding: "4px",
          lineHeight: 1.5,
        }}
      >
        导入后页面结构会加载到画布上。<br />
        每个区块标注了真实 CSS 类名。<br />
        你可以拖拽调整布局，然后复制 prompt。
      </div>
    </div>
  );
}

/** Normalize imported groups to ensure valid IDs and structure */
function normalizeImportedGroups(groups: any[]): Group[] {
  let y = 0;
  return groups.map((g: any) => {
    const items = (g.items || []).map((it: any) => ({
      id: uid(),
      kind: it.kind || "box",
      label: it.label || "",
      icon: it.icon || null,
      icon2: it.icon2 || null,
      variant: it.variant || "filled",
      supporting: it.supporting,
      fill: it.fill,
      bold: it.bold,
      _note: it._note,
    }));
    const group: any = {
      id: uid(),
      x: g.x || 16,
      y: y,
      axis: g.axis || "y",
      items,
      _section: g._section,
      _note: g._note,
    };
    y += items.length * 56 + 40;
    return group;
  });
}
