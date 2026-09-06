import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy API route — fetches a target URL and returns the HTML with CSP headers stripped.
 * This allows the iframe to load the page on the same origin, avoiding cross-origin issues.
 *
 * Usage: GET /api/proxy?url=http://localhost:3000
 */

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing 'url' parameter" }, { status: 400 });
  }

  // Validate URL
  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https
  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return NextResponse.json({ error: "Only http/https URLs allowed" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 SketchUI-Proxy/1.0",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Target returned ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") || "text/html";
    const body = await response.text();

    // Return the page with CSP headers stripped
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // No CSP headers — allow iframe embedding and script injection
        "Access-Control-Allow-Origin": "*",
        "X-Frame-Options": "", // Strip X-Frame-Options
      },
    });
  } catch (e: any) {
    const message = e.name === "TimeoutError" ? "Target timed out" : e.message;
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
