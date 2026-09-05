/**
 * Page templates: pre-arranged groups of M3 components that form common page layouts.
 *
 * Each template belongs to a project preset and represents a reusable page skeleton.
 * Users can drag a template onto the canvas, then visually adjust it.
 *
 * Templates are stored in localStorage under "sketch-ui-templates".
 * Built-in skeletons are hardcoded; users create more via "Save as Template".
 */

import { Group, Item, Kind, uid } from "./tokens";

/* ---------- types ---------- */

export type TemplateCategory =
  | "page"       // full page layouts
  | "section"    // reusable sections (hero, FAQ, pricing)
  | "component"  // standalone components (card, CTA, nav)
  | "game";      // game-specific patterns (board, timer, overlay)

export interface PageTemplate {
  key: string;
  name: string;
  description: string;
  category: TemplateCategory;
  /** which project preset this belongs to (null = generic) */
  projectKey: string | null;
  /** emoji icon for the template card */
  icon: string;
  /** the groups that make up this template */
  groups: Group[];
  /** optional: which frame mode this template targets */
  frameMode?: "phone" | "desktop";
  /** tags for filtering */
  tags: string[];
}

/* ---------- helpers to build items quickly ---------- */

function item(kind: Kind, label: string, opts: Partial<Item> = {}): Item {
  return {
    id: uid(),
    kind,
    label,
    icon: null,
    variant: "filled",
    ...opts,
  };
}

function group(items: Item[], axis: "x" | "y" = "y", x = 0, y = 0): Group {
  return { id: uid(), x, y, axis, items };
}

/* ---------- built-in template skeletons ---------- */

const FURRIQ_TEMPLATES: PageTemplate[] = [
  {
    key: "furriq-hero-cta",
    name: "Hero + CTA",
    description: "深色 hero 区域 + 标题 + CTA 按钮",
    category: "section",
    projectKey: "furriq",
    icon: "🏔️",
    tags: ["hero", "cta", "landing"],
    groups: [
      group([
        item("box", "", { variant: "filled", size: 300, fill: "inverseSurface" as any }),
      ], "y", 0, 0),
      group([
        item("text", "Identify Your Cat's Breed", { variant: "text", bold: true, supporting: "Upload a photo and let AI analyze your cat's breed, markings, and traits." }),
      ], "y", 16, 40),
      group([
        item("button", "Get Started Free", { variant: "filled", icon: "arrow_forward" }),
        item("button", "See How It Works", { variant: "outlined" }),
      ], "x", 16, 160),
    ],
  },
  {
    key: "furriq-breed-card",
    name: "品种卡片",
    description: "品种图片 + 标题 + origin 标签 + Key Markers",
    category: "component",
    projectKey: "furriq",
    icon: "🐱",
    tags: ["card", "breed", "detail"],
    groups: [
      group([
        item("card", "British Shorthair", {
          variant: "elevated",
          supporting: "United Kingdom · Medium to Large",
          icon: "pets",
          icon2: "chevron_right",
        }),
      ], "y", 0, 0),
      group([
        item("chip", "Calm", { variant: "tonal" }),
        item("chip", "Affectionate", { variant: "tonal" }),
        item("chip", "Independent", { variant: "tonal" }),
      ], "x", 0, 100),
    ],
  },
  {
    key: "furriq-scan-cta",
    name: "扫描 CTA 卡",
    description: "品牌边框卡 + 标题 + 扫描按钮",
    category: "component",
    projectKey: "furriq",
    icon: "📸",
    tags: ["cta", "scan", "conversion"],
    groups: [
      group([
        item("box", "", { variant: "outlined", size: 180, fill: "surfaceContainerLow" as any }),
      ], "y", 0, 0),
      group([
        item("text", "What breed is your cat?", { variant: "text", bold: true, supporting: "Upload a photo for instant AI analysis" }),
      ], "y", 16, 16),
      group([
        item("button", "Scan Your Cat", { variant: "filled", icon: "photo_camera" }),
      ], "y", 16, 100),
    ],
  },
  {
    key: "furriq-pricing",
    name: "定价表",
    description: "深色背景 + 套餐卡",
    category: "section",
    projectKey: "furriq",
    icon: "💰",
    tags: ["pricing", "plans", "conversion"],
    groups: [
      group([
        item("text", "Simple, Transparent Pricing", { variant: "tonal", bold: true }),
        item("text", "Start free. Upgrade when you need more.", { variant: "text" }),
      ], "y", 0, 0),
      group([
        item("card", "Free", { variant: "outlined", supporting: "5 scans/month" }),
        item("card", "Pro", { variant: "filled", supporting: "Unlimited scans · $9/mo" }),
      ], "x", 0, 80),
    ],
  },
  {
    key: "furriq-faq",
    name: "FAQ 区块",
    description: "左标题 + 右手风琴列表",
    category: "section",
    projectKey: "furriq",
    icon: "❓",
    tags: ["faq", "content", "seo"],
    groups: [
      group([
        item("text", "Frequently Asked Questions", { variant: "tonal", bold: true }),
      ], "y", 0, 0),
      group([
        item("listItem", "How accurate is the breed identification?", { supporting: "Our AI achieves 95%+ accuracy for recognized breeds.", icon: "help" }),
        item("listItem", "Is my photo stored?", { supporting: "Photos are processed locally and never stored on our servers.", icon: "lock" }),
        item("listItem", "Can I use it for free?", { supporting: "Yes! Free tier includes 5 scans per month.", icon: "star" }),
      ], "y", 0, 60),
    ],
  },
  {
    key: "furriq-blog-grid",
    name: "博客卡 grid",
    description: "3 列封面图 + hover 遮罩 + 作者行",
    category: "section",
    projectKey: "furriq",
    icon: "📝",
    tags: ["blog", "grid", "content"],
    groups: [
      group([
        item("text", "Latest Articles", { variant: "tonal", bold: true }),
      ], "y", 0, 0),
      group([
        item("card", "How to Tell Your Cat's Breed", { variant: "elevated", supporting: "Dr. Sarah Chen · 5 min read" }),
        item("card", "Top 10 Friendliest Cat Breeds", { variant: "elevated", supporting: "Team Furriq · 8 min read" }),
        item("card", "Understanding Cat Coat Patterns", { variant: "elevated", supporting: "Dr. Sarah Chen · 6 min read" }),
      ], "x", 0, 50),
    ],
  },
  {
    key: "furriq-page-skeleton",
    name: "页面骨架",
    description: "Header + Content + Footer 标准布局",
    category: "page",
    projectKey: "furriq",
    icon: "📄",
    tags: ["page", "layout", "skeleton"],
    groups: [
      group([
        item("topAppBar", "Furriq", { icon: "menu", icon2: "account_circle" }),
      ], "y", 0, 0),
      group([
        item("text", "Page Title", { variant: "tonal", bold: true, supporting: "Page description text goes here." }),
      ], "y", 16, 72),
      group([
        item("card", "Content Card 1", { variant: "elevated", supporting: "Card supporting text" }),
        item("card", "Content Card 2", { variant: "elevated", supporting: "Card supporting text" }),
      ], "y", 16, 160),
      group([
        item("bottomNav", "", { tabs: [
          { label: "Home", icon: "home" },
          { label: "Breeds", icon: "pets" },
          { label: "Blog", icon: "article" },
          { label: "Scan", icon: "photo_camera" },
        ]}),
      ], "y", 0, 780),
    ],
  },
];

const GRIDPAW_TEMPLATES: PageTemplate[] = [
  {
    key: "gridpaw-game-board",
    name: "游戏棋盘",
    description: "grid 格子 + 顶部工具栏",
    category: "game",
    projectKey: "gridpaw",
    icon: "🎮",
    tags: ["game", "board", "puzzle"],
    groups: [
      group([
        item("topAppBar", "Level 5", { icon: "arrow_back", icon2: "more_vert" }),
      ], "y", 0, 0),
      group([
        item("text", "🐾 Medium · 6×6", { variant: "text", supporting: "⏱ 02:34" }),
      ], "y", 0, 64),
      group([
        item("box", "", { variant: "outlined", size: 360, fill: "surfaceContainerLow" as any }),
      ], "y", 0, 100),
      group([
        item("iconButton", "", { icon: "undo", variant: "tonal" }),
        item("iconButton", "", { icon: "lightbulb", variant: "tonal" }),
        item("iconButton", "", { icon: "refresh", variant: "tonal" }),
        item("iconButton", "", { icon: "volume_up", variant: "tonal" }),
      ], "x", 0, 480),
    ],
  },
  {
    key: "gridpaw-daily-challenge",
    name: "每日挑战卡",
    description: "streak 徽章 + 计时器 + 统计三栏",
    category: "game",
    projectKey: "gridpaw",
    icon: "🔥",
    tags: ["daily", "challenge", "streak"],
    groups: [
      group([
        item("text", "🔥 Daily Challenge", { variant: "tonal", bold: true }),
        item("text", "14×14 Expert Puzzle", { variant: "text", supporting: "🔥 7-day streak!" }),
      ], "y", 0, 0),
      group([
        item("text", "00:00", { variant: "text", bold: true }),
      ], "y", 16, 80),
      group([
        item("box", "7", { variant: "tonal", fill: "primaryContainer" as any, supporting: "Day Streak" }),
        item("box", "12", { variant: "tonal", fill: "secondaryContainer" as any, supporting: "Puzzles Solved" }),
        item("box", "3", { variant: "tonal", fill: "tertiaryContainer" as any, supporting: "Badges" }),
      ], "x", 0, 160),
      group([
        item("button", "Start Challenge", { variant: "filled", icon: "play_arrow" }),
      ], "y", 16, 250),
    ],
  },
  {
    key: "gridpaw-victory",
    name: "胜利弹层",
    description: "全屏 overlay + 分享按钮组",
    category: "game",
    projectKey: "gridpaw",
    icon: "🎉",
    tags: ["victory", "overlay", "share"],
    groups: [
      group([
        item("box", "", { variant: "filled", size: 400, fill: "inverseSurface" as any }),
      ], "y", 0, 0),
      group([
        item("text", "🎉 Puzzle Complete!", { variant: "tonal", bold: true }),
        item("text", "Time: 01:23 · Hints: 0", { variant: "text" }),
      ], "y", 0, 120),
      group([
        item("button", "Next Puzzle", { variant: "filled", icon: "arrow_forward" }),
        item("button", "Share", { variant: "tonal", icon: "share" }),
      ], "x", 0, 250),
    ],
  },
  {
    key: "gridpaw-seo-content",
    name: "SEO 内容页",
    description: "h1 + 副标题 + 正文区 + Play CTA",
    category: "page",
    projectKey: "gridpaw",
    icon: "📖",
    tags: ["seo", "content", "article"],
    groups: [
      group([
        item("topAppBar", "GridPaw", { icon: "arrow_back", icon2: "menu" }),
      ], "y", 0, 0),
      group([
        item("text", "How to Play Akari", { variant: "tonal", bold: true, supporting: "Learn the rules and strategies of Light Up puzzles" }),
      ], "y", 16, 72),
      group([
        item("listItem", "Step 1: Understand the Grid", { supporting: "The grid contains numbered walls and empty cells.", icon: "grid_on" }),
        item("listItem", "Step 2: Place Light Bulbs", { supporting: "Click empty cells to place light bulbs.", icon: "lightbulb" }),
        item("listItem", "Step 3: Light Up Everything", { supporting: "Each bulb lights its row and column.", icon: "flare" }),
      ], "y", 16, 150),
      group([
        item("button", "Play Now", { variant: "filled", icon: "play_arrow" }),
      ], "y", 16, 400),
    ],
  },
  {
    key: "gridpaw-page-skeleton",
    name: "页面骨架",
    description: "Header + Game Area + Footer",
    category: "page",
    projectKey: "gridpaw",
    icon: "📄",
    tags: ["page", "layout", "skeleton"],
    groups: [
      group([
        item("topAppBar", "GridPaw", { icon: "menu", icon2: "account_circle" }),
      ], "y", 0, 0),
      group([
        item("text", "Page Title", { variant: "tonal", bold: true }),
      ], "y", 16, 72),
      group([
        item("box", "", { variant: "outlined", size: 300, fill: "surfaceContainerLow" as any }),
      ], "y", 16, 120),
      group([
        item("button", "Primary Action", { variant: "filled" }),
        item("button", "Secondary", { variant: "outlined" }),
      ], "x", 16, 440),
    ],
  },
];

const GENERIC_TEMPLATES: PageTemplate[] = [
  {
    key: "generic-login",
    name: "登录页",
    description: "Logo + 邮箱输入 + 密码输入 + 登录按钮",
    category: "page",
    projectKey: null,
    icon: "🔐",
    tags: ["login", "auth", "form"],
    groups: [
      group([
        item("text", "Welcome Back", { variant: "tonal", bold: true, supporting: "Sign in to continue" }),
      ], "y", 80, 80),
      group([
        item("textField", "Email", { variant: "outlined", icon: "email" }),
        item("textField", "Password", { variant: "outlined", icon: "lock" }),
      ], "y", 16, 180),
      group([
        item("button", "Sign In", { variant: "filled" }),
      ], "y", 16, 320),
      group([
        item("text", "Don't have an account?", { variant: "text", supporting: "Sign up" }),
      ], "y", 16, 390),
    ],
  },
  {
    key: "generic-settings",
    name: "设置页",
    description: "列表式设置项",
    category: "page",
    projectKey: null,
    icon: "⚙️",
    tags: ["settings", "preferences"],
    groups: [
      group([
        item("topAppBar", "Settings", { icon: "arrow_back" }),
      ], "y", 0, 0),
      group([
        item("listItem", "Notifications", { icon: "notifications", icon2: "chevron_right", supporting: "Manage push and email alerts" }),
        item("listItem", "Privacy", { icon: "lock", icon2: "chevron_right", supporting: "Data and permissions" }),
        item("listItem", "Appearance", { icon: "palette", icon2: "chevron_right", supporting: "Theme, font size" }),
        item("listItem", "About", { icon: "info", icon2: "chevron_right", supporting: "Version 1.0.0" }),
      ], "y", 16, 64),
    ],
  },
  {
    key: "generic-empty-state",
    name: "空状态",
    description: "图标 + 标题 + 描述 + 操作按钮",
    category: "section",
    projectKey: null,
    icon: "📭",
    tags: ["empty", "onboarding"],
    groups: [
      group([
        item("text", "No items yet", { variant: "tonal", bold: true, supporting: "Create your first item to get started." }),
      ], "y", 120, 120),
      group([
        item("button", "Create Item", { variant: "filled", icon: "add" }),
      ], "y", 16, 260),
    ],
  },
];

/* ---------- all built-in templates ---------- */

export const BUILTIN_TEMPLATES: PageTemplate[] = [
  ...GENERIC_TEMPLATES,
  ...FURRIQ_TEMPLATES,
  ...GRIDPAW_TEMPLATES,
];

/* ---------- external project templates (loaded from public/project-templates.json) ---------- */

let _externalTemplates: PageTemplate[] | null = null;

/** Load templates generated by scripts/extract-pages.mjs */
export async function loadExternalTemplates(): Promise<PageTemplate[]> {
  if (_externalTemplates) return _externalTemplates;
  try {
    const res = await fetch("/project-templates.json");
    if (!res.ok) return [];
    const data = await res.json();
    _externalTemplates = Array.isArray(data) ? data : [];
    return _externalTemplates;
  } catch {
    return [];
  }
}

/* ---------- storage ---------- */

const STORAGE_KEY = "sketch-ui-templates";

export function loadAllTemplates(): PageTemplate[] {
  return [...BUILTIN_TEMPLATES, ...loadCustomTemplates()];
}

export function loadCustomTemplates(): PageTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: PageTemplate): void {
  const existing = loadCustomTemplates();
  const idx = existing.findIndex((t) => t.key === template.key);
  if (idx >= 0) existing[idx] = template;
  else existing.push(template);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deleteCustomTemplate(key: string): void {
  const existing = loadCustomTemplates().filter((t) => t.key !== key);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

/** Save current canvas selection as a template */
export function saveCanvasAsTemplate(
  name: string,
  groups: Group[],
  projectKey: string | null,
  category: TemplateCategory = "section"
): PageTemplate {
  const key = "custom-" + name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
  const template: PageTemplate = {
    key,
    name,
    description: `Custom template: ${name}`,
    category,
    projectKey,
    icon: "📦",
    groups: JSON.parse(JSON.stringify(groups)), // deep clone
    tags: ["custom"],
  };
  saveCustomTemplate(template);
  return template;
}

/* ---------- filtering ---------- */

export function templatesForProject(projectKey: string | null): PageTemplate[] {
  if (!projectKey) return loadAllTemplates();
  return loadAllTemplates().filter(
    (t) => t.projectKey === projectKey || t.projectKey === null
  );
}

export function templatesByCategory(templates: PageTemplate[]): Record<TemplateCategory, PageTemplate[]> {
  const result: Record<TemplateCategory, PageTemplate[]> = {
    page: [],
    section: [],
    component: [],
    game: [],
  };
  for (const t of templates) {
    result[t.category].push(t);
  }
  return result;
}
