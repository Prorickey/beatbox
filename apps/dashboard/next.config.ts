import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@beatbox/shared", "@beatbox/database"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default nextConfig;
