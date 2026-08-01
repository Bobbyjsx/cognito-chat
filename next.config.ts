import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,

  // Tree-shake barrel imports from large packages (Next.js standard)
  experimental: {
    serverActions: {
      allowedOrigins: ["cognito-chat.pages.dev", "*.pages.dev"],
    },
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "motion",
      "@tanstack/react-query",
      "sonner",
      "class-variance-authority",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Avoid shipping source maps to clients in production
  productionBrowserSourceMaps: false,
};

export default nextConfig;
