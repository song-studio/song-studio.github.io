const CACHE = 'fan-cards-v1';
const FILES = [
  '/2026-FIFA-World-Cup/fan-cards.html',
  '/2026-FIFA-World-Cup/manifest.json',
  '/2026-FIFA-World-Cup/assets/icon-192.png',
  '/2026-FIFA-World-Cup/assets/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
