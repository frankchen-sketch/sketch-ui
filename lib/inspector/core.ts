/**
 * Element inspector core — extracted patterns from VisBug (Apache-2.0).
 * Pure DOM operations, zero dependencies, ~150 lines.
 *
 * Provides: element lookup, CSS selector generation, style reading.
 */

/* ---------- Element lookup ---------- */

/** Shadow DOM-aware elementFromPoint (from VisBug app/utilities/common.js) */
export function deepElementFromPoint(x: number, y: number): Element | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  const crawlShadows = (node: Element): Element => {
    if (node.shadowRoot) {
      const potential = node.shadowRoot.elementFromPoint(x, y);
      if (potential === node) return node;
      if (potential?.shadowRoot) return crawlShadows(potential);
      return potential || node;
    }
    return node;
  };

  return crawlShadows(el);
}

/** Check if element belongs to our own overlay UI */
export function isOverlayElement(el: Element | null): boolean {
  if (!el) return true;
  return !!el.closest('[data-inspector-overlay]');
}

/* ---------- CSS Selector generation ---------- */

/** Generate a concise, unique CSS selector for an element */
export function generateSelector(el: Element): string {
  // ID-based selector (shortest, most specific)
  if (el.id) return `#${el.id}`;

  const tag = el.tagName.toLowerCase();
  const classes = getClassList(el);

  // Try tag + classes
  if (classes.length > 0) {
    const selector = `${tag}.${classes.slice(0, 3).join('.')}`;
    // Check if it's unique enough
    try {
      const matches = document.querySelectorAll(selector);
      if (matches.length === 1) return selector;
    } catch {}
  }

  // Build path with nth-of-type
  const path: string[] = [];
  let current: Element | null = el;
  while (current && current.nodeType === 1 && path.length < 4) {
    let step = current.tagName.toLowerCase();

    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    }

    const cls = getClassList(current);
    if (cls.length > 0) step += `.${cls.slice(0, 2).join('.')}`;

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
      if (siblings.length > 1) {
        const idx = siblings.indexOf(current) + 1;
        step += `:nth-of-type(${idx})`;
      }
    }

    path.unshift(step);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/** Get meaningful class names (filter out utility hashes, data attributes) */
function getClassList(el: Element): string[] {
  const cls = el.className;
  if (!cls || typeof cls !== 'string') return [];

  return cls
    .trim()
    .split(/\s+/)
    .filter((c) => {
      if (c.length < 2 || c.length > 40) return false;
      if (/^[a-z0-9]{6,}$/i.test(c)) return false; // hash-like
      if (/^_/.test(c)) return false; // CSS modules
      if (/^(data-|aria-)/.test(c)) return false;
      return true;
    })
    .slice(0, 5);
}

/* ---------- Style reading ---------- */

/** CSS properties we care about (from VisBug app/utilities/design-properties.js) */
const DESIRED_PROPS: Record<string, string> = {
  color: 'rgb(0, 0, 0)',
  backgroundColor: 'rgba(0, 0, 0, 0)',
  backgroundImage: 'none',
  borderRadius: '0px',
  boxShadow: 'none',
  padding: '0px',
  margin: '0px',
  fontFamily: 'auto',
  fontSize: '16px',
  fontWeight: '400',
  textAlign: 'start',
  textTransform: 'none',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  display: 'block',
  alignItems: 'normal',
  justifyContent: 'normal',
  flexDirection: 'row',
  gap: 'normal',
  opacity: '1',
  position: 'static',
  width: 'auto',
  height: 'auto',
  overflow: 'visible',
};

/** Read non-default computed styles (from VisBug app/utilities/styles.js) */
export function getStyles(el: Element): { prop: string; value: string }[] {
  const computed = window.getComputedStyle(el);
  const result: { prop: string; value: string }[] = [];

  for (const [prop, defaultValue] of Object.entries(DESIRED_PROPS)) {
    const value = computed.getPropertyValue(prop);
    if (value && value !== defaultValue) {
      result.push({ prop, value });
    }
  }

  // Check borders
  const bw = computed.getPropertyValue('border-width');
  if (bw && bw !== '0px') {
    result.push({ prop: 'borderWidth', value: bw });
    result.push({ prop: 'borderColor', value: computed.getPropertyValue('border-color') });
    result.push({ prop: 'borderStyle', value: computed.getPropertyValue('border-style') });
  }

  return result.sort((a, b) => a.prop.localeCompare(b.prop));
}

/* ---------- Element info ---------- */

export interface ElementInfo {
  tag: string;
  id: string;
  classes: string[];
  text: string;
  selector: string;
  rect: { x: number; y: number; w: number; h: number };
  styles: { prop: string; value: string }[];
  parentTag: string;
  parentClasses: string[];
  xpath: string;
}

/** Extract full info about an element */
export function getElementInfo(el: Element): ElementInfo {
  const rect = el.getBoundingClientRect();
  const text = (el as HTMLElement).innerText || el.textContent || '';

  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    classes: getClassList(el),
    text: text.trim().slice(0, 150),
    selector: generateSelector(el),
    rect: {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    },
    styles: getStyles(el),
    parentTag: el.parentElement?.tagName?.toLowerCase() || '',
    parentClasses: getClassList(el.parentElement || document.body),
    xpath: getXPath(el),
  };
}

/** Generate XPath for an element */
function getXPath(el: Element): string {
  if (el.id) return `//*[@id="${el.id}"]`;

  const path: string[] = [];
  let current: Element | null = el;
  while (current && current.nodeType === 1 && path.length < 5) {
    let idx = 1;
    let sib = current.previousElementSibling;
    while (sib) {
      if (sib.tagName === current.tagName) idx++;
      sib = sib.previousElementSibling;
    }
    path.unshift(`${current.tagName.toLowerCase()}[${idx}]`);
    current = current.parentElement;
  }
  return `/${path.join('/')}`;
}
