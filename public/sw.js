// Cognito PWA Service Worker
const CACHE_NAME = "cognito-cache-v2";
const OFFLINE_URL = "/chat";

const PRECACHE_ASSETS = [
  "/favicon/favicon.ico",
  "/favicon/android-chrome-192x192.png",
  "/favicon/android-chrome-512x512.png",
  "/favicon/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Avoid caching API routes, auth endpoints, or SSE/streaming
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/oauth/") ||
    url.pathname.includes("/content")
  ) {
    return;
  }

  // Handle HTML navigation requests (Network-first with offline fallback)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
      }),
    );
    return;
  }

  // Handle static assets (Stale-while-revalidate for fonts, images, scripts)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/favicon/") ||
    url.pathname.startsWith("/images/")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      }),
    );
  }
});

// Notification click handler: focus existing window and deep-link to session URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/chat";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            if (client.url && client.url.includes(urlToOpen)) {
              return client.focus();
            }
            return client.focus().then((focusedClient) => {
              if (focusedClient && "navigate" in focusedClient) {
                return focusedClient.navigate(urlToOpen);
              }
            });
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Push event handler for backend-initiated web push alerts
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const title = payload.title || "Cognito AI";
    const options = {
      body: payload.body || "New notification",
      icon: payload.icon || "/favicon/android-chrome-192x192.png",
      badge: payload.badge || "/favicon/favicon-32x32.png",
      tag: payload.tag || "cognito-push",
      data: {
        url: payload.url || "/chat",
        ...payload.data,
      },
      renotify: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Cognito AI", {
        body: text,
        icon: "/favicon/android-chrome-192x192.png",
        data: { url: "/chat" },
      }),
    );
  }
});
