import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The local browser uses 127.0.0.1 while Next serves assets from the same
  // dev server; declare both loopback hostnames to keep the dev console clean.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Keep the dev compiler isolated from `next build`; otherwise a production
  // build can replace chunks that the running dev server still references.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
