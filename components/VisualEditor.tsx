"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ElementInfo } from "@/lib/inspector/core";
import { startInspector, stopInspector } from "@/lib/inspector/overlay";
import { InspectorPanel } from "./InspectorPanel";

interface Change {
  id: number;
  element: ElementInfo;
  description: string;
}

interface VisualEditorProps {
  pageUrl: string;
  onBack: () => void;
}

export function VisualEditor({ pageUrl, onBack }: VisualEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState<ElementInfo | null>(null);
  const [selected, setSelected] = useState<ElementInfo | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const nextIdRef = useRef(1);

  // Inject inspector into iframe when loaded
  const handleIframeLoad = useCallback(() => {
    setLoaded(true);
    setIframeError(null);

    try {
      const iframe = iframeRef.current;
      const doc = iframe?.contentDocument;
      if (!doc) {
        setIframeError("无法访问 iframe 内容（跨域限制）。请确保通过代理加载。");
        return;
      }

      // Inject the inspector script into the iframe
      const script = doc.createElement('script');
      script.textContent = `
        (function() {
          if (window.__inspectorInjected) return;
          window.__inspectorInjected = true;

          function deepElementFromPoint(x, y) {
            var el = document.elementFromPoint(x, y);
            if (!el) return null;
            function crawlShadows(node) {
              if (node.shadowRoot) {
                var potential = node.shadowRoot.elementFromPoint(x, y);
                if (potential === node) return node;
                if (potential && potential.shadowRoot) return crawlShadows(potential);
                return potential || node;
              }
              return node;
            }
            return crawlShadows(el);
          }

          function isOverlay(el) {
            return el && el.getAttribute && el.getAttribute('data-inspector-overlay');
          }

          function getClassList(el) {
            var cls = el.className;
            if (!cls || typeof cls !== 'string') return [];
            return cls.trim().split(/\\s+/).filter(function(c) {
              return c.length >= 2 && c.length <= 40 && !/^_/.test(c) && !/^[a-z0-9]{6,}$/i.test(c);
            }).slice(0, 5);
          }

          function generateSelector(el) {
            if (el.id) return '#' + el.id;
            var tag = el.tagName.toLowerCase();
            var classes = getClassList(el);
            if (classes.length > 0) return tag + '.' + classes.slice(0, 3).join('.');
            return tag;
          }

          var DESIRED_PROPS = {
            color: 'rgb(0, 0, 0)', backgroundColor: 'rgba(0, 0, 0, 0)',
            fontSize: '16px', fontWeight: '400', display: 'block',
            padding: '0px', margin: '0px', borderRadius: '0px',
            fontFamily: 'auto', opacity: '1', position: 'static',
          };

          function getStyles(el) {
            var computed = window.getComputedStyle(el);
            var result = [];
            for (var prop in DESIRED_PROPS) {
              var value = computed.getPropertyValue(prop);
              if (value && value !== DESIRED_PROPS[prop]) {
                result.push({ prop: prop, value: value });
              }
            }
            return result.sort(function(a, b) { return a.prop.localeCompare(b.prop); });
          }

          function getElementInfo(el) {
            var rect = el.getBoundingClientRect();
            var text = el.innerText || el.textContent || '';
            return {
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              classes: getClassList(el),
              text: text.trim().slice(0, 150),
              selector: generateSelector(el),
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
              styles: getStyles(el),
              parentTag: el.parentElement ? el.parentElement.tagName.toLowerCase() : '',
              parentClasses: getClassList(el.parentElement || document.body),
            };
          }

          // Overlays
          var hoverOverlay = document.createElement('div');
          hoverOverlay.setAttribute('data-inspector-overlay', 'hover');
          hoverOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #4f46e5;background:rgba(79,70,229,0.08);transition:all 0.08s ease;display:none;border-radius:2px;';
          document.body.appendChild(hoverOverlay);

          var hoverLabel = document.createElement('div');
          hoverLabel.setAttribute('data-inspector-overlay', 'hover-label');
          hoverLabel.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;background:#4f46e5;color:white;padding:3px 8px;border-radius:4px;font:11px/1.4 system-ui,sans-serif;max-width:280px;word-break:break-all;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:none;';
          document.body.appendChild(hoverLabel);

          var selectOverlay = document.createElement('div');
          selectOverlay.setAttribute('data-inspector-overlay', 'select');
          selectOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483645;border:2px solid #7c3aed;background:rgba(124,58,237,0.1);display:none;border-radius:2px;';
          document.body.appendChild(selectOverlay);

          function showHover(el) {
            var rect = el.getBoundingClientRect();
            hoverOverlay.style.left = rect.left + 'px';
            hoverOverlay.style.top = rect.top + 'px';
            hoverOverlay.style.width = rect.width + 'px';
            hoverOverlay.style.height = rect.height + 'px';
            hoverOverlay.style.display = 'block';
            var tag = el.tagName.toLowerCase();
            var id = el.id ? '#' + el.id : '';
            var cls = (el.className && typeof el.className === 'string') ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
            hoverLabel.textContent = tag + id + cls;
            hoverLabel.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
            hoverLabel.style.top = (rect.top - 26) + 'px';
            hoverLabel.style.display = 'block';
          }

          function hideHover() {
            hoverOverlay.style.display = 'none';
            hoverLabel.style.display = 'none';
          }

          function showSelect(info) {
            selectOverlay.style.left = info.rect.x + 'px';
            selectOverlay.style.top = info.rect.y + 'px';
            selectOverlay.style.width = info.rect.w + 'px';
            selectOverlay.style.height = info.rect.h + 'px';
            selectOverlay.style.display = 'block';
          }

          document.addEventListener('mousemove', function(e) {
            var el = deepElementFromPoint(e.clientX, e.clientY);
            if (!el || isOverlay(el)) { hideHover(); return; }
            showHover(el);
            window.parent.postMessage({ type: 'inspector-hover', element: getElementInfo(el) }, '*');
          }, true);

          document.addEventListener('click', function(e) {
            var el = deepElementFromPoint(e.clientX, e.clientY);
            if (!el || isOverlay(el)) return;
            e.preventDefault();
            e.stopPropagation();
            var info = getElementInfo(el);
            showSelect(info);
            window.parent.postMessage({ type: 'inspector-select', element: info }, '*');
          }, true);

          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
              hideHover();
              selectOverlay.style.display = 'none';
              window.parent.postMessage({ type: 'inspector-deselect' }, '*');
            }
          }, true);

          // Remove common intro/loading overlays
          function removeOverlays() {
            var allDivs = document.querySelectorAll('div')
            for (var i = allDivs.length - 1; i >= 0; i--) {
              var div = allDivs[i]
              var text = div.textContent || ''
              var computed = window.getComputedStyle(div)
              var pos = computed.position
              var z = parseInt(computed.zIndex) || 0
              // Match overlays: fixed/absolute, high z-index, contains "Loading" or "Skip Intro"
              if ((pos === 'fixed' || pos === 'absolute') && z > 50) {
                if (text.includes('Loading') || text.includes('Skip Intro') || text.includes('跳过')) {
                  div.remove()
                }
              }
            }
          }
          // Run immediately and after a delay (for late-rendered overlays)
          removeOverlays()
          setTimeout(removeOverlays, 1000)
          setTimeout(removeOverlays, 3000)

          window.parent.postMessage({ type: 'inspector-ready' }, '*');
        })();
      `;
      doc.head.appendChild(script);
    } catch (e) {
      setIframeError("注入检查器失败: " + String(e));
    }
  }, []);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'inspector-hover') {
        setHovered(e.data.element);
      } else if (e.data?.type === 'inspector-select') {
        setSelected(e.data.element);
      } else if (e.data?.type === 'inspector-deselect') {
        setSelected(null);
      } else if (e.data?.type === 'inspector-ready') {
        setIframeError(null);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const addChange = (element: ElementInfo, description: string) => {
    setChanges((prev) => [...prev, { id: nextIdRef.current++, element, description }]);
    setSelected(null);
  };

  const removeChange = (id: number) => {
    setChanges((prev) => prev.filter((c) => c.id !== id));
  };

  const generatePrompt = () => {
    if (changes.length === 0) return;
    const lines: string[] = [];

    // Header
    lines.push(`# 修改请求`);
    lines.push("");
    if (pageUrl) {
      lines.push(`**页面:** ${pageUrl}`);
      // Extract domain for context
      try {
        const hostname = new URL(pageUrl).hostname.replace("www.", "");
        lines.push(`**站点:** ${hostname}`);
      } catch {}
    }
    lines.push(`**修改数量:** ${changes.length}`);
    lines.push("");

    // Infer page context from elements
    const headings = changes.filter(c => c.element.tag.match(/^h[1-3]$/));
    if (headings.length > 0) {
      lines.push(`**页面区域:** 围绕 "${headings[0].element.text?.slice(0, 40)}" 的区域`);
      lines.push("");
    }

    // Each change
    for (let i = 0; i < changes.length; i++) {
      const c = changes[i];
      const el = c.element;
      const tag = el.tag;
      const desc = c.description;

      // Infer operation type from description
      let operation = "修改";
      if (/删|去|移除|remove|delete|hide/i.test(desc)) operation = "删除";
      else if (/改|换|change|replace|update/i.test(desc)) operation = "修改";
      else if (/加|添|add|insert/i.test(desc)) operation = "新增";
      else if (/缩|短|shorten|trim/i.test(desc)) operation = "修改内容";

      lines.push(`### 修改 ${i + 1}: ${operation} ${tag} 元素`);
      lines.push("");

      // Element identification
      lines.push(`- **元素:** \`<${tag}>\``);
      lines.push(`- **CSS 选择器:** \`${el.selector}\``);
      if (el.id) lines.push(`- **ID:** #${el.id}`);
      if (el.classes.length > 0) lines.push(`- **类名:** .${el.classes.join(".")}`);

      // Current content
      if (el.text) {
        lines.push(`- **当前内容:** "${el.text.slice(0, 100)}"`);
      }

      // Current styles (only meaningful ones)
      const keyStyles = el.styles.filter(s =>
        ["color", "backgroundColor", "fontSize", "fontWeight", "display", "padding", "margin", "borderRadius"].includes(s.prop)
      );
      if (keyStyles.length > 0) {
        lines.push(`- **当前样式:** ${keyStyles.slice(0, 5).map(s => `${s.prop}: ${s.value}`).join(", ")}`);
      }

      // Position context
      lines.push(`- **位置:** (${el.rect.x}, ${el.rect.y}) ${el.rect.w}×${el.rect.h}px`);
      if (el.parentTag) {
        lines.push(`- **父元素:** <${el.parentTag}>${el.parentClasses.length ? ` .${el.parentClasses.slice(0, 2).join(".")}` : ""}`);
      }

      // Change description
      lines.push(`- **操作:** ${desc}`);

      // Add implementation hint based on operation
      if (operation === "删除") {
        lines.push(`- **提示:** 移除整个元素及其子元素，不要留空占位`);
      } else if (operation === "修改内容") {
        lines.push(`- **提示:** 只修改文本内容，保持所有样式和结构不变`);
      } else if (operation === "修改") {
        lines.push(`- **提示:** 修改后确保与周围元素风格一致`);
      }

      lines.push("");
    }

    // Footer
    lines.push(`---`);
    lines.push("");
    lines.push(`请逐个修改以上元素。修改前先定位到对应的源码文件，修改后确保页面整体风格一致。`);

    const result = lines.join("\n");
    setPrompt(result);
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Iframe area */}
      <div style={{ flex: 1, position: "relative", background: "#f0f0f0" }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            position: "absolute", left: 12, top: 12, zIndex: 100,
            padding: "6px 14px", borderRadius: 8, border: "none",
            background: "#4f46e5", color: "white", fontSize: 12,
            fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          ← 返回画布
        </button>

        {/* Loading / Error */}
        {!loaded && !iframeError && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#888", fontSize: 14 }}>
            加载 {pageUrl}...
          </div>
        )}
        {iframeError && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12, color: "#666", fontSize: 14, padding: 40, textAlign: "center",
          }}>
            <div style={{ fontSize: 48 }}>🔒</div>
            <div style={{ fontWeight: 600, color: "#333" }}>{iframeError}</div>
            <div style={{ fontSize: 12, color: "#999", maxWidth: 400, lineHeight: 1.6 }}>
              大多数网站禁止被 iframe 嵌入（CSP frame-ancestors 限制）。
              <br /><br />
              <strong>可用方案：</strong>
              <br />• 加载本地开发服务器（localhost 无此限制）
              <br />• 在 Chrome DevTools 检查元素，手动输入选择器
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={`/api/proxy/?url=${encodeURIComponent(pageUrl)}`}
          onLoad={handleIframeLoad}
          style={{ width: "100%", height: "100%", border: "none" }}
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>

      {/* Inspector sidebar */}
      <div style={{ width: 280, borderLeft: "1px solid #e5e5e5", background: "white", flexShrink: 0 }}>
        <InspectorPanel
          hovered={hovered}
          selected={selected}
          changes={changes}
          onAddChange={addChange}
          onRemoveChange={removeChange}
          onGenerate={generatePrompt}
          pageUrl={pageUrl}
          generatedPrompt={prompt}
          onCopy={() => {
            if (prompt) navigator.clipboard.writeText(prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          copied={copied}
        />
      </div>
    </div>
  );
}
