// Cognito PWA Service Worker
const CACHE_NAME = "cognito-cache-v1";
const OFFLINE_URL = "/chat";

const PRECACHE_ASSETS = [
  "/",
  "/chat",
  "/favicon/favicon.ico",
  "/favicon/android-chrome-192x192.png",
  "/favicon/android-chrome-512x512.png",
  "/favicon/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
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
