export async function register() {
  if (
    process.env.CLOUDFLARE === "1" ||
    process.env.NEXT_PUBLIC_SENTRY_DISABLED === "1"
  ) {
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}
