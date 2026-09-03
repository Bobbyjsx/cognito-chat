"use client";

export type NotificationPermissionState =
  "granted" | "denied" | "default" | "unsupported";

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
  renotify?: boolean;
  silent?: boolean;
}

const DEFAULT_ICON = "/favicon/android-chrome-192x192.png";
const DEFAULT_BADGE = "/favicon/favicon-32x32.png";

/**
 * Checks if Notification API is supported in the current environment.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Returns current Notification permission state.
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Requests Notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  try {
    const req = Notification.requestPermission();
    if (req && typeof req.then === "function") {
      return await req;
    }
    return await new Promise<NotificationPermission>((resolve) => {
      Notification.requestPermission(resolve);
    });
  } catch {
    return "denied";
  }
}

/**
 * Checks if user is currently away from the window (tab hidden, window minimized, or lost focus).
 */
export function isWindowAway(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.hidden ||
    (typeof document.hasFocus === "function" && !document.hasFocus())
  );
}

/**
 * Dispatches a native browser push / desktop notification.
 * Uses Service Worker showNotification when available & controlling,
 * or falls back immediately to new Notification constructor.
 */
export async function showBrowserPushNotification({
  title,
  body,
  icon = DEFAULT_ICON,
  badge = DEFAULT_BADGE,
  tag,
  url = "/chat",
  data,
  renotify = true,
  silent = false,
}: PushNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const notificationData = {
    url,
    ...data,
  };

  // Try Service Worker registration only if one is active and controlling the page
  if (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    navigator.serviceWorker.controller
  ) {
    try {
      const registration = await Promise.race<
        ServiceWorkerRegistration | undefined
      >([
        navigator.serviceWorker.ready,
        new Promise<undefined>((resolve) =>
          setTimeout(() => resolve(undefined), 300),
        ),
      ]);

      if (registration && "showNotification" in registration) {
        const swOptions: NotificationOptions & { renotify?: boolean } = {
          body,
          icon,
          badge,
          tag,
          data: notificationData,
          renotify,
          silent,
        };
        await registration.showNotification(title, swOptions);
        return true;
      }
    } catch {
      // Fall through to standard Notification
    }
  }

  // Fallback to standard DOM Notification constructor
  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge,
      tag,
      data: notificationData,
      silent,
    });

    notif.onclick = () => {
      window.focus();
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      }
      notif.close();
    };
    return true;
  } catch (err) {
    console.error("Browser notification failed to display:", err);
    return false;
  }
}
