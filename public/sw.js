// Self-cleaning Service Worker to ensure zero interference with Vercel Security Checkpoint or iframe navigation
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          // Allow active clients to continue without interception
          if (client && "navigate" in client) {
            // No forced reload needed
          }
        });
      })
      .catch(() => {})
  );
});
