// Service worker «A Paper Boat»: офлайн-запуск и кэш ассетов.
// Плейсхолдеры ниже заменяет vite-плагин при сборке (см. vite.config.ts):
// VERSION — sha256 содержимого dist, ASSETS — список файлов для прекэша.
const VERSION = '82fa19fc42a80d9f1667a7cfcf2d9c90c00b1aca4e0f73f8fa5f1de2f56f423f';
const ASSETS = ["./","./apple-touch-icon.png","./assets/icons/booster-blinchiki.png","./assets/icons/booster-guardian-speed.png","./assets/icons/booster-guardian-stock.png","./assets/icons/booster-magnet.png","./assets/icons/booster-mask.png","./assets/icons/care-lantern.png","./assets/icons/care-patch.png","./assets/icons/care-star.png","./assets/icons/hat-bare.png","./assets/icons/hat-knit.png","./assets/icons/hat-leaf.png","./assets/icons/hat-papercrown.png","./assets/icons/hat-straw.png","./assets/icons/skin-birch.png","./assets/icons/skin-crimson.png","./assets/icons/skin-gilded.png","./assets/icons/skin-news.png","./assets/icons/skin-plain.png","./assets/icons/tool-bark.png","./assets/icons/tool-pinecone.png","./assets/icons/tool-skipstone.png","./assets/icons/tool-sling.png","./assets/icons/ui-coin.png","./assets/icons/ui-magpie.png","./assets/index-C0wPQzqI.js","./icons/icon-192.png","./icons/icon-512.png","./index.html","./manifest.webmanifest"];
const CACHE = 'paper-boat-' + VERSION;

// install: наполняем кэш текущей версии и сразу берём управление
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)),
  );
  self.skipWaiting();
});

// activate: сносим кэши прошлых версий (префикс наш, версия другая)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('paper-boat-') && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// fetch: навигация — network-first (свежий index, офлайн — из кэша),
// остальное — cache-first с дозаливкой в кэш при промахе
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // сам воркер не кэшируем — им управляет браузер напрямую
  if (url.pathname.endsWith('/sw.js')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html')),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      });
    }),
  );
});
