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
 * Synthesizes a subtle, pleasant audio chime using the Web Audio API.
 * Ensures the user hears an alert even if the OS suppresses the system sound.
 */
export function playNotificationChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    // Two-tone chime (587.33Hz D5 -> 880Hz A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.12, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.5);

    setTimeout(() => {
      void ctx.close();
    }, 1000);
  } catch {
    // Graceful silence if audio policy blocks
  }
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

  // Play audio chime if not explicitly silenced
  if (!silent) {
    playNotificationChime();
  }

  // 1. Primary: Direct standard Notification constructor (matches proven implementation)
  try {
    const notif = new Notification(title, {
      body,
      icon: icon || DEFAULT_ICON,
      tag,
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
    // 2. Fallback: Service Worker showNotification (for mobile browsers that forbid new Notification)
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
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
        console.error("ServiceWorker showNotification failed:", swErr);
      }
    }
    return false;
  }
}
