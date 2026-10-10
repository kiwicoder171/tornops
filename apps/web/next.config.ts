import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@torn/shared", "@torn/api", "@torn/db"],
};

export default nextConfig;
