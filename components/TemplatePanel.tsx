"use client";

import { useMemo, useState, useEffect } from "react";
import { Palette, Group } from "@/lib/tokens";
import {
  PageTemplate,
  TemplateCategory,
  templatesForProject,
  templatesByCategory,
  deleteCustomTemplate,
  BUILTIN_TEMPLATES,
  loadExternalTemplates,
} from "@/lib/templates";
import { ImportPanel } from "./ImportPanel";

const CATEGORY_LABELS: Record<TemplateCategory, { label: string; icon: string }> = {
  page: { label: "页面", icon: "description" },
  section: { label: "区块", icon: "view_agenda" },
  component: { label: "组件", icon: "widgets" },
  game: { label: "游戏", icon: "sports_esports" },
};

interface TemplatePanelProps {
  palette: Palette;
  activePresetKey: string | null;
  onInsert: (groups: Group[]) => void;
  onImport: (groups: Group[], pageName: string) => void;
  onSaveFromCanvas?: () => void;
}

export function TemplatePanel({ palette: p, activePresetKey, onInsert, onImport, onSaveFromCanvas }: TemplatePanelProps) {
  const [filter, setFilter] = useState<TemplateCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [externalTemplates, setExternalTemplates] = useState<PageTemplate[]>([]);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    loadExternalTemplates().then(setExternalTemplates);
  }, []);

  const templates = useMemo(() => {
    // Merge built-in + external + custom, filter by project
    let all = [...BUILTIN_TEMPLATES, ...externalTemplates];
    if (activePresetKey) {
      all = all.filter((t) => t.projectKey === activePresetKey || t.projectKey === null);
    }
    if (filter !== "all") all = all.filter((t) => t.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      all = all.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
      );
    }
    return all;
  }, [activePresetKey, filter, search, externalTemplates]);

  const grouped = useMemo(() => templatesByCategory(templates), [templates]);

  const allCategories = Object.keys(CATEGORY_LABELS) as TemplateCategory[];
  const activeCategories = allCategories.filter((cat) => grouped[cat].length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 8px 8px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
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
            页面模板
          </span>
          {onSaveFromCanvas && (
            <button
              onClick={onSaveFromCanvas}
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
              title="将画布选区保存为模板"
            >
              +
            </button>
          )}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索模板..."
          style={{
            width: "100%",
            padding: "6px 10px",
            borderRadius: 20,
            border: `1px solid ${p.outlineVariant}`,
            background: p.surfaceContainerLow,
            color: p.onSurface,
            fontSize: 12,
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* Import toggle */}
        <button
          onClick={() => setShowImport(!showImport)}
          className="m3-press"
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px dashed ${p.primary}`,
            background: showImport ? p.primaryContainer : "transparent",
            color: showImport ? p.onPrimaryContainer : p.primary,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 8,
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
            {showImport ? "expand_less" : "download"}
          </span>
          {showImport ? "收起导入" : "从现有站点导入"}
        </button>

        {/* Import panel */}
        {showImport && <ImportPanel palette={p} onImport={onImport} />}

        {/* Category filter chips */}
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          <FilterChip
            label="全部"
            active={filter === "all"}
            onClick={() => setFilter("all")}
            palette={p}
            count={templates.length}
          />
          {activeCategories.map((cat) => (
            <FilterChip
              key={cat}
              label={CATEGORY_LABELS[cat].label}
              active={filter === cat}
              onClick={() => setFilter(filter === cat ? "all" : cat)}
              palette={p}
              count={grouped[cat].length}
            />
          ))}
        </div>
      </div>

      {/* Template list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 8px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
        className="no-scrollbar"
      >
        {templates.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 16px",
              color: p.onSurfaceVariant,
              fontSize: 13,
            }}
          >
            {search ? "没有匹配的模板" : "此预设暂无模板"}
          </div>
        ) : (
          activeCategories.map((cat) =>
            grouped[cat].length > 0 ? (
              <div key={cat}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: p.onSurfaceVariant,
                    padding: "8px 4px 4px",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>
                    {CATEGORY_LABELS[cat].icon}
                  </span>
                  {CATEGORY_LABELS[cat].label}
                </div>
                {grouped[cat].map((tmpl) => (
                  <TemplateCard
                    key={tmpl.key}
                    template={tmpl}
                    palette={p}
                    onInsert={() => onInsert(tmpl.groups)}
                    onDelete={
                      !BUILTIN_TEMPLATES.some((b) => b.key === tmpl.key)
                        ? () => {
                            deleteCustomTemplate(tmpl.key);
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function FilterChip({
  label,
  active,
  onClick,
  palette: p,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  palette: Palette;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="m3-press"
      style={{
        padding: "4px 10px",
        borderRadius: 16,
        border: "none",
        background: active ? p.secondaryContainer : p.surfaceContainerLow,
        color: active ? p.onSecondaryContainer : p.onSurfaceVariant,
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      {label}
      <span style={{ fontSize: 10, opacity: 0.7 }}>{count}</span>
    </button>
  );
}

function TemplateCard({
  template: t,
  palette: p,
  onInsert,
  onDelete,
}: {
  template: PageTemplate;
  palette: Palette;
  onInsert: () => void;
  onDelete?: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 10,
        background: hover ? p.surfaceContainerLow : "transparent",
        cursor: "pointer",
        transition: "background 0.12s",
        position: "relative",
      }}
      onClick={onInsert}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: p.surfaceContainerHigh,
          display: "grid",
          placeItems: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {t.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: p.onSurface, lineHeight: 1.3 }}>
          {t.name}
        </div>
        <div style={{ fontSize: 10, color: p.onSurfaceVariant, lineHeight: 1.3, marginTop: 1 }}>
          {t.description}
        </div>
      </div>

      {/* Insert indicator */}
      {hover && (
        <span
          style={{ fontSize: 16, color: p.primary }}
          className="material-symbols-rounded"
        >
          add_circle
        </span>
      )}

      {/* Delete button for custom templates */}
      {onDelete && hover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
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
    </div>
  );
}
