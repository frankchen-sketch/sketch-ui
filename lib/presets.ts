/**
 * Project presets: one-click theme + palette bundles.
 *
 * Each preset maps to a project (or personal brand). Selecting one:
 * 1. Sets the palette (via seed color → schemeFromSeed)
 * 2. Sets theme preferences (shape, font, etc.)
 * 3. Injects a prompt context prefix (project name, tech stack, constraints)
 *
 * Presets are stored in localStorage under "sketch-ui-presets".
 * Built-in presets are hardcoded; users can add custom ones via the UI.
 */

import { schemeFromSeed } from "./color";
import type { Palette, Theme, ShapeScale, FontKey, MotionScheme } from "./tokens";
import { DEFAULT_THEME } from "./tokens";

/* ---------- types ---------- */

export interface ProjectPreset {
  /** unique key, also localStorage key suffix */
  key: string;
  /** display name */
  name: string;
  /** short description shown in the selector */
  description: string;
  /** emoji or icon name for the selector */
  icon: string;
  /** seed color for M3 scheme generation */
  seedColor: string;
  /** theme overrides (merged with DEFAULT_THEME) */
  theme: Partial<Theme>;
  /** injected at the top of every generated prompt */
  promptPrefix?: string;
  /** injected at the bottom of every generated prompt */
  promptSuffix?: string;
}

/* ---------- built-in presets ---------- */

export const BUILTIN_PRESETS: ProjectPreset[] = [
  {
    key: "default",
    name: "Material 3",
    description: "标准 Material 3 Expressive",
    icon: "🎨",
    seedColor: "#6750A4",
    theme: {},
  },
  {
    key: "amber",
    name: "琥珀暖色",
    description: "个人品牌：#D97706 + 奶油白",
    icon: "🔥",
    seedColor: "#D97706",
    theme: { shape: "rounded" },
    promptPrefix: "Design system: warm amber (#D97706) primary, cream white backgrounds, Cormorant Garamond for headings, clean and premium feel.",
  },
  {
    key: "furriq",
    name: "Furriq",
    description: "猫品种识别 App — TanStack + React + Tailwind",
    icon: "🐱",
    seedColor: "#8a4b18",
    theme: { shape: "rounded" },
    promptPrefix: "Project: Furriq — a cat breed identification web app. Tech: TanStack Start + React + Tailwind CSS + shadcn. Design tokens: bg-surface, text-ink, text-brand (#8a4b18), border-line-warm. Font: Inter (body) + Libre Baskerville (headings, serif italic). Style: warm earthy tones, trustworthy, professional. CTA color: #8a4b18.",
    promptSuffix: "Use Tailwind CSS utility classes. Responsive mobile-first. Accessible (WCAG AA). Deploy to Cloudflare Pages.",
  },
  {
    key: "gridpaw",
    name: "GridPaw",
    description: "逻辑谜题游戏站 — Astro + TypeScript",
    icon: "🐾",
    seedColor: "#D47A50",
    theme: { shape: "rounded" },
    promptPrefix: "Project: GridPaw — a collection of logic puzzle games (Shikaku, Akari). Tech: Astro 5 static + TypeScript. Design tokens: --accent (#E8A888), --ink (#342421), --bg (#f8f6ef), --mt-primary (#D47A50). Font: Nunito (Shikaku) / SF Pro Rounded (Akari). Style: warm, playful, game-focused. Deploy to Cloudflare Pages.",
    promptSuffix: "Include GA4 event tracking (game_start, level_up, hint_click, daily_challenge, share). Daily challenge system with streak tracking. Static output only.",
  },
];

/* ---------- preset → palette ---------- */

/** Generate a full M3 palette from a preset's seed color */
export function paletteOfPreset(preset: ProjectPreset): Palette {
  return schemeFromSeed(preset.seedColor, preset.name);
}

/** Merge a preset's theme overrides with the defaults */
export function themeOfPreset(preset: ProjectPreset): Theme {
  return { ...DEFAULT_THEME, ...preset.theme };
}

/* ---------- storage ---------- */

const STORAGE_KEY = "sketch-ui-presets";

/** Load all presets (built-in + user custom) */
export function loadAllPresets(): ProjectPreset[] {
  const custom = loadCustomPresets();
  return [...BUILTIN_PRESETS, ...custom];
}

/** Load user-created custom presets from localStorage */
export function loadCustomPresets(): ProjectPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Save a custom preset to localStorage */
export function saveCustomPreset(preset: ProjectPreset): void {
  const existing = loadCustomPresets();
  const idx = existing.findIndex((p) => p.key === preset.key);
  if (idx >= 0) existing[idx] = preset;
  else existing.push(preset);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/** Delete a custom preset by key */
export function deleteCustomPreset(key: string): void {
  const existing = loadCustomPresets().filter((p) => p.key !== key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/* ---------- prompt integration ---------- */

/** Build the prompt context block from a preset (if any) */
export function presetPromptContext(preset: ProjectPreset | null): { prefix: string; suffix: string } {
  if (!preset) return { prefix: "", suffix: "" };
  return {
    prefix: preset.promptPrefix ?? "",
    suffix: preset.promptSuffix ?? "",
  };
}
