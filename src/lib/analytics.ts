import * as Sentry from "@sentry/nextjs";

/** Central analytics facade — sends events, logs, and errors to Sentry. */
export class Analytics {
  /** Structured log (info). Requires `enableLogs` in the Sentry configs. */
  static captureEvent(message: string, context?: Record<string, unknown>) {
    Sentry.logger.info(message, context);
  }

  /** Structured log at an explicit severity level. */
  static captureLog(
    message: string,
    context?: Record<string, unknown>,
    level: "debug" | "info" | "warn" | "error" | "fatal" = "info",
  ) {
    Sentry.logger[level](message, context);
  }

  /** Captures an exception (Error product) and mirrors it as an error log. */
  static captureError(
    error: Error | unknown,
    context?: Record<string, unknown>,
  ) {
    const e = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(e, {
      captureContext: {
        level: "error",
        extra: context,
      },
    });
    Sentry.logger.error(e.message, {
      name: e.name,
      stack: e.stack,
      ...context,
    });
  }

  /** Captures a failed API request with request metadata attached. */
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
    const details = {
      url,
      method,
      status,
      data,
      ...context,
    };

    const e =
      error instanceof Error
        ? error
        : new Error(`${method?.toUpperCase() ?? "API"} ${url ?? ""}`.trim());

    Sentry.captureException(e, { extra: details });
    Sentry.logger.error(
      `API ${method?.toUpperCase() ?? ""} ${url}`.trim(),
      details,
    );
  }

  /** Associates an identity with subsequent events/errors for that user. */
  static identifyUser(userId: string, email?: string) {
    Sentry.setUser({ id: userId, email });
  }

  /** Clears the linked identity. */
  static clearUser() {
    Sentry.setUser(null);
  }
}
