/**
 * Page structure extractor: parses real project pages into Sketch UI template format.
 * Run with: node scripts/extract-pages.mjs
 *
 * Reads furriq-app and gridpaw page files, extracts the component hierarchy,
 * and outputs PageTemplate JSON that can be loaded into Sketch UI.
 */

import fs from "node:fs";
import path from "node:path";

const WORKSPACE = "/Users/frankchen/workspace";

/* ---------- Furriq: extract from JSX structure ---------- */

function extractFurriqHomepage() {
  // Based on src/routes/index.tsx - real structure
  return {
    key: "furriq-homepage",
    name: "Furriq 首页",
    description: "真实首页布局：Hero + 品种扫描 + 信任区 + 结果轮播 + 品种列表 + FAQ",
    category: "page",
    projectKey: "furriq",
    icon: "🏠",
    tags: ["homepage", "landing", "furriq", "real"],
    groups: [
      // Header
      {
        _section: "Header",
        _note: "sticky h-16, logo + serif italic 'Furriq' + nav (Tools/Breeds/Blog/Compare/Pricing) + ThemeToggle + Get Started CTA + mobile hamburger",
        items: [{ kind: "topAppBar", label: "Furriq", icon: "menu", icon2: "account_circle", _note: "sticky h-16 max-w-6xl mx-auto, font-serif italic brand name" }],
      },
      // Hero: PhotoTool + Text
      {
        _section: "Hero — Photo Tool + Headline",
        _note: "sm:grid-cols-[minmax(360px,1.05fr)_minmax(0,0.95fr)], gap-7, px-4 py-6",
        items: [
          { kind: "box", label: "", _note: "CatBreedPhotoTool — 上传区, 本地质检, AI分析, 结果卡 (1791行组件)", fill: "surfaceContainerHighest" },
          { kind: "text", label: "Free cat breed identifier — honest clues, not fake guarantees.", _note: "inline-flex badge, border-line-warm bg-surface, rounded-full, Sparkles icon" },
          { kind: "text", label: "Cat Breed Identifier — Free AI Tool by Photo", _note: "h1, font-serif text-4xl sm:text-5xl, text-ink, font-semibold" },
          { kind: "text", label: "Upload a photo. Our AI compares 40+ visual markers — coat, color, face shape, body structure — and returns honest breed clues.", _note: "p, text-muted-foreground text-lg leading-8, max-w-2xl" },
          { kind: "text", label: "1,000+ cat photos analyzed", _note: "avatar stack (3 circular imgs -space-x-2) + text-sm, '1,000+' in text-brand font-bold" },
        ],
      },
      // Proof Points
      {
        _section: "Why Choose Furriq — 3 Proof Points",
        _note: "grid gap-3 sm:grid-cols-3, max-w-6xl, px-4 py-8",
        items: [
          { kind: "card", label: "Privacy first", icon: "shield", supporting: "No original image storage by default.", _note: "ProofPoint: icon + title + body" },
          { kind: "card", label: "Photo-aware", icon: "camera", supporting: "Local quality check before server work.", _note: "ProofPoint" },
          { kind: "card", label: "Uncertain by design", icon: "help", supporting: "Likely clues, never purebred proof.", _note: "ProofPoint" },
        ],
      },
      // Good fit / Less suitable
      {
        _section: "Good Fit / Less Suitable",
        _note: "grid gap-2 sm:grid-cols-2, max-w-6xl, bg-surface-muted rounded-lg p-3",
        items: [
          { kind: "box", label: "Good fit if:", supporting: "You're curious about your cat's breed and comfortable with 'likely' rather than 'certain.'", _note: "bg-surface-muted rounded-lg p-3 text-sm" },
          { kind: "box", label: "Less suitable if:", supporting: "You need DNA-grade proof or expect AI to be 100% accurate.", _note: "bg-surface-muted rounded-lg p-3 text-sm" },
        ],
      },
      // Usage Panel
      {
        _section: "Usage Panel",
        _note: "CatBreedUsagePanel — credits display, usage stats",
        items: [
          { kind: "box", label: "Usage & Credits", _note: "CatBreedUsagePanel component, shows remaining scans and usage stats", fill: "surfaceContainerLow" },
        ],
      },
      // Real Results Carousel
      {
        _section: "Real Results — Breed Match Carousel",
        _note: "border-line-warm bg-surface border-y, px-4 py-12, max-w-6xl",
        items: [
          { kind: "text", label: "REAL RESULTS FROM REAL CATS", _note: "text-brand text-sm font-semibold tracking-wide uppercase" },
          { kind: "text", label: "See how our AI identified different breeds", _note: "h2, font-serif text-3xl, text-ink" },
          { kind: "text", label: "Each cat gets 3 likely breed matches with details on traits, looks, and health.", _note: "text-muted-foreground text-sm" },
          { kind: "card", label: "British Shorthair ~93%", _note: "grid grid-cols-2 sm:grid-cols-4, aspect-square img + name + match%" },
          { kind: "card", label: "Maine Coon ~87%", _note: "breed match card" },
          { kind: "card", label: "Ragdoll ~82%", _note: "breed match card" },
          { kind: "card", label: "Siamese ~78%", _note: "breed match card" },
        ],
      },
      // Breed Pills
      {
        _section: "Popular Breeds — Pill Tags",
        _note: "flex flex-wrap gap-2, max-w-6xl",
        items: [
          { kind: "chip", label: "British Shorthair", variant: "tonal" },
          { kind: "chip", label: "Maine Coon", variant: "tonal" },
          { kind: "chip", label: "Ragdoll", variant: "tonal" },
          { kind: "chip", label: "Siamese", variant: "tonal" },
          { kind: "chip", label: "Persian", variant: "tonal" },
          { kind: "chip", label: "Bengal", variant: "tonal" },
        ],
      },
      // How It Works
      {
        _section: "How It Works — 3 Steps",
        _note: "grid gap-4 sm:grid-cols-3, max-w-6xl, StepCard components",
        items: [
          { kind: "card", label: "1. Upload a photo", icon: "camera", supporting: "Choose a clear, well-lit photo of your cat.", _note: "StepCard: numbered step" },
          { kind: "card", label: "2. AI analyzes traits", icon: "search", supporting: "40+ visual markers scanned — coat, color, face, body.", _note: "StepCard" },
          { kind: "card", label: "3. Read breed clues", icon: "lightbulb", supporting: "Get likely matches with confidence scores.", _note: "StepCard" },
        ],
      },
      // FAQ
      {
        _section: "FAQ",
        _note: "lg:grid-cols-[0.65fr_1.35fr], left=serif title, right=Accordion list, FAQPage JSON-LD",
        items: [
          { kind: "text", label: "Frequently Asked Questions", _note: "h2, font-serif text-3xl, left column" },
          { kind: "listItem", label: "How accurate is this cat breed identifier?", supporting: "Our AI examines 40+ visual markers and returns breed clues with confidence labels.", _note: "Accordion item" },
          { kind: "listItem", label: "Is this cat breed identifier free?", supporting: "Yes — free tier includes 5 scans per month.", _note: "Accordion item" },
          { kind: "listItem", label: "Is my photo stored?", supporting: "Photos are processed locally and never stored on our servers.", _note: "Accordion item" },
          { kind: "listItem", label: "How do I get the best result?", supporting: "Use a clear, well-lit photo showing your cat's full body.", _note: "Accordion item" },
        ],
      },
      // Feedback + Social
      {
        _section: "Feedback Form + Social Proof",
        _note: "FeedbackForm component + X/Product Hunt buttons",
        items: [
          { kind: "box", label: "Feedback", supporting: "Share your experience", _note: "FeedbackForm component" },
          { kind: "button", label: "Follow on X", icon: "close", variant: "outlined", _note: "social proof buttons" },
          { kind: "button", label: "Product Hunt", icon: "arrow_outward", variant: "outlined" },
        ],
      },
      // Footer
      {
        _section: "Footer",
        _note: "bg-neutral-950, serif italic tagline, 4-column grid (Tools/Cat Breeds(accent)/Account/About), disclaimer + PeerPush badge",
        items: [
          { kind: "box", label: "Footer", _note: "bg-neutral-950, 4-col grid, serif italic 'Honest breed clues from photos.', accent column hover #c97a2e", fill: "inverseSurface" },
        ],
      },
    ],
  };
}

function extractFurriqPricing() {
  return {
    key: "furriq-pricing-page",
    name: "Furriq 定价页",
    description: "真实定价页：标题 + 深色套餐卡 + FAQ 区域",
    category: "page",
    projectKey: "furriq",
    icon: "💰",
    tags: ["pricing", "furriq", "real"],
    groups: [
      { _section: "Header", items: [{ kind: "topAppBar", label: "Furriq", icon: "menu", icon2: "account_circle" }] },
      {
        _section: "Title",
        _note: "max-w-3xl, centered",
        items: [
          { kind: "text", label: "Free During Beta", _note: "h1, font-serif text-4xl, centered" },
          { kind: "text", label: "Try the cat breed identifier with no commitment. Upgrade when you need more scans.", _note: "text-muted-foreground text-lg, centered" },
        ],
      },
      {
        _section: "Pricing Cards — Dark Section",
        _note: "bg-ink (dark bg), 4-column grid, stone-900 cards, amber featured, emerald best-value",
        items: [
          { kind: "card", label: "Free", supporting: "5 scans/month · Basic breed clues", variant: "outlined", _note: "stone-900 bg, white text" },
          { kind: "card", label: "Starter", supporting: "25 scans/month · $4.99/mo", variant: "outlined", _note: "stone-900 bg" },
          { kind: "card", label: "Pro", supporting: "Unlimited scans · $9/mo", variant: "filled", _note: "amber-500 featured badge, stone-900 bg" },
          { kind: "card", label: "Team", supporting: "5 users · Unlimited · $29/mo", variant: "outlined", _note: "emerald-500 best-value badge" },
        ],
      },
      {
        _section: "FAQ Sections",
        _note: "3 sections with border-t border-stone-200, prose prose-lg",
        items: [
          { kind: "text", label: "What happens when my free scans run out?", _note: "prose section" },
          { kind: "text", label: "Can I cancel anytime?", _note: "prose section" },
          { kind: "text", label: "Do you offer refunds?", _note: "prose section" },
        ],
      },
      { _section: "Footer", items: [{ kind: "box", label: "Footer", fill: "inverseSurface" }] },
    ],
  };
}

/* ---------- GridPaw: extract from Astro HTML structure ---------- */

function extractGridPawShikaku() {
  return {
    key: "gridpaw-shikaku-home",
    name: "GridPaw Shikaku 首页",
    description: "真实游戏首页：Header + 游戏区 + SEO 内容区 + Footer",
    category: "page",
    projectKey: "gridpaw",
    icon: "🎮",
    tags: ["game", "shikaku", "gridpaw", "real"],
    groups: [
      // Header with hamburger
      {
        _section: "Header (Shikaku variant)",
        _note: "sticky .site-header, brand-logo img + .brand-name (.big/.small), nav.header-nav (Play/How to Play/Tips/Daily/Solver), hamburger ≤480px with .mobile-nav 280px drawer",
        items: [
          { kind: "topAppBar", label: "GridPaw", icon: "menu", icon2: "account_circle", _note: "sticky, brand logo + nav links + hamburger" },
        ],
      },
      // Account area
      {
        _section: "Account Area",
        _note: "#account-area — JS filled, login/signup or user info",
        items: [
          { kind: "box", label: "Sign In / Sign Up", _note: "#account-area, JS populated", fill: "surfaceContainerLow" },
        ],
      },
      // Daily Status
      {
        _section: "Daily Status Bar",
        _note: ".daily-status — streak count, last played, daily challenge link",
        items: [
          { kind: "chip", label: "🔥 7-day streak!", variant: "tonal", _note: "daily-status, localStorage gridpaw-daily" },
        ],
      },
      // Game Card — the main game area
      {
        _section: "Game Card — Shikaku Board",
        _note: ".game-card, max 500px wide, inline-grid board, cellSize 28-56px calculated from viewport",
        items: [
          { kind: "topAppBar", label: "🐾 Level 5 · Medium", icon: "arrow_back", icon2: "more_vert", _note: ".game-topbar: .level-info + #gameTimer + .game-actions" },
          { kind: "text", label: "⏱ 02:34", _note: "#gameTimer, tabular-nums, small text" },
          { kind: "box", label: "", _note: ".board-wrap > .board#board — inline-grid, gap 3px, pad 8px, cells are .cell-empty/.cell-number/.cell-filled/.cell-selecting/.cell-error", fill: "surfaceContainerLow", size: 350 },
          { kind: "iconButton", icon: "undo", variant: "tonal", _note: ".icon-btn undo" },
          { kind: "iconButton", icon: "lightbulb", variant: "tonal", _note: ".icon-btn hint" },
          { kind: "iconButton", icon: "refresh", variant: "tonal", _note: ".icon-btn reset" },
          { kind: "iconButton", icon: "volume_up", variant: "tonal", _note: ".icon-btn sound toggle" },
        ],
      },
      // Victory Overlay
      {
        _section: "Victory Overlay (hidden until solved)",
        _note: ".victory-overlay — absolute over board, .victory-title + .victory-cats (dancing cat imgs) + .next-btn + .share-btn + .reddit-btn + Continue, .confetti-piece / .paw-confetti",
        items: [
          { kind: "dialog", label: "🎉 Puzzle Complete!", supporting: "Time: 01:23 · Hints: 0", _note: "absolute overlay, victory animation" },
          { kind: "button", label: "Next Puzzle", variant: "filled", icon: "arrow_forward" },
          { kind: "button", label: "Share", variant: "tonal", icon: "share" },
        ],
      },
      // Level Selector
      {
        _section: "Level Selector",
        _note: "getDifficulty(level) 8档 Tutorial→Legend auto, badges .badge-easy/medium/medium-hard/hard/expert",
        items: [
          { kind: "chip", label: "Tutorial", variant: "tonal", _note: "#B8E8C0 / #2D6A3F" },
          { kind: "chip", label: "Easy", variant: "tonal", _note: "#B8E8C0 / #2D6A3F" },
          { kind: "chip", label: "Medium", variant: "tonal", _note: "#FDD09F / #8B6914" },
          { kind: "chip", label: "Hard", variant: "tonal", _note: "#FF9A9E / #8B1A1A" },
          { kind: "chip", label: "Expert", variant: "tonal", _note: "#CFC2E8 / #4B2D7A" },
        ],
      },
      // SEO Content Sections
      {
        _section: "SEO Content — Tips Grid",
        _note: ".section-title .accent, .tips-grid > .tip-card(.tip-icon/.tip-label), max 720px",
        items: [
          { kind: "text", label: "Tips & Strategies", _note: ".section-title with .accent underline" },
          { kind: "card", label: "Start with corners", icon: "lightbulb", supporting: "Corner cells have fewer neighbors.", _note: ".tip-card" },
          { kind: "card", label: "Look for 1s and 0s", icon: "search", supporting: "Numbers constrain placement immediately.", _note: ".tip-card" },
          { kind: "card", label: "Mark impossible cells", icon: "block", supporting: "Cells that can't be part of any rectangle.", _note: ".tip-card" },
        ],
      },
      // Testimonials
      {
        _section: "Testimonial Carousel",
        _note: ".testimonial-track > .testimonial-card, auto-scroll",
        items: [
          { kind: "card", label: "\"Best puzzle game I've played this year\"", supporting: "— Reddit user", _note: ".testimonial-card" },
          { kind: "card", label: "\"Perfect for my morning commute\"", supporting: "— App Store review", _note: ".testimonial-card" },
        ],
      },
      // Download Box
      {
        _section: "Download / CTA",
        _note: ".download-box > .download-phone/.download-text/.store-btn",
        items: [
          { kind: "text", label: "Play GridPaw on any device", _note: ".download-text" },
          { kind: "button", label: "Play Now", variant: "filled", icon: "play_arrow", _note: ".store-btn" },
        ],
      },
      // FAQ
      {
        _section: "FAQ",
        _note: ".faq-item > summary + .faq-answer",
        items: [
          { kind: "listItem", label: "What is Shikaku?", supporting: "A logic puzzle where you divide a grid into rectangles.", icon: "help", _note: ".faq-item" },
          { kind: "listItem", label: "How do I get better?", supporting: "Practice daily and use the hint system to learn patterns.", icon: "trending_up", _note: ".faq-item" },
        ],
      },
      // Footer
      {
        _section: "Footer",
        _note: ".seo-footer — two rows links + brand description, or bare <footer><p>© 2026 GridPaw…</p></footer>",
        items: [
          { kind: "box", label: "© 2026 GridPaw", _note: ".seo-footer, links grid + brand description", fill: "inverseSurface" },
        ],
      },
    ],
  };
}

function extractGridPawAkariDaily() {
  return {
    key: "gridpaw-akari-daily",
    name: "GridPaw 每日挑战",
    description: "Akari 每日挑战页：计时器 + streak + 棋盘 + 排行榜",
    category: "page",
    projectKey: "gridpaw",
    icon: "🔥",
    tags: ["daily", "akari", "gridpaw", "real"],
    groups: [
      { _section: "Header (no hamburger)", items: [{ kind: "topAppBar", label: "GridPaw", icon: "arrow_back", _note: "no hamburger, no mobile menu" }] },
      {
        _section: "Daily Challenge Header",
        _note: ".container 720px, h1 + subtitle + #account-area",
        items: [
          { kind: "text", label: "🔥 Daily Challenge", _note: "h1, large" },
          { kind: "text", label: "14×14 Expert Puzzle · Come back daily for a new challenge!", _note: "subtitle" },
        ],
      },
      {
        _section: "Streak Badge",
        _note: ".daily-badge, streak 3/7/14/30 day milestones: On Fire/Star Cat/Diamond Paw/Cat Royalty",
        items: [
          { kind: "chip", label: "🔥 On Fire — 7 days!", variant: "tonal", _note: ".daily-badge, gradient #E8956A→#D47A50" },
        ],
      },
      {
        _section: "Timer (large)",
        _note: ".timer 2rem font, #timer + #best-time",
        items: [
          { kind: "text", label: "00:00", _note: ".timer, 2rem, monospace, large display" },
          { kind: "text", label: "Best: 02:34", _note: "#best-time, smaller" },
        ],
      },
      {
        _section: "Streak Stats — 3 columns",
        _note: "3-column stats: streak / puzzles solved / badges",
        items: [
          { kind: "box", label: "7", supporting: "Day Streak", variant: "tonal", fill: "primaryContainer" },
          { kind: "box", label: "42", supporting: "Puzzles Solved", variant: "tonal", fill: "secondaryContainer" },
          { kind: "box", label: "3", supporting: "Badges", variant: "tonal", fill: "tertiaryContainer" },
        ],
      },
      {
        _section: "Hearts / Lives",
        _note: ".health-display 3× SVG .heart / .heart.lost",
        items: [
          { kind: "text", label: "❤️ ❤️ 🤍", _note: ".health-display, SVG hearts, lost ones grayed" },
        ],
      },
      {
        _section: "Game Board (Akari)",
        _note: ".game-stage > .grid-wrapper > .puzzle-grid#puzzle-grid, inline-grid gap 3px, gradient bg #E8DDD8→#D8C8C0, cells: .cell-black/.cell-number/.cell-lit/.cell-cat/.cell-x",
        items: [
          { kind: "box", label: "", _note: ".puzzle-grid, inline-grid, Akari cells with light bulbs and walls", fill: "surfaceContainerLow", size: 350 },
          { kind: "iconButton", icon: "lightbulb", variant: "tonal", _note: "hint" },
          { kind: "iconButton", icon: "undo", variant: "tonal", _note: "undo" },
          { kind: "iconButton", icon: "refresh", variant: "tonal", _note: "reset" },
        ],
      },
      {
        _section: "Win Overlay (hidden until solved)",
        _note: ".win-overlay fixed fullscreen, .win-glow + .win-cat (inline SVG) + .win-text + .win-stats + .win-btn + .win-share-row",
        items: [
          { kind: "dialog", label: "🎉 Puzzle Complete!", supporting: "Time: 01:23 · Hints: 0 · Hearts: 3/3", _note: "fixed fullscreen overlay" },
          { kind: "button", label: "Share", variant: "tonal", icon: "share" },
        ],
      },
      {
        _section: "Leaderboard",
        _note: ".leaderboard > .leaderboard-item(.rank/.player-name/.time), two boards: today + all-time",
        items: [
          { kind: "text", label: "Today's Leaderboard", _note: "section title" },
          { kind: "listItem", label: "🥇 CatMaster", supporting: "00:45", _note: ".leaderboard-item" },
          { kind: "listItem", label: "🥈 PuzzlePro", supporting: "01:12", _note: ".leaderboard-item" },
          { kind: "listItem", label: "🥉 LightUp", supporting: "01:34", _note: ".leaderboard-item" },
        ],
      },
      { _section: "Footer", items: [{ kind: "box", label: "© 2026 GridPaw", fill: "inverseSurface" }] },
    ],
  };
}

/* ---------- Main: generate and save ---------- */

function normalizeGroups(raw) {
  let y = 0;
  return raw.map((section) => {
    const items = section.items.map((it) => ({
      id: Math.random().toString(36).slice(2, 10),
      kind: it.kind,
      label: it.label || "",
      icon: it.icon || null,
      icon2: it.icon2 || null,
      variant: it.variant || "filled",
      supporting: it.supporting,
      fill: it.fill,
      size: it.size,
      _note: it._note, // preserved in prompt generation
    }));
    const g = {
      id: Math.random().toString(36).slice(2, 10),
      x: 16,
      y,
      axis: "y",
      items,
      _section: section._section,
      _note: section._note,
    };
    y += items.length * 60 + 40;
    return g;
  });
}

const templates = [
  extractFurriqHomepage(),
  extractFurriqPricing(),
  extractGridPawShikaku(),
  extractGridPawAkariDaily(),
];

// Normalize groups for each template
for (const t of templates) {
  t.groups = normalizeGroups(t.groups);
}

const output = JSON.stringify(templates, null, 2);
const outPath = path.join(WORKSPACE, "m3e-canvas", "public", "project-templates.json");
fs.writeFileSync(outPath, output);
console.log(`✅ Wrote ${templates.length} templates to ${outPath}`);
console.log(templates.map((t) => `  ${t.key}: ${t.groups.length} sections`).join("\n"));
