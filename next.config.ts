import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const isCloudflareBuild = process.env.CLOUDFLARE === "1";

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  compress: true,
  env: {
    CLOUDFLARE: process.env.CLOUDFLARE ?? "",
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
};

const config = withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "bob-the-builder-0n",

  project: "cognito",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});

export default isCloudflareBuild ? nextConfig : config;

initOpenNextCloudflareForDev();
