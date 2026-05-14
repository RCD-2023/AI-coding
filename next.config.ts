import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.7"],
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-b88cb498f9404610898e57efe1121f58.r2.dev",
      },
    ],
  },
};

export default nextConfig;
