// Offline-Unterstützung: Netz zuerst (damit Updates sofort ankommen), sonst Cache.
const CACHE = 'ub-v8';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png', './vendor/jspdf.umd.min.js', './vendor/html2canvas.min.js'];

self.addEventListener('install', e => {
  // cache:'reload' umgeht den HTTP-Cache (GitHub Pages: max-age=600), damit keine alte Version eingelagert wird
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    // cache:'no-cache': immer beim Server nachfragen (günstig per ETag), sonst liefert der Browser bis zu 10 Min. alte Dateien
    // Seitenaufrufe (mode 'navigate') dürfen nicht mit Optionen kopiert werden, daher über die URL
    fetch(e.request.mode === 'navigate' ? new Request(e.request.url, {cache:'no-cache'}) : new Request(e.request, {cache:'no-cache'}))
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html')))
  );
});
