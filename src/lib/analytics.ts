import * as Sentry from "@sentry/nextjs";

export class Analytics {
  /**
   * Capture a generic event or message.
   */
  static captureEvent(message: string, context?: Record<string, any>) {
    Sentry.captureMessage(message, {
      extra: context,
    });
  }

  /**
   * Capture an error exception.
   */
  static captureError(error: Error | unknown, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    });
  }

  /**
   * Capture an API error specifically, preserving the response details.
   */
  static captureApiError(error: any, url?: string, method?: string) {
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

  /**
   * Identify the user in analytics
   */
  static identifyUser(userId: string, email?: string) {
    Sentry.setUser({ id: userId, email });
  }

  /**
   * Clear the current user from analytics
   */
  static clearUser() {
    Sentry.setUser(null);
  }
}
