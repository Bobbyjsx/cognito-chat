import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const isCloudflareBuild = process.env.CLOUDFLARE === "1";
const enableSentry =
  !isCloudflareBuild &&
  process.env.NODE_ENV === "production" &&
  (process.env.CI === "true" ||
    Boolean(process.env.VERCEL) ||
    process.env.SENTRY_ENABLED === "1");

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,
  env: {
    CLOUDFLARE: process.env.CLOUDFLARE ?? "",
    NEXT_PUBLIC_SENTRY_DISABLED: enableSentry ? "0" : "1",
  },

  experimental: {
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
    unoptimized: isCloudflareBuild,
    formats: ["image/avif", "image/webp"],
  },

  productionBrowserSourceMaps: false,

  serverExternalPackages: isCloudflareBuild ? ["@sentry/nextjs", "shiki"] : [],
};

initOpenNextCloudflareForDev();

export default async function loadNextConfig() {
  if (!enableSentry) return nextConfig;

  const { withSentryConfig } = await import("@sentry/nextjs");
  return withSentryConfig(nextConfig, {
    org: "bob-the-builder-0n",
    project: "cognito",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    webpack: {
      automaticVercelMonitors: true,
      treeshake: {
        removeDebugLogging: true,
      },
    },
  });
}
