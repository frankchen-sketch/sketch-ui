/**
 * Convert parsed page structures (from parse-structure.mjs) into
 * Sketch UI PageTemplate format for canvas loading.
 *
 * Usage: node scripts/structure-to-template.mjs <input.json> <output.json> <projectKey>
 */

import fs from "node:fs";

const input = process.argv[2];
const output = process.argv[3];
const projectKey = process.argv[4] || null;

if (!input || !output) {
  console.error("Usage: node scripts/structure-to-template.mjs <input.json> <output.json> [projectKey]");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(input, "utf-8"));
const sections = data.sections || data;

let idCounter = 0;
const uid = () => `i${(++idCounter).toString(36)}`;

/** Map a parsed element role to a Sketch UI Kind */
function roleToKind(role, tag) {
  switch (role) {
    case "heading": return "text";
    case "button": return "button";
    case "link": return "button";
    case "text": return "text";
    case "image": return "image";
    case "input": return "textField";
    case "list-item": return "listItem";
    case "container": return "box";
    default: return "box";
  }
}

/** Get variant from CSS classes */
function getVariant(cls) {
  if (!cls || typeof cls !== "string") return "filled";
  const c = cls.toLowerCase();
  if (/outlined|border/.test(c)) return "outlined";
  if (/tonal|secondary/.test(c)) return "tonal";
  if (/elevated|shadow/.test(c)) return "elevated";
  if (/ghost/.test(c)) return "text";
  return "filled";
}

let yOffset = 0;
const groups = [];

for (const section of sections) {
  const items = [];
  const tag = section.tag || "div";
  const cls = (section.className || "").slice(0, 80);
  const heading = section.heading || "";
  const elements = section.elements || [];

  // Skip empty sections and script-only sections
  if (elements.length === 0) continue;
  if (["script", "style", "noscript"].includes(tag)) continue;

  // Add heading if present
  if (heading) {
    items.push({
      id: uid(),
      kind: "text",
      label: heading.slice(0, 100),
      icon: null,
      icon2: null,
      variant: "tonal",
      bold: true,
      _note: `<${tag}> heading: ${heading.slice(0, 80)}`,
    });
  }

  // Add elements
  for (const el of elements) {
    const text = (el.text || "").trim();
    if (!text || text.length < 2) continue;
    if (text.length > 120) {
      el.text = text.slice(0, 117) + "…";
    }

    const kind = roleToKind(el.role, el.tag);
    const isHeading = el.role === "heading" && heading && el.text === heading;

    // Skip duplicate heading
    if (isHeading) continue;

    items.push({
      id: uid(),
      kind,
      label: el.text.slice(0, 100),
      icon: el.role === "link" ? "open_in_new" : el.role === "button" ? "touch_app" : null,
      icon2: null,
      variant: getVariant(el.classes),
      bold: el.role === "heading",
      _note: `<${el.tag || "?"} class="${(el.classes || "").slice(0, 60)}"> [${el.role}]`,
    });
  }

  if (items.length === 0) continue;

  groups.push({
    id: uid(),
    x: 16,
    y: yOffset,
    axis: "y",
    items,
    _section: `<${tag}> .${cls.split(/\s+/)[0] || ""}`,
    _note: `Source: <${tag} class="${cls}">`,
  });

  yOffset += items.length * 56 + 40;
}

// Build template
const hostname = data.url ? new URL(data.url).hostname.replace("www.", "") : "unknown";
const template = {
  key: `imported-${hostname.replace(/\./g, "-")}`,
  name: `${hostname} — 导入页面`,
  description: `从 ${data.url || hostname} 导入的真实页面结构，${groups.length} 个区块，共 ${groups.reduce((s, g) => s + g.items.length, 0)} 个元素`,
  category: "page",
  projectKey,
  icon: "📥",
  groups,
  tags: ["imported", hostname, "real-page"],
};

fs.writeFileSync(output, JSON.stringify(template, null, 2));
console.log(`✅ ${hostname}: ${groups.length} sections, ${template.description.match(/共 (\d+)/)?.[1] || "?"} elements → ${output}`);
