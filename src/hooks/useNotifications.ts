"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
  showBrowserPushNotification,
  type NotificationPermissionState,
  type PushNotificationPayload,
} from "@/lib/push-notifications";
import { toast } from "@/components/ui/toast";

const emptySubscribe = () => () => {};

function subscribePermission(onStoreChange: () => void) {
  if (typeof navigator !== "undefined" && "permissions" in navigator) {
    let statusRef: PermissionStatus | null = null;
    navigator.permissions
      .query({ name: "notifications" as PermissionName })
      .then((status) => {
        statusRef = status;
        status.addEventListener("change", onStoreChange);
      })
      .catch(() => {});

    return () => {
      if (statusRef) {
        statusRef.removeEventListener("change", onStoreChange);
      }
    };
  }
  return () => {};
}

export function useNotifications() {
  const isSupported = useSyncExternalStore(
    emptySubscribe,
    () => isNotificationSupported(),
    () => false,
  );

  const [overridePermission, setOverridePermission] =
    useState<NotificationPermissionState | null>(null);

  const permissionFromStore = useSyncExternalStore(
    subscribePermission,
    () => (isSupported ? getNotificationPermission() : "unsupported"),
    () => "default",
  );

  const permission = overridePermission ?? permissionFromStore;

  useEffect(() => {
    if (!isSupported) return;

    if (Notification.permission === "default") {
      const handleFirstClick = async () => {
        try {
          const nextPerm = await Notification.requestPermission();
          setOverridePermission(nextPerm);
        } catch {}
      };
      window.addEventListener("click", handleFirstClick, { once: true });
      return () => window.removeEventListener("click", handleFirstClick);
    }
  }, [isSupported]);

  const requestPermission = useCallback(async () => {
    const nextPerm = await requestNotificationPermission();
    setOverridePermission(nextPerm);
    return nextPerm;
  }, []);

  const sendPush = useCallback(async (payload: PushNotificationPayload) => {
    return showBrowserPushNotification(payload);
  }, []);

  const sendTestNotification = useCallback(async (delayMs: number = 0) => {
    let perm = getNotificationPermission();
    if (perm === "default") {
      perm = await requestNotificationPermission();
      setOverridePermission(perm);
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
