/* Gratte Quest : fonctionnement hors ligne. Réseau d'abord pour les fichiers du site (les mises à jour arrivent tout de suite),
   copie locale si le réseau manque. Les requêtes vers d'autres sites (compte, images, polices) ne passent pas par ici. */
const CACHE = 'gratte-quest-v2';
const SHELL = ['./', './index.html', './app.css', './js/core.js', './js/data.js', './js/audio.js', './js/cloud.js', './js/app.js', './vendor/supabase.js', './manifest.webmanifest', './assets/icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))));
});
