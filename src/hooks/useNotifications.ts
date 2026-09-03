"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  showBrowserPushNotification,
  type NotificationPermissionState,
  type PushNotificationPayload,
} from "@/lib/push-notifications";
import { toast } from "@/components/ui/toast";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>(
    () =>
      typeof window !== "undefined" ? getNotificationPermission() : "default",
  );
  const [isSupported] = useState<boolean>(() =>
    typeof window !== "undefined" ? isNotificationSupported() : false,
  );

  useEffect(() => {
    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      navigator.permissions
        .query({ name: "notifications" as PermissionName })
        .then((status) => {
          const update = () => setPermission(getNotificationPermission());
          status.addEventListener("change", update);
          return () => status.removeEventListener("change", update);
        })
        .catch(() => {});
    }

    // Auto-prompt on user's first interactive gesture if permission is still default
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        const handleFirstClick = async () => {
          try {
            const nextPerm = await Notification.requestPermission();
            setPermission(nextPerm);
          } catch {}
        };
        window.addEventListener("click", handleFirstClick, { once: true });
        return () => window.removeEventListener("click", handleFirstClick);
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const nextPerm = await requestNotificationPermission();
    setPermission(nextPerm);
    return nextPerm;
  }, []);

  const sendPush = useCallback(async (payload: PushNotificationPayload) => {
    return showBrowserPushNotification(payload);
  }, []);

  const sendTestNotification = useCallback(async (delayMs: number = 0) => {
    let perm = getNotificationPermission();
    if (perm === "default") {
      perm = await requestNotificationPermission();
      setPermission(perm);
    }

    if (perm === "granted") {
      if (delayMs > 0) {
        toast.info("Notification scheduled", {
          description: `Switch to another window/app in the next ${Math.round(delayMs / 1000)} seconds to see the push alert.`,
        });
        await new Promise((r) => setTimeout(r, delayMs));
      }

      const dispatched = await showBrowserPushNotification({
        title: "Cognito Test Notification",
        body: "Push notifications are working properly!",
        url: "/chat",
      });

      if (dispatched) {
        if (delayMs === 0) {
          toast.success("Test notification sent", {
            description: "A desktop notification has been dispatched.",
          });
        }
      } else {
        toast.error("Notification could not be displayed", {
          description:
            "Please check if macOS / OS Do Not Disturb or Browser Notifications are muted.",
        });
      }
    } else {
      toast.info("In-App Notification Test", {
        description:
          "Push permission is not granted. Click 'Enable Push' to grant permission.",
      });
    }
  }, []);

  return {
    isSupported,
    permission,
    isGranted: permission === "granted",
    requestPermission,
    sendPush,
    sendTestNotification,
  };
}
