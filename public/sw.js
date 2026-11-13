const CACHE_NAME = "wotho-shell-v1";
const APP_SHELL_URLS = ["/", "/index.html", "/favicon.svg", "/site.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API endpoints or Vite dev module URLs
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/src/") ||
    url.pathname.startsWith("/node_modules/")
  ) {
    return;
  }

  // SPA navigation: network-first, falling back to cached shell when offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match("/index.html")) || (await caches.match("/"));
          return cached || Response.error();
        })
    );
    return;
  }

  // Built static assets (/assets/*): cache-first with network backfill
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        });
      })
    );
  }
});
