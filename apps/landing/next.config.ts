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
};

export default nextConfig;
