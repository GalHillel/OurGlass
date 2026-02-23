import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,
  // Turbopack is used for development by default in Next 16.
  // Adding an empty turbopack config silences the build conflict
  // with the webpack config below (which is used for `next build`).
  turbopack: {},
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
