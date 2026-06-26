/**
 * Budgeteer service worker.
 *
 * Goals:
 *  - Make the web app installable (Add to Home Screen) on Android/Chrome.
 *  - Keep the app shell available offline so a launched PWA doesn't show the
 *    browser's dino/"no internet" page when connectivity drops.
 *
 * Strategy:
 *  - Navigations  -> network-first, falling back to the cached app shell ("/").
 *  - Static assets -> stale-while-revalidate (fast loads, refreshed in the bg).
 *  - Everything cross-origin (Supabase API/realtime, fonts CDNs, etc.) is left
 *    completely untouched so live financial data is never served from cache.
 *
 * Bump VERSION whenever the caching logic changes to evict old caches.
 */
const VERSION = "v1";
const SHELL_CACHE = `budgeteer-shell-${VERSION}`;
const ASSET_CACHE = `budgeteer-assets-${VERSION}`;
const APP_SHELL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(APP_SHELL))
      .catch(() => {})
  );
  // Activate this worker immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_expo/") ||
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|gif|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever deal with GETs; never cache mutations.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Leave cross-origin requests (Supabase, analytics, font CDNs) alone.
  if (url.origin !== self.location.origin) return;

  // App navigations: try the network, fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches
            .open(SHELL_CACHE)
            .then((cache) => cache.put(APP_SHELL, copy))
            .catch(() => {});
          return response;
        })
        .catch(() =>
          caches
            .match(APP_SHELL)
            .then((cached) => cached || caches.match(request))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});

// Allow the page to trigger an immediate update when a new worker is waiting.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
