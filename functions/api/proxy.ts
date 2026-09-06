/**
 * Cloudflare Pages Function — proxy endpoint.
 * Fetches a target URL and returns the HTML with CSP headers stripped.
 * This allows the iframe to load pages on the same origin.
 *
 * URL: /api/proxy?url=<encoded-url>
 */

export async function onRequest(context: { request: Request; env: unknown }): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate URL
  let targetUrl: URL;
  try {
    targetUrl = new URL(target);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return new Response(JSON.stringify({ error: "Only http/https URLs allowed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 SketchUI-Proxy/1.0",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Target returned ${response.status}` }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || "text/html";
    const body = await response.text();

    // Return the page with CSP headers stripped
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        // Explicitly no CSP, no X-Frame-Options
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
