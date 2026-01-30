import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/lucide-react/ },
      { module: /node_modules\/framer-motion/ },
      { message: /Failed to parse source map/ },
    ];
    return config;
  },
};

export default nextConfig;
