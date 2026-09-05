"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Palette } from "@/lib/tokens";

interface SelectedElement {
  tag: string;
  id: string;
  classes: string[];
  text: string;
  cssSelector: string;
  xpath: string;
  rect: { x: number; y: number; w: number; h: number };
  parentTag: string;
  parentClasses: string[];
}

interface Change {
  element: SelectedElement;
  description: string;
  timestamp: number;
}

interface VisualEditorProps {
  palette: Palette;
  projectKey: string | null;
  onGeneratePrompt: (changes: Change[], url: string) => void;
}

const INJECT_SCRIPT = `
(function() {
  if (window.__sketchUIInjected) return;
  window.__sketchUIInjected = true;

  let selectedEl = null;
  let overlay = null;
  let label = null;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #6750A4;background:rgba(103,80,164,0.1);transition:all 0.1s ease;';
    document.body.appendChild(overlay);

    label = document.createElement('div');
    label.style.cssText = 'position:fixed;z-index:2147483647;background:#6750A4;color:white;padding:4px 8px;border-radius:4px;font:12px/1.4 system-ui;pointer-events:none;max-width:300px;word-break:break-all;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
    document.body.appendChild(label);
  }

  function getCssSelector(el) {
    if (el.id) return '#' + el.id;
    let path = [];
    while (el && el.nodeType === 1) {
      let selector = el.tagName.toLowerCase();
      if (el.id) { path.unshift('#' + el.id); break; }
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\\s+/).filter(c => !c.startsWith('__') && c.length < 30).slice(0, 2).join('.');
        if (cls) selector += '.' + cls;
      }
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
        if (siblings.length > 1) {
          const idx = siblings.indexOf(el) + 1;
          selector += ':nth-of-type(' + idx + ')';
        }
      }
      path.unshift(selector);
      el = el.parentElement;
      if (path.length >= 4) break;
    }
    return path.join(' > ');
  }

  function getXPath(el) {
    if (el.id) return '//*[@id="' + el.id + '"]';
    let path = [];
    while (el && el.nodeType === 1) {
      let idx = 1;
      let sib = el.previousSibling;
      while (sib) { if (sib.nodeType === 1 && sib.tagName === el.tagName) idx++; sib = sib.previousSibling; }
      path.unshift(el.tagName.toLowerCase() + '[' + idx + ']');
      el = el.parentElement;
      if (path.length >= 5) break;
    }
    return '/' + path.join('/');
  }

  function getElementInfo(el) {
    const rect = el.getBoundingClientRect();
    const text = (el.innerText || el.textContent || '').trim().slice(0, 120);
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      classes: (el.className || '').toString().trim().split(/\\s+/).filter(Boolean).slice(0, 8),
      text: text,
      cssSelector: getCssSelector(el),
      xpath: getXPath(el),
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      parentTag: el.parentElement?.tagName?.toLowerCase() || '',
      parentClasses: (el.parentElement?.className || '').toString().trim().split(/\\s+/).filter(Boolean).slice(0, 4),
    };
  }

  function highlight(el) {
    if (!overlay) createOverlay();
    const rect = el.getBoundingClientRect();
    overlay.style.left = rect.left + 'px';
    overlay.style.top = rect.top + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.display = 'block';

    const info = getElementInfo(el);
    const tag = info.tag + (info.id ? '#' + info.id : '') + (info.classes.length ? '.' + info.classes.slice(0, 2).join('.') : '');
    const preview = info.text.slice(0, 50) + (info.text.length > 50 ? '…' : '');
    label.textContent = tag + (preview ? ' — ' + preview : '');
    label.style.left = Math.min(rect.left, window.innerWidth - 320) + 'px';
    label.style.top = (rect.top - 30) + 'px';
    label.style.display = 'block';
  }

  function hideOverlay() {
    if (overlay) overlay.style.display = 'none';
    if (label) label.style.display = 'none';
  }

  // Hover: highlight
  document.addEventListener('mouseover', function(e) {
    if (e.target === overlay || e.target === label) return;
    if (e.target.closest('[data-sketch-ui]')) return;
    highlight(e.target);
  }, true);

  document.addEventListener('mouseout', function(e) {
    if (e.target === overlay || e.target === label) return;
    hideOverlay();
  }, true);

  // Click: select element and send to parent
  document.addEventListener('click', function(e) {
    if (e.target === overlay || e.target === label) return;
    if (e.target.closest('[data-sketch-ui]')) return;

    e.preventDefault();
    e.stopPropagation();

    selectedEl = e.target;
    highlight(selectedEl);

    const info = getElementInfo(selectedEl);
    window.parent.postMessage({ type: 'sketch-ui-element-selected', element: info }, '*');
  }, true);

  // Escape to deselect
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      selectedEl = null;
      hideOverlay();
      window.parent.postMessage({ type: 'sketch-ui-element-deselected' }, '*');
    }
  }, true);
})();
`;

export function VisualEditor({ palette: p, projectKey, onGeneratePrompt }: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [url, setUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [changeDesc, setChangeDesc] = useState("");
  const [showHelp, setShowHelp] = useState(true);

  // Preset URLs
  const presetUrls: Record<string, { label: string; url: string }> = {
    furriq: { label: "Furriq (localhost:3000)", url: "http://localhost:3000" },
    gridpaw: { label: "GridPaw (localhost:4321)", url: "http://localhost:4321" },
  };

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "sketch-ui-element-selected") {
        setSelectedElement(e.data.element);
        setShowHelp(false);
      } else if (e.data?.type === "sketch-ui-element-deselected") {
        setSelectedElement(null);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Inject script when iframe loads
  const handleIframeLoad = useCallback(() => {
    setLoaded(true);
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        (iframe.contentWindow as any).eval(INJECT_SCRIPT);
      }
    } catch (e) {
      console.log("Could not inject script (cross-origin):", e);
    }
  }, []);

  const loadUrl = () => {
    if (!url.trim()) return;
    setLoaded(false);
    setSelectedElement(null);
    // For localhost URLs, we need the user to ensure CORS allows iframe
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = url.trim();
    }
  };

  const addChange = () => {
    if (!selectedElement || !changeDesc.trim()) return;
    const change: Change = {
      element: selectedElement,
      description: changeDesc.trim(),
      timestamp: Date.now(),
    };
    setChanges((prev) => [...prev, change]);
    setChangeDesc("");
    setSelectedElement(null);
  };

  const removeChange = (idx: number) => {
    setChanges((prev) => prev.filter((_, i) => i !== idx));
  };

  const generatePrompt = () => {
    if (changes.length === 0) return;
    onGeneratePrompt(changes, url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* URL bar */}
      <div style={{ padding: "8px 8px 4px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="输入页面 URL（如 http://localhost:3000）"
            style={{
              flex: 1,
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${p.outlineVariant}`,
              background: p.surfaceContainerLow,
              color: p.onSurface,
              fontSize: 12,
              outline: "none",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => e.key === "Enter" && loadUrl()}
          />
          <button
            onClick={loadUrl}
            disabled={!url.trim()}
            className="m3-press"
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: url.trim() ? p.primary : p.surfaceContainerHighest,
              color: url.trim() ? p.onPrimary : p.onSurfaceVariant,
              fontSize: 12,
              fontWeight: 600,
              cursor: url.trim() ? "pointer" : "default",
            }}
          >
            加载
          </button>
        </div>

        {/* Quick preset URLs */}
        {projectKey && presetUrls[projectKey] && (
          <button
            onClick={() => { setUrl(presetUrls[projectKey].url); }}
            className="m3-press"
            style={{
              marginTop: 4,
              padding: "4px 8px",
              borderRadius: 6,
              border: `1px solid ${p.outlineVariant}`,
              background: "transparent",
              color: p.primary,
              fontSize: 11,
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            ⚡ {presetUrls[projectKey].label}
          </button>
        )}
      </div>

      {/* Iframe */}
      <div style={{ flex: 1, position: "relative", background: p.surfaceContainerHighest }}>
        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: p.onSurfaceVariant,
              fontSize: 13,
              textAlign: "center",
              padding: 20,
            }}
          >
            {url ? "加载中..." : "输入 URL 并点击加载，然后点击页面元素选中它"}
          </div>
        )}
        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: loaded ? "block" : "none",
          }}
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>

      {/* Selected element info */}
      {selectedElement && (
        <div
          style={{
            padding: "6px 8px",
            borderTop: `1px solid ${p.outlineVariant}`,
            background: p.primaryContainer,
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: p.onPrimaryContainer, marginBottom: 4 }}>
            选中元素
          </div>
          <div style={{ fontSize: 10, color: p.onPrimaryContainer, fontFamily: "monospace", lineHeight: 1.4 }}>
            {`<${selectedElement.tag}>`}{selectedElement.id ? ` #${selectedElement.id}` : ""}{selectedElement.classes.length ? ` .${selectedElement.classes.slice(0, 3).join(".")}` : ""}
          </div>
          {selectedElement.text && (
            <div style={{ fontSize: 10, color: p.onPrimaryContainer, marginTop: 2, opacity: 0.8 }}>
              "{selectedElement.text.slice(0, 60)}{selectedElement.text.length > 60 ? "…" : ""}"
            </div>
          )}
          <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
            <input
              value={changeDesc}
              onChange={(e) => setChangeDesc(e.target.value)}
              placeholder="描述要做的修改..."
              style={{
                flex: 1,
                padding: "4px 8px",
                borderRadius: 6,
                border: `1px solid ${p.outlineVariant}`,
                background: p.surface,
                color: p.onSurface,
                fontSize: 11,
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && addChange()}
            />
            <button
              onClick={addChange}
              disabled={!changeDesc.trim()}
              className="m3-press"
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                background: changeDesc.trim() ? p.primary : p.surfaceContainerHighest,
                color: changeDesc.trim() ? p.onPrimary : p.onSurfaceVariant,
                fontSize: 11,
                fontWeight: 600,
                cursor: changeDesc.trim() ? "pointer" : "default",
              }}
            >
              添加
            </button>
          </div>
        </div>
      )}

      {/* Changes list */}
      {changes.length > 0 && (
        <div
          style={{
            padding: "6px 8px",
            borderTop: `1px solid ${p.outlineVariant}`,
            background: p.surfaceContainerLow,
            flexShrink: 0,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: p.onSurfaceVariant, marginBottom: 4 }}>
            已标记 {changes.length} 处修改
          </div>
          {changes.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 0",
                fontSize: 10,
                color: p.onSurface,
                borderBottom: `1px solid ${p.outlineVariant}`,
              }}
            >
              <span style={{ fontFamily: "monospace", color: p.primary, flexShrink: 0 }}>
                {`<${c.element.tag}>`}
              </span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.description}
              </span>
              <button
                onClick={() => removeChange(i)}
                style={{
                  border: "none",
                  background: "none",
                  color: p.error,
                  cursor: "pointer",
                  fontSize: 14,
                  padding: "0 2px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={generatePrompt}
            className="m3-press"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              background: p.primary,
              color: p.onPrimary,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            生成修改 Prompt ({changes.length} 处)
          </button>
        </div>
      )}

      {/* Help text */}
      {showHelp && !selectedElement && changes.length === 0 && (
        <div
          style={{
            padding: "8px",
            fontSize: 10,
            color: p.onSurfaceVariant,
            lineHeight: 1.5,
            textAlign: "center",
            borderTop: `1px solid ${p.outlineVariant}`,
          }}
        >
          💡 加载页面后，鼠标悬停高亮元素，点击选中，描述修改，最后生成 prompt
        </div>
      )}
    </div>
  );
}
