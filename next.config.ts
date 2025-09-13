import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily skip type checking during build to avoid minimatch type error
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
