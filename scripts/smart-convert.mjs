/**
 * Smart converter: parsed page structure → Sketch UI canvas groups.
 * Skips wrappers, aggregates visual blocks, filters noise.
 *
 * Usage: node scripts/smart-convert.mjs <input.json> <output.json> <projectKey>
 */

import fs from "node:fs";

const input = process.argv[2];
const output = process.argv[3];
const projectKey = process.argv[4] || null;

if (!input || !output) {
  console.error("Usage: node scripts/smart-convert.mjs <input.json> <output.json> [projectKey]");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(input, "utf-8"));
const rawSections = data.sections || [];

let idCounter = 0;
const uid = () => `i${(++idCounter).toString(36)}`;

/* ---------- noise filter ---------- */

const NOISE_TEXT = /^(loading|submit|send|sign in|sign up|skip|close|cancel|ok|yes|no|\.\.\.|→|←|↑|↓)$/i;
const NOISE_CLASSES = /sr-only|visually-hidden|pointer-events-none|absolute.*z-|fixed.*z-/;
const MIN_TEXT_LEN = 3;

function isNoise(text, classes) {
  if (!text || text.length < MIN_TEXT_LEN) return true;
  if (NOISE_TEXT.test(text.trim())) return true;
  const clsStr = Array.isArray(classes) ? classes.join(" ") : (classes || ""); if (clsStr && NOISE_CLASSES.test(clsStr)) return true;
  // Skip pure numbers like "1,000+" unless they're stat values
  if (/^[\d,+%]+$/.test(text.trim()) && text.trim().length < 8) return true;
  return false;
}

/* ---------- section classifier ---------- */

function classifySection(tag, cls, heading, elementCount) {
  const c = (cls || "").toLowerCase();
  const h = (heading || "").toLowerCase();

  // Wrapper sections - skip
  if (tag === "main" && !c.includes("section")) return "skip";
  if (tag === "div" && !c.includes("section") && !c.includes("hero") && !c.includes("banner")) return "skip";

  // Structural sections
  if (tag === "header") return "header";
  if (tag === "nav") return "nav";
  if (tag === "footer") return "footer";

  // Content sections by class/heading
  if (/hero|banner|cta/.test(c) || /hero/.test(h)) return "hero";
  if (/faq/.test(c) || /faq|frequently/.test(h)) return "faq";
  if (/pricing|plan/.test(c) || /pricing/.test(h)) return "pricing";
  if (/feature|benefit|proof/.test(c) || /privacy|result guard/.test(h)) return "features";
  if (/how.it.work|step/.test(c) || /how it works/.test(h)) return "howto";
  if (/testimonial|review/.test(c) || /testimonial/.test(h)) return "testimonial";
  if (/compare|breed.*chart/.test(c) || /compare.*glance/.test(h)) return "comparison";
  if (/breed|popular/.test(c) || /popular breed|identify/.test(h)) return "breeds";
  if (/result|gallery|carousel/.test(c) || /identified different/.test(h)) return "results";
  if (/feedback|form/.test(c) || /help us|feedback/.test(h)) return "feedback";
  if (/stat|number|counter/.test(c) || /trusted.*owner/.test(h)) return "stats";
  if (/download|app/.test(c) || /download|get.*app/.test(h)) return "download";
  if (/game|board|puzzle/.test(c)) return "game";
  if (/leaderboard|rank/.test(c)) return "leaderboard";
  if (/daily|streak|challenge/.test(c)) return "daily";
  if (/tip|strategy|guide/.test(c) || /tip|strategy|guide/.test(h)) return "tips";
  if (/blog|article|post/.test(c) || /blog|article/.test(h)) return "blog";
  if (/seo|content/.test(c)) return "seo";

  // Default: generic content section
  if (elementCount > 0) return "content";
  return "skip";
}

/* ---------- element aggregator ---------- */

function aggregateElements(elements, sectionType) {
  const items = [];
  const seen = new Set();

  for (const el of elements) {
    const text = (el.text || "").trim();
    const classes = Array.isArray(el.classes) ? el.classes.join(" ") : (el.classes || "");
    const role = el.role || "text";

    // Filter noise
    if (isNoise(text, classes)) continue;

    // Deduplicate
    const key = `${role}:${text.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Classify
    let kind = "text";
    let variant = "filled";
    let bold = false;
    let icon = null;

    if (role === "heading") {
      kind = "text";
      bold = true;
      variant = "tonal";
    } else if (role === "button") {
      kind = "button";
      variant = "filled";
      icon = "touch_app";
    } else if (role === "link") {
      kind = "button";
      variant = "outlined";
      icon = "open_in_new";
    } else if (role === "image") {
      kind = "image";
    } else if (role === "input") {
      kind = "textField";
    } else {
      kind = "text";
    }

    // Override variant from classes
    const c = (Array.isArray(classes) ? classes.join(" ") : (classes || "")).toLowerCase();
    if (/border-line-warm|bg-surface\b/.test(c) && !/border-brand/.test(c)) variant = "outlined";
    if (/bg-primary|bg-brand/.test(c)) variant = "filled";
    if (/text-brand/.test(c) && role === "text") variant = "tonal";

    items.push({
      id: uid(),
      kind,
      label: text.slice(0, 100),
      icon,
      icon2: null,
      variant,
      bold,
      _note: `<${el.tag || "?"} class="${c.slice(0, 60)}">`,
    });
  }

  // Limit items per section to keep canvas manageable
  const MAX_ITEMS = 8;
  if (items.length > MAX_ITEMS) {
    // Keep headings + first few items
    const headings = items.filter((i) => i.bold);
    const rest = items.filter((i) => !i.bold);
    return [...headings, ...rest.slice(0, MAX_ITEMS - headings.length)];
  }

  return items;
}

/* ---------- main conversion ---------- */

const SECTION_ICONS = {
  header: "web_asset",
  nav: "menu",
  footer: "horizontal_rule",
  hero: "view_carousel",
  features: "verified",
  results: "photo_library",
  comparison: "compare",
  breeds: "pets",
  howto: "help_outline",
  faq: "question_answer",
  pricing: "payments",
  testimonial: "format_quote",
  feedback: "feedback",
  stats: "bar_chart",
  download: "download",
  game: "sports_esports",
  leaderboard: "leaderboard",
  daily: "today",
  tips: "lightbulb",
  blog: "article",
  seo: "search",
  content: "description",
};

let yOffset = 0;
const groups = [];
const skippedWrappers = [];

for (const section of rawSections) {
  const tag = section.tag || "div";
  const cls = section.className || "";
  const heading = section.heading || "";
  const elements = section.elements || [];

  const sectionType = classifySection(tag, cls, heading, elements.length);

  if (sectionType === "skip") {
    skippedWrappers.push(`<${tag}> .${(cls || "").split(/\s+/)[0]}`);
    continue;
  }

  const items = aggregateElements(elements, sectionType);
  if (items.length === 0) continue;

  const icon = SECTION_ICONS[sectionType] || "description";
  const sectionLabel = heading || sectionType.charAt(0).toUpperCase() + sectionType.slice(1);

  groups.push({
    id: uid(),
    x: 16,
    y: yOffset,
    axis: "y",
    items,
    _section: sectionLabel,
    _type: sectionType,
    _icon: icon,
    _note: `Source: <${tag} class="${(cls || "").slice(0, 60)}"> | ${sectionType}`,
  });

  yOffset += items.length * 56 + 40;
}

/* ---------- output ---------- */

const hostname = data.url ? new URL(data.url).hostname.replace("www.", "") : "unknown";
const totalItems = groups.reduce((s, g) => s + g.items.length, 0);

const template = {
  key: `imported-${hostname.replace(/\./g, "-")}`,
  name: `${hostname} — 真实页面布局`,
  description: `从 ${data.url || hostname} 导入：${groups.length} 个区块，${totalItems} 个元素`,
  category: "page",
  projectKey,
  icon: "📥",
  groups,
  tags: ["imported", hostname, "real-page"],
};

fs.writeFileSync(output, JSON.stringify(template, null, 2));
console.log(`✅ ${hostname}: ${groups.length} sections, ${totalItems} elements`);
console.log(`   Skipped ${skippedWrappers.length} wrappers: ${skippedWrappers.join(", ")}`);
console.log(`   Sections:`);
for (const g of groups) {
  console.log(`     ${g._icon} ${g._section} (${g.items.length} items)`);
}
