import { getErrorMessage } from "@/lib/server-error";

const sentryEnabled = process.env.CLOUDFLARE !== "1";

type SentrySdk = typeof import("@sentry/nextjs");

let sentryLoader: Promise<SentrySdk | null> | undefined;

function loadSentry() {
  if (!sentryEnabled) return Promise.resolve(null);
  sentryLoader ??= import("@sentry/nextjs").catch(() => null);
  return sentryLoader;
}

/** Central analytics facade — Sentry on Vercel, console on Cloudflare Workers. */
export class Analytics {
  static captureEvent(message: string, context?: Record<string, unknown>) {
    if (!sentryEnabled) {
      console.info(message, context);
      return;
    }
    void loadSentry().then((Sentry) => Sentry?.logger.info(message, context));
  }

  static captureLog(
    message: string,
    context?: Record<string, unknown>,
    level: "debug" | "info" | "warn" | "error" | "fatal" = "info",
  ) {
    if (!sentryEnabled) {
      console[level === "fatal" ? "error" : level](message, context);
      return;
    }
    void loadSentry().then((Sentry) => Sentry?.logger[level](message, context));
  }

  static captureError(
    error: Error | unknown,
    context?: Record<string, unknown>,
  ) {
    const e = error instanceof Error ? error : new Error(String(error));
    if (!sentryEnabled) {
      console.error(e, context);
      return;
    }
    void loadSentry().then((Sentry) => {
      Sentry?.captureException(e, {
        captureContext: { level: "error", extra: context },
      });
      Sentry?.logger.error(e.message, {
        name: e.name,
        stack: e.stack,
        ...context,
      });
    });
  }

  static captureApiError(
    error: unknown,
    url?: string,
    method?: string,
    context?: Record<string, unknown>,
  ) {
    const shape = error as {
      response?: { status?: number; data?: unknown };
    };
    const status = shape.response?.status;
    const data = shape.response?.data;
    const endPoint = `${method?.toUpperCase() ?? "API"} ${url ?? ""}`.trim();
    const detail = getErrorMessage(error, endPoint);
    const message = Array.isArray(detail) ? detail.join(" | ") : detail;
    const e = error instanceof Error ? error : new Error(message);

    if (!sentryEnabled) {
      console.error(e, { url, method, status, ...context });
      return;
    }

    void loadSentry().then((Sentry) => {
      Sentry?.captureException(e, {
        extra: { url, method, status, data, ...context },
      });
      Sentry?.logger.error(message, { url, method, status });
    });
  }

  static identifyUser(userId: string, email?: string) {
    if (!sentryEnabled) return;
    void loadSentry().then((Sentry) => Sentry?.setUser({ id: userId, email }));
  }

  static clearUser() {
    if (!sentryEnabled) return;
    void loadSentry().then((Sentry) => Sentry?.setUser(null));
  }
}
