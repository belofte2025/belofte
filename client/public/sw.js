const CACHE_NAME = "petros-cache-v1";
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle same-origin GET requests — never intercept API calls to the backend
  // (cross-origin) or non-GET requests (POST/PUT/DELETE must always hit the network).
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Page navigations: network-first, fall back to the offline page when unreachable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets (Next.js build output, icons, etc.): cache-first, refresh in the background.
  if (request.url.includes("/_next/static/") || request.url.includes("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
