/* StrTracker service worker — deixa o app abrir sem internet (academia com sinal ruim).
   Ao publicar uma versão nova, aumente CACHE para forçar a atualização. */
const CACHE = 'strtracker-v2.2.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './data/exercises.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // PostHog, Google e APIs: sempre rede, nunca cache
  if (url.origin !== self.location.origin) {
    if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
      e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { c.put(req, r.clone()); return r; }))));
    }
    return;
  }
  // Página: rede primeiro (pega a versão nova), cache se estiver offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Demais arquivos do app: cache primeiro
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
