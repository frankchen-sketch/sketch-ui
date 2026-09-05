import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
const { JSDOM } = require('/Users/frankchen/workspace/m3e-canvas/node_modules/jsdom');

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'PATH', 'NOSCRIPT', 'IFRAME', 'META', 'LINK']);
const CONTAINER_TAGS = new Set(['SECTION', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'ASIDE', 'ARTICLE', 'FORM']);
const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
const DECORATIVE_CLASSES = ['absolute', 'fixed', 'z-', 'pointer-events-none', 'sr-only', 'visually-hidden', 'overflow-hidden'];

function isDecorative(el) {
  const cls = el.getAttribute('class') || '';
  return DECORATIVE_CLASSES.some(d => cls.includes(d));
}

function getText(el, maxLen = 80) {
  const text = el.textContent?.trim().replace(/\s+/g, ' ') || '';
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

function getRole(el) {
  const tag = el.tagName;
  if (HEADING_TAGS.has(tag)) return 'heading';
  if (tag === 'BUTTON' || el.getAttribute('role') === 'button') return 'button';
  if (tag === 'A') return 'link';
  if (tag === 'IMG') return 'image';
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return 'input';
  if (tag === 'P') return 'text';
  if (tag === 'SPAN' || tag === 'DIV') return 'container';
  return 'container';
}

function getImportance(role) {
  const map = { heading: 10, button: 8, link: 7, input: 6, image: 5, text: 4, container: 1 };
  return map[role] || 1;
}

function getClasses(el, max = 5) {
  const cls = el.getAttribute('class');
  if (!cls) return [];
  return cls.trim().split(/\s+/).slice(0, max);
}

function extractElements(section) {
  const elements = [];
  const walker = (el, depth) => {
    if (depth > 6) return;
    if (SKIP_TAGS.has(el.tagName) || isDecorative(el)) return;

    const role = getRole(el);
    const text = getText(el);

    // Only include elements that are meaningful (have text, are semantic, or are structural)
    if (CONTAINER_TAGS.has(el.tagName) && el !== section) {
      // Don't double-count containers that are themselves sections
      if (HEADING_TAGS.has(el.tagName) || el.tagName === 'BUTTON' || el.tagName === 'A' || text) {
        elements.push({
          tag: el.tagName.toLowerCase(),
          text: text || undefined,
          role,
          classes: getClasses(el),
          importance: getImportance(role),
        });
      }
    } else if (HEADING_TAGS.has(el.tagName) || el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'IMG' || el.tagName === 'P') {
      elements.push({
        tag: el.tagName.toLowerCase(),
        text: text || undefined,
        role,
        classes: getClasses(el),
        importance: getImportance(role),
      });
    } else if (text && text.length > 2 && (el.tagName === 'SPAN' || el.tagName === 'LI' || el.tagName === 'LABEL')) {
      elements.push({
        tag: el.tagName.toLowerCase(),
        text: text,
        role,
        classes: getClasses(el),
        importance: getImportance(role),
      });
    }

    for (const child of el.children) {
      walker(child, depth + 1);
    }
  };
  walker(section, 0);
  // Deduplicate by text+role and sort by importance
  const seen = new Set();
  return elements
    .filter(e => {
      const key = `${e.role}:${e.text || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 20); // cap per section
}

function parseHTML(html, source) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Find top-level semantic sections
  const sectionSelectors = ['header', 'nav', 'main', 'section', 'footer', 'aside', 'article'];
  const found = new Set();
  const sections = [];

  // First pass: collect direct semantic containers
  for (const sel of sectionSelectors) {
    for (const el of doc.querySelectorAll(sel)) {
      if (!found.has(el)) {
        found.add(el);
        const heading = el.querySelector('h1, h2, h3');
        sections.push({
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          className: getClasses(el, 5).join(' ') || undefined,
          heading: heading ? getText(heading) : undefined,
          elements: extractElements(el),
        });
      }
    }
  }

  // Also find divs with section-like roles or IDs
  for (const div of doc.querySelectorAll('div[id], div[role]')) {
    const id = div.id;
    const role = div.getAttribute('role');
    if ((id && /hero|banner|cta|feature|testimonial|pricing|faq|footer|header|nav|about|how|step|benefit|gallery|grid/i.test(id)) ||
        (role && /banner|navigation|main|contentinfo|region|complementary/i.test(role))) {
      if (!found.has(div)) {
        found.add(div);
        const heading = div.querySelector('h1, h2, h3');
        sections.push({
          tag: 'div',
          id: id || undefined,
          className: getClasses(div, 5).join(' ') || undefined,
          heading: heading ? getText(heading) : undefined,
          elements: extractElements(div),
        });
      }
    }
  }

  return {
    source,
    url: `https://${source}/`,
    parsedAt: new Date().toISOString(),
    totalSections: sections.length,
    sections,
  };
}

// Parse both sites
const furriqHTML = readFileSync('/tmp/furriq-home.html', 'utf-8');
const gridpawHTML = readFileSync('/tmp/gridpaw-home.html', 'utf-8');

const furriqResult = parseHTML(furriqHTML, 'furriq.com');
const gridpawResult = parseHTML(gridpawHTML, 'gridpaw.com');

writeFileSync('/tmp/furriq-structure.json', JSON.stringify(furriqResult, null, 2));
writeFileSync('/tmp/gridpaw-structure.json', JSON.stringify(gridpawResult, null, 2));

console.log(`furriq.com: ${furriqResult.totalSections} sections`);
console.log(`gridpaw.com: ${gridpawResult.totalSections} sections`);
