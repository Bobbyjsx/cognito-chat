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
 * Checks if Notification API is supported and functional in the current environment.
 * Correctly returns false on iOS / Mobile Safari where Notification API is unavailable or disabled.
 */
export function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    typeof Notification.requestPermission === "function"
  );
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
 * Checks if user is currently away from the window (tab hidden, backgrounded, or lost focus).
 */
export function isWindowAway(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.visibilityState !== "visible" ||
    document.hidden ||
    (typeof document.hasFocus === "function" && !document.hasFocus())
  );
}

/**
 * Truncates and cleans AI response text for push notification body display.
 * Strips markdown codeblocks/symbols, collapses newlines, and trims to maxLength.
 */
export function truncateNotificationBody(
  text: string | null | undefined,
  maxLength = 140,
): string {
  if (!text || typeof text !== "string") return "Response ready";
  const cleaned = text
    .replace(/```[\s\S]*?```/g, "[Code]")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[#*_~>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Response ready";

  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return cleaned.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Dispatches a native browser notification.
 * Uses the direct Notification constructor first (standard for desktop Chrome/Safari/Firefox),
 * and falls back to ServiceWorkerRegistration.showNotification if the browser requires it (e.g. mobile Android).
 */
export async function showBrowserPushNotification({
  title,
  body,
  icon = DEFAULT_ICON,
  badge = DEFAULT_BADGE,
  tag,
  url = "/chat",
  data,
  renotify = false,
  silent = false,
}: PushNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== "granted") return false;

  const notificationData = {
    url,
    ...data,
  };

  // 1. Primary: Service Worker showNotification
  // Essential for PWAs so clicking the notification wakes up the SW and deep-links
  // to the specific chat session even if the PWA was completely closed.
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    try {
      const registration =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.ready);
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
    } catch (swErr) {
      console.warn(
        "ServiceWorker showNotification failed, using fallback:",
        swErr,
      );
    }
  }

  // 2. Fallback: Direct standard Notification constructor (desktop browsers without active SW)
  try {
    const notif = new Notification(title, {
      body,
      icon: icon || DEFAULT_ICON,
      tag,
      data: notificationData,
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      }
      notif.close();
    };

    return true;
  } catch {
    return false;
  }
}
