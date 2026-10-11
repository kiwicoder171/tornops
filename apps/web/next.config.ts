import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@torn/shared", "@torn/api"],
};

export default nextConfig;
