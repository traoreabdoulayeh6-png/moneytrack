/* ============================================================
   MONEYTRACK - SERVICE WORKER
   Mise en cache des fichiers statiques pour un chargement rapide
   et un fonctionnement minimal hors-ligne (l'API necessite le reseau).
   ============================================================ */

const CACHE_NAME = 'moneytrack-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
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
  const { request } = event;

  // Ne jamais mettre en cache les appels a l'API : ils doivent toujours
  // aller chercher les donnees fraiches sur le serveur.
  if (request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
      );
    }).catch(() => caches.match('/index.html'))
  );
});
