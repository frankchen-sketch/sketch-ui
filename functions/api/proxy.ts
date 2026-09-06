/**
 * Cloudflare Pages Function — proxy endpoint.
 * Fetches a target URL, rewrites relative paths to absolute, strips CSP headers.
 *
 * URL: /api/proxy?url=<encoded-url>
 */

export async function onRequest(context: { request: Request }): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return jsonError("Missing 'url' parameter", 400);
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return jsonError("Invalid URL", 400);
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return jsonError("Only http/https URLs allowed", 400);
  }

  const origin = targetUrl.origin; // e.g. "https://www.furriq.com"

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return jsonError(`Target returned ${response.status}`, response.status);
    }

    const contentType = response.headers.get("content-type") || "text/html";

    // Only rewrite HTML responses
    if (!contentType.includes("text/html")) {
      return new Response(response.body, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    let body = await response.text();

    // Rewrite relative URLs to absolute
    // Handle: href="/...", src="/...", action="/...", url("/..."), srcset="/..."
    body = body.replace(
      /((?:href|src|action|poster|data-src|srcset)\s*=\s*["'])\//gi,
      `$1${origin}/`
    );

    // Handle url() in inline styles: url(/...)
    body = body.replace(
      /(url\(\s*["']?)\//gi,
      `$1${origin}/`
    );

    // Handle <base> tag conflicts — remove any existing <base> tag
    body = body.replace(/<base\s[^>]*>/gi, "");

    // Inject a <base> tag so all remaining relative URLs resolve correctly
    body = body.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${origin}/">`
    );

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        // No CSP, no X-Frame-Options
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonError(message, 502);
  }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
