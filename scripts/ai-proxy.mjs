/**
 * Local AI proxy server for Sketch UI.
 * Reads the Nous/Apineed API key from Hermes config and forwards
 * chat completion requests, so the browser never needs to handle keys.
 *
 * Usage: node scripts/ai-proxy.mjs [port]
 * Default port: 3456
 */

import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const PORT = parseInt(process.argv[2] || "3456", 10);
const HERMES_HOME = process.env.HERMES_HOME || path.join(process.env.HOME, ".hermes");

/* ---- read API keys from Hermes config ---- */

function readHermesConfig() {
  try {
    const configPath = path.join(HERMES_HOME, "config.yaml");
    const raw = fs.readFileSync(configPath, "utf-8");
    // Simple YAML parser for the fields we need
    const keys = {};

    // Look for NOUS_API_KEY or APINEED_API_KEY in env first
    if (process.env.NOUS_API_KEY) keys.nous = process.env.NOUS_API_KEY;
    if (process.env.APINEED_API_KEY) keys.apineed = process.env.APINEED_API_KEY;

    // Also check .env files
    const envFiles = [
      path.join(HERMES_HOME, ".env"),
      path.join(HERMES_HOME, "secrets.env"),
    ];
    for (const f of envFiles) {
      try {
        const env = fs.readFileSync(f, "utf-8");
        for (const line of env.split("\n")) {
          const m = line.match(/^(?:export\s+)?(\w+)=["']?(.+?)["']?\s*$/);
          if (m) {
            if (m[1] === "NOUS_API_KEY" && !keys.nous) keys.nous = m[2];
            if (m[1] === "APINEED_API_KEY" && !keys.apineed) keys.apineed = m[2];
          }
        }
      } catch {}
    }

    return keys;
  } catch (e) {
    console.error("[ai-proxy] Cannot read Hermes config:", e.message);
    return {};
  }
}

/* ---- proxy handler ---- */

function proxyRequest(targetUrl, apiKey, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const transport = url.protocol === "https:" ? https : http;
    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

/* ---- HTTP server ---- */

const server = http.createServer(async (req, res) => {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    const keys = readHermesConfig();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      providers: {
        nous: !!keys.nous,
        apineed: !!keys.apineed,
      },
    }));
    return;
  }

  // Chat completions proxy
  if (req.method === "POST" && req.url === "/v1/chat/completions") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body);
        const provider = parsed._provider || "nous";
        const baseUrl = parsed._baseUrl || "https://inference-api.nousresearch.com/v1/chat/completions";
        delete parsed._provider;
        delete parsed._baseUrl;

        const keys = readHermesConfig();
        const apiKey = keys[provider];

        if (!apiKey) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: `No API key found for provider '${provider}'. Set NOUS_API_KEY or APINEED_API_KEY in ~/.hermes/.env` }));
          return;
        }

        console.log(`[ai-proxy] → ${provider} ${baseUrl} (model: ${parsed.model})`);
        const result = await proxyRequest(baseUrl, apiKey, parsed);

        res.writeHead(result.status, { "Content-Type": "application/json" });
        res.end(result.body);
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  const keys = readHermesConfig();
  console.log(`[ai-proxy] Running on http://127.0.0.1:${PORT}`);
  console.log(`[ai-proxy] Nous key: ${keys.nous ? "✓ found" : "✗ missing"}`);
  console.log(`[ai-proxy] Apineed key: ${keys.apineed ? "✓ found" : "✗ missing"}`);
  console.log(`[ai-proxy] Health: http://127.0.0.1:${PORT}/health`);
});
