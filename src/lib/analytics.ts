export class Analytics {
  private static async getSentry() {
    if (process.env.NEXT_RUNTIME === "edge") {
      // Return a dummy object for edge to avoid Edge bundle bloat issues with Sentry
      return {
        captureMessage: () => {},
        captureException: () => {},
        setUser: () => {},
      };
    }
    // Dynamically import Sentry only when not on edge runtime
    return import("@sentry/nextjs");
  }

  static async captureEvent(message: string, context?: Record<string, any>) {
    const Sentry = await this.getSentry();
    Sentry.captureMessage(message, { extra: context });
  }

  static async captureError(
    error: Error | unknown,
    context?: Record<string, any>,
  ) {
    const Sentry = await this.getSentry();
    Sentry.captureException(error, { extra: context });
  }

  static async captureApiError(error: any, url?: string, method?: string) {
    const Sentry = await this.getSentry();
    const errorDetails = {
      url,
      method,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    };
    console.error(`[API Error] ${method?.toUpperCase()} ${url}`, errorDetails);
    Sentry.captureException(error, {
      extra: { apiErrorDetails: errorDetails },
      tags: {
        type: "api_error",
        api_status: error?.response?.status
          ? String(error.response.status)
          : "unknown",
      },
    });
  }

  static async identifyUser(userId: string, email?: string) {
    const Sentry = await this.getSentry();
    Sentry.setUser({ id: userId, email });
  }

  static async clearUser() {
    const Sentry = await this.getSentry();
    Sentry.setUser(null);
  }
}
