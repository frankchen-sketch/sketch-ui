"use client";

import { useEffect, useState } from "react";
import { Palette } from "@/lib/tokens";
import {
  ProjectPreset,
  loadAllPresets,
  paletteOfPreset,
  themeOfPreset,
  saveCustomPreset,
  deleteCustomPreset,
  BUILTIN_PRESETS,
} from "@/lib/presets";
import { schemeFromSeed } from "@/lib/color";

interface PresetSelectorProps {
  palette: Palette;
  activePresetKey: string | null;
  onSelect: (preset: ProjectPreset | null) => void;
}

export function PresetSelector({ palette: p, activePresetKey, onSelect }: PresetSelectorProps) {
  const [presets, setPresets] = useState<ProjectPreset[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setPresets(loadAllPresets());
  }, []);

  const reload = () => setPresets(loadAllPresets());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: p.onSurfaceVariant,
          }}
        >
          项目预设
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="m3-press"
          style={{
            border: "none",
            background: "none",
            color: p.primary,
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: "2px 6px",
            borderRadius: 8,
          }}
          title="添加自定义预设"
        >
          {showAdd ? "✕" : "+"}
        </button>
      </div>

      {/* Preset grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {presets.map((preset) => {
          const isActive = activePresetKey === preset.key;
          const isCustom = !BUILTIN_PRESETS.some((b) => b.key === preset.key);
          return (
            <button
              key={preset.key}
              onClick={() => onSelect(isActive ? null : preset)}
              className="m3-press"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 4px 8px",
                borderRadius: 12,
                border: isActive ? `2px solid ${p.primary}` : `1px solid ${p.outlineVariant}`,
                background: isActive ? p.primaryContainer : p.surfaceContainerLow,
                color: isActive ? p.onPrimaryContainer : p.onSurface,
                cursor: "pointer",
                fontSize: 11,
                lineHeight: 1.3,
                textAlign: "center",
                transition: "all 0.15s ease",
              }}
            >
              {/* Color swatch */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: preset.seedColor,
                  border: `2px solid ${isActive ? p.primary : p.outlineVariant}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: isActive ? 600 : 400, fontSize: 11 }}>
                {preset.icon} {preset.name}
              </span>
              {/* Delete button for custom presets */}
              {isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCustomPreset(preset.key);
                    if (activePresetKey === preset.key) onSelect(null);
                    reload();
                  }}
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    border: "none",
                    background: p.error,
                    color: p.onError,
                    fontSize: 10,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    lineHeight: 1,
                  }}
                  title="删除"
                >
                  ✕
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Active preset info */}
      {activePresetKey && (() => {
        const active = presets.find((pr) => pr.key === activePresetKey);
        if (!active) return null;
        return (
          <div
            style={{
              fontSize: 11,
              color: p.onSurfaceVariant,
              padding: "6px 8px",
              borderRadius: 8,
              background: p.surfaceContainerLow,
              lineHeight: 1.5,
            }}
          >
            {active.description}
            {active.promptPrefix && (
              <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>
                Prompt 上下文已注入 ✓
              </div>
            )}
          </div>
        );
      })()}

      {/* Add custom preset form */}
      {showAdd && (
        <AddPresetForm
          palette={p}
          onSave={(preset) => {
            saveCustomPreset(preset);
            setShowAdd(false);
            reload();
            onSelect(preset);
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

/* ---------- add preset form ---------- */

function AddPresetForm({
  palette: p,
  onSave,
  onCancel,
}: {
  palette: Palette;
  onSave: (preset: ProjectPreset) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("#D97706");
  const [desc, setDesc] = useState("");
  const [icon, setIcon] = useState("📦");
  const [prefix, setPrefix] = useState("");

  const preview = name ? schemeFromSeed(seed, name) : null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    const key = "custom-" + name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    onSave({
      key,
      name: name.trim(),
      description: desc.trim() || `自定义: ${name}`,
      icon,
      seedColor: seed,
      theme: { shape: "rounded" },
      promptPrefix: prefix.trim() || undefined,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 8,
    border: `1px solid ${p.outlineVariant}`,
    background: p.surfaceContainerLow,
    color: p.onSurface,
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        borderRadius: 12,
        background: p.surfaceContainer,
        border: `1px solid ${p.outlineVariant}`,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurface }}>新建预设</div>

      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          style={{ ...inputStyle, width: 40, textAlign: "center", fontSize: 16 }}
          maxLength={2}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="项目名称"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input
          type="color"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          style={{ width: 32, height: 28, border: "none", borderRadius: 6, cursor: "pointer" }}
        />
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="#D97706"
          style={{ ...inputStyle, fontFamily: "monospace" }}
        />
        {preview && (
          <div style={{ display: "flex", gap: 2 }}>
            {[preview.primary, preview.primaryContainer, preview.surface].map((c, i) => (
              <div
                key={i}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: c,
                  border: `1px solid ${p.outlineVariant}`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="简短描述（可选）"
        style={inputStyle}
      />

      <textarea
        value={prefix}
        onChange={(e) => setPrefix(e.target.value)}
        placeholder="Prompt 上下文（可选）：技术栈、风格约束等，会注入到生成的 prompt 开头"
        rows={3}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="m3-press"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 20,
            border: "none",
            background: name.trim() ? p.primary : p.surfaceContainerHighest,
            color: name.trim() ? p.onPrimary : p.onSurfaceVariant,
            fontSize: 12,
            fontWeight: 600,
            cursor: name.trim() ? "pointer" : "default",
          }}
        >
          保存
        </button>
        <button
          onClick={onCancel}
          className="m3-press"
          style={{
            padding: "8px 12px",
            borderRadius: 20,
            border: `1px solid ${p.outlineVariant}`,
            background: "transparent",
            color: p.onSurface,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
}
