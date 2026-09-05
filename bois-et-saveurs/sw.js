const CACHE_NAME = 'bois-saveurs-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/img/carre-agneau-hero.jpg',
  './assets/img/carre-agneau-post.jpg',
  './assets/img/paella.jpg',
  './assets/img/calamar-farci.jpg',
  './assets/img/pave-saumon.jpg',
  './assets/img/entrecote.jpg',
  './assets/img/roti-boeuf.jpg',
  './assets/img/cheesecake.jpg',
  './assets/img/eclairs.jpg',
  './assets/img/interieur.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
