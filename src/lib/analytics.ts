export class Analytics {
  static async captureEvent(message: string, context?: Record<string, any>) {
    console.log("[Analytics Event]", message, context);
  }

  static async captureError(
    error: Error | unknown,
    context?: Record<string, any>,
  ) {
    console.error("[Analytics Error]", error, context);
  }

  static async captureApiError(error: any, url?: string, method?: string) {
    const errorDetails = {
      url,
      method,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    };
    console.error(`[API Error] ${method?.toUpperCase()} ${url}`, errorDetails);
  }

  static async identifyUser(userId: string, email?: string) {
    console.log("[Analytics Identify User]", userId, email);
  }

  static async clearUser() {
    console.log("[Analytics Clear User]");
  }
}
