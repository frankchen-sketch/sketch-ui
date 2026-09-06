/**
 * Inspector overlay — hover highlight and selection indicators.
 * Based on VisBug's overlay pattern (DOM overlay with positioned divs).
 * Zero dependencies, ~100 lines.
 */

import { ElementInfo, deepElementFromPoint, isOverlayElement, getElementInfo } from "./core";

/* ---------- Hover overlay ---------- */

let hoverOverlay: HTMLDivElement | null = null;
let hoverLabel: HTMLDivElement | null = null;

function ensureHoverOverlay() {
  if (hoverOverlay) return;

  hoverOverlay = document.createElement('div');
  hoverOverlay.setAttribute('data-inspector-overlay', 'hover');
  hoverOverlay.style.cssText = `
    position: fixed; pointer-events: none; z-index: 2147483646;
    border: 2px solid #4f46e5; background: rgba(79, 70, 229, 0.08);
    transition: all 0.08s ease; display: none;
    border-radius: 2px;
  `;
  document.body.appendChild(hoverOverlay);

  hoverLabel = document.createElement('div');
  hoverLabel.setAttribute('data-inspector-overlay', 'hover-label');
  hoverLabel.style.cssText = `
    position: fixed; z-index: 2147483647; pointer-events: none;
    background: #4f46e5; color: white;
    padding: 3px 8px; border-radius: 4px;
    font: 11px/1.4 -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    max-width: 280px; word-break: break-all;
    box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    display: none;
  `;
  document.body.appendChild(hoverLabel);
}

export function showHover(el: Element) {
  ensureHoverOverlay();

  const rect = el.getBoundingClientRect();
  if (hoverOverlay) {
    hoverOverlay.style.left = `${rect.left}px`;
    hoverOverlay.style.top = `${rect.top}px`;
    hoverOverlay.style.width = `${rect.width}px`;
    hoverOverlay.style.height = `${rect.height}px`;
    hoverOverlay.style.display = 'block';
  }

  if (hoverLabel) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const cls = (el.className && typeof el.className === 'string')
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';
    hoverLabel.textContent = `${tag}${id}${cls}`;
    hoverLabel.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
    hoverLabel.style.top = `${rect.top - 26}px`;
    hoverLabel.style.display = 'block';
  }
}

export function hideHover() {
  if (hoverOverlay) hoverOverlay.style.display = 'none';
  if (hoverLabel) hoverLabel.style.display = 'none';
}

/* ---------- Selection overlay ---------- */

let selectOverlay: HTMLDivElement | null = null;
let selectLabel: HTMLDivElement | null = null;

function ensureSelectOverlay() {
  if (selectOverlay) return;

  selectOverlay = document.createElement('div');
  selectOverlay.setAttribute('data-inspector-overlay', 'select');
  selectOverlay.style.cssText = `
    position: fixed; pointer-events: none; z-index: 2147483645;
    border: 2px solid #7c3aed; background: rgba(124, 58, 237, 0.1);
    display: none; border-radius: 2px;
  `;
  document.body.appendChild(selectOverlay);

  selectLabel = document.createElement('div');
  selectLabel.setAttribute('data-inspector-overlay', 'select-label');
  selectLabel.style.cssText = `
    position: fixed; z-index: 2147483647; pointer-events: none;
    background: #7c3aed; color: white;
    padding: 4px 10px; border-radius: 4px;
    font: 11px/1.4 -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    max-width: 300px; word-break: break-all;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: none;
  `;
  document.body.appendChild(selectLabel);
}

export function showSelect(info: ElementInfo) {
  ensureSelectOverlay();

  if (selectOverlay) {
    selectOverlay.style.left = `${info.rect.x}px`;
    selectOverlay.style.top = `${info.rect.y}px`;
    selectOverlay.style.width = `${info.rect.w}px`;
    selectOverlay.style.height = `${info.rect.h}px`;
    selectOverlay.style.display = 'block';
  }

  if (selectLabel) {
    const label = `<${info.tag}>` +
      (info.id ? ` #${info.id}` : '') +
      (info.classes.length ? ` .${info.classes.slice(0, 2).join('.')}` : '');
    selectLabel.textContent = label;
    selectLabel.style.left = `${Math.min(info.rect.x, window.innerWidth - 320)}px`;
    selectLabel.style.top = `${info.rect.y - 28}px`;
    selectLabel.style.display = 'block';
  }
}

export function hideSelect() {
  if (selectOverlay) selectOverlay.style.display = 'none';
  if (selectLabel) selectLabel.style.display = 'none';
}

/* ---------- Cleanup ---------- */

export function destroyOverlays() {
  hoverOverlay?.remove();
  hoverLabel?.remove();
  selectOverlay?.remove();
  selectLabel?.remove();
  hoverOverlay = null;
  hoverLabel = null;
  selectOverlay = null;
  selectLabel = null;
}

/* ---------- Event wiring ---------- */

type InspectorCallback = {
  onHover?: (info: ElementInfo | null) => void;
  onSelect?: (info: ElementInfo) => void;
  onDeselect?: () => void;
};

let cleanupFn: (() => void) | null = null;

/** Start the inspector on the current page */
export function startInspector(callbacks: InspectorCallback): () => void {
  // Clean up any previous instance
  if (cleanupFn) cleanupFn();

  const onMouseMove = (e: MouseEvent) => {
    const el = deepElementFromPoint(e.clientX, e.clientY);
    if (!el || isOverlayElement(el)) {
      hideHover();
      callbacks.onHover?.(null);
      return;
    }
    showHover(el);
    callbacks.onHover?.(getElementInfo(el));
  };

  const onClick = (e: MouseEvent) => {
    const el = deepElementFromPoint(e.clientX, e.clientY);
    if (!el || isOverlayElement(el)) return;

    e.preventDefault();
    e.stopPropagation();

    const info = getElementInfo(el);
    showSelect(info);
    callbacks.onSelect?.(info);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideSelect();
      hideHover();
      callbacks.onDeselect?.();
    }
  };

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);

  cleanupFn = () => {
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    destroyOverlays();
    cleanupFn = null;
  };

  return cleanupFn;
}

/** Stop the inspector */
export function stopInspector() {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
}
