import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "registry.kernl.sh",
      },
    ],
  },
  turbopack: {},
};

export default nextConfig;
