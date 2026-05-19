import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {},
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { hostname: 'images.unsplash.com' },
      { hostname: 'source.unsplash.com' },
    ],
  },
};

export default nextConfig;
