import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
  // Remove output: "export" to enable API routes for the proxy
  // Static export is done via `next build` + `next export` separately if needed
  async rewrites() {
    return [
      {
        source: "/api/proxy",
        destination: "/api/proxy",
      },
    ];
  },
};

export default nextConfig;
