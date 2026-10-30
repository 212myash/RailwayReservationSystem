import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Explicitly define root directory for Turbopack to prevent multi-root warnings */
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
