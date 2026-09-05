/**
 * HTML → Sketch UI converter.
 * Fetches a live page, parses the DOM structure, and converts it
 * into Sketch UI Group/Item format for the canvas.
 *
 * Usage: node scripts/html-to-canvas.mjs <url> [output.json]
 */

import https from "node:https";
import http from "node:http";
import { JSDOM } from "jsdom";
import fs from "node:fs";

const url = process.argv[2];
const output = process.argv[3] || "parsed-page.json";

if (!url) {
  console.error("Usage: node scripts/html-to-canvas.mjs <url> [output.json]");
  process.exit(1);
}

/* ---------- fetch ---------- */

function fetchHtml(targetUrl) {
  return new Promise((resolve, reject) => {
    const transport = targetUrl.startsWith("https") ? https : http;
    const req = transport.get(targetUrl, { headers: { "User-Agent": "Mozilla/5.0 SketchUI/1.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve, reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

/* ---------- parsing ---------- */

let idCounter = 0;
const uid = () => `p${(++idCounter).toString(36)}`;

/** Map HTML tag + classes + text to a Sketch UI Kind */
function classifyElement(el) {
  const tag = el.tagName?.toLowerCase();
  const cls = el.className || "";
  const role = el.getAttribute?.("role") || "";

  // Navigation
  if (tag === "nav" || role === "navigation") return "topAppBar";
  if (tag === "header") return "topAppBar";
  if (tag === "footer") return "box";

  // Buttons
  if (tag === "button" || role === "button") return "button";
  if (tag === "a" && el.textContent?.trim().length < 40) return "button";

  // Inputs
  if (tag === "input" || tag === "textarea") return "textField";
  if (tag === "select") return "textField";

  // Lists
  if (tag === "li") return "listItem";

  // Images
  if (tag === "img") return "image";

  // Headings
  if (/^h[1-6]$/.test(tag)) return "text";

  // Sections / divs with content
  if (tag === "section" || tag === "article") return "box";
  if (tag === "main") return "box";

  // Cards (common patterns)
  if (/\b(card|panel|tile)\b/i.test(cls)) return "card";

  // Text
  if (tag === "p" || tag === "span" || tag === "label") return "text";

  // Default
  return "box";
}

/** Extract visible text from an element, trimmed */
function getText(el) {
  const text = el.textContent?.trim().replace(/\s+/g, " ") || "";
  return text.length > 120 ? text.slice(0, 117) + "…" : text;
}

/** Get the first meaningful icon name from classes */
function getIcon(el) {
  const cls = el.className || "";
  // lucide-react pattern
  const lucideMatch = cls.match(/\b(icon-[\w-]+|lucide-[\w-]+)\b/);
  if (lucideMatch) return lucideMatch[1].replace(/^(icon-|lucide-)/, "").replace(/-/g, "_");
  // Material icons
  const matMatch = cls.match(/\bmi-([\w]+)\b/);
  if (matMatch) return matMatch[1];
  return null;
}

/** Determine variant from classes/styles */
function getVariant(el) {
  const cls = (el.className || "").toLowerCase();
  const style = (el.getAttribute("style") || "").toLowerCase();
  if (/\b(outlined|border)\b/.test(cls)) return "outlined";
  if (/\b(tonal|secondary)\b/.test(cls)) return "tonal";
  if (/\b(elevated|shadow)\b/.test(cls)) return "elevated";
  if (/\bghost\b/.test(cls)) return "text";
  return "filled";
}

/** Check if element is visually meaningful (not hidden, not empty) */
function isVisible(el) {
  if (!el || el.nodeType !== 1) return false;
  const style = el.getAttribute("style") || "";
  if (/display:\s*none/i.test(style)) return false;
  if (/visibility:\s*hidden/i.test(style)) return false;
  const cls = el.className || "";
  if (/\b(sr-only|visually-hidden|hidden)\b/.test(cls)) return false;
  return true;
}

/** Check if element is a semantic section boundary */
function isSection(el) {
  const tag = el.tagName?.toLowerCase();
  if (["header", "footer", "nav", "main", "section", "article", "aside"].includes(tag)) return true;
  const cls = el.className || "";
  if (/\b(section|hero|banner|cta|faq|pricing|feature|testimonial|footer|header|nav)\b/i.test(cls)) return true;
  return false;
}

/** Parse a top-level section into items */
function parseSection(el, depth = 0) {
  const items = [];
  const tag = el.tagName?.toLowerCase();

  // Skip scripts, styles, SVGs
  if (["script", "style", "noscript", "svg", "link", "meta"].includes(tag)) return items;

  // Direct element classification
  const kind = classifyElement(el);
  const text = getText(el);

  // Skip empty non-structural elements
  if (!text && !["box", "topAppBar", "image"].includes(kind)) return items;

  if (kind === "topAppBar" && tag === "header") {
    // Extract nav items
    const links = el.querySelectorAll("a");
    const navItems = [];
    for (const link of links) {
      const linkText = getText(link);
      if (linkText && linkText.length < 30) navItems.push(linkText);
    }
    items.push({
      id: uid(), kind: "topAppBar",
      label: text.slice(0, 30) || "Header",
      icon: "menu", icon2: null,
      variant: "filled",
      _note: `Nav links: ${navItems.join(", ") || "none"}`,
    });
    return items;
  }

  if (kind === "box" && tag === "footer") {
    items.push({
      id: uid(), kind: "box",
      label: text.slice(0, 60) || "Footer",
      variant: "filled",
      fill: "inverseSurface",
      _note: `Footer: ${text.slice(0, 100)}`,
    });
    return items;
  }

  // For sections: recurse into children
  if (isSection(el) && depth < 3) {
    const children = Array.from(el.children).filter(isVisible);
    // If section has few direct children, treat as a group
    if (children.length <= 6) {
      for (const child of children) {
        items.push(...parseSection(child, depth + 1));
      }
    } else {
      // Large section: take the heading + first few meaningful children
      const heading = el.querySelector("h1, h2, h3");
      if (heading) {
        items.push({
          id: uid(), kind: "text",
          label: getText(heading),
          variant: "tonal", bold: true,
          _note: `h${heading.tagName[1]}, ${(heading.className || "").slice(0, 60)}`,
        });
      }
      // Take first N meaningful children
      let count = 0;
      for (const child of children) {
        if (count >= 5) break;
        const childText = getText(child);
        if (childText.length > 2) {
          const childKind = classifyElement(child);
          items.push({
            id: uid(), kind: childKind,
            label: childText.slice(0, 80),
            variant: getVariant(child),
            icon: getIcon(child),
            _note: `<${child.tagName?.toLowerCase()} class="${(child.className || "").slice(0, 60)}">`,
          });
          count++;
        }
      }
    }
    return items;
  }

  // Leaf element
  if (text.length > 1) {
    items.push({
      id: uid(), kind,
      label: text.slice(0, 80),
      variant: getVariant(el),
      icon: getIcon(el),
      bold: /^h[1-3]$/.test(tag),
      _note: `<${tag} class="${(el.className || "").slice(0, 60)}">`,
    });
  }

  return items;
}

/* ---------- main ---------- */

async function main() {
  console.log(`Fetching ${url}...`);
  const html = await fetchHtml(url);
  console.log(`Got ${html.length} bytes`);

  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Find the main content area
  const main = doc.querySelector("main") || doc.querySelector("[role=main]") || doc.body;

  // Find top-level sections
  const sections = [];
  const children = Array.from(main.children).filter(isVisible);

  console.log(`Found ${children.length} top-level elements`);

  let yOffset = 0;
  const groups = [];

  for (const el of children) {
    const items = parseSection(el);
    if (items.length === 0) continue;

    const tag = el.tagName?.toLowerCase();
    const cls = (el.className || "").slice(0, 40);

    groups.push({
      id: uid(),
      x: 16,
      y: yOffset,
      axis: "y",
      items,
      _section: `${tag}${cls ? "." + cls.split(/\s+/)[0] : ""}`,
      _note: `Source: <${tag} class="${(el.className || "").slice(0, 80)}">`,
    });

    yOffset += items.length * 56 + 40;
    sections.push({ tag, cls, itemCount: items.length });
  }

  // Wrap in a page template
  const hostname = new URL(url).hostname.replace("www.", "");
  const template = {
    key: `imported-${hostname.replace(/\./g, "-")}`,
    name: `${hostname} — 导入页面`,
    description: `从 ${url} 导入的真实页面结构，${groups.length} 个区块`,
    category: "page",
    projectKey: null, // will be set when loaded into a preset
    icon: "📥",
    groups,
    tags: ["imported", hostname],
  };

  fs.writeFileSync(output, JSON.stringify(template, null, 2));
  console.log(`\n✅ Parsed ${sections.length} sections → ${output}`);
  for (const s of sections) {
    console.log(`  <${s.tag}> ${s.cls ? "." + s.cls.split(/\s+/)[0] : ""} → ${s.itemCount} items`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
