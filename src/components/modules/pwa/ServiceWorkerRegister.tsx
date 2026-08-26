"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check if there is an already waiting worker
            if (registration.waiting) {
              window.dispatchEvent(
                new CustomEvent("cognito:sw-update", {
                  detail: {
                    registration,
                    waitingWorker: registration.waiting,
                  },
                }),
              );
            }

            // Optional registration update handler
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    console.info(
                      "Cognito PWA: New content available; please refresh.",
                    );
                    window.dispatchEvent(
                      new CustomEvent("cognito:sw-update", {
                        detail: {
                          registration,
                          waitingWorker: installingWorker,
                        },
                      }),
                    );
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error("Service worker registration failed:", error);
          });
      });
    }
  }, []);

  return null;
}
