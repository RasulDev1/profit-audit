import type { NextConfig } from "next";

// Статичная сборка для GitHub Pages. NEXT_PUBLIC_BASE_PATH = "/profit-audit" в CI.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
