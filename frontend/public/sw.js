// RoamOffline service worker: app shell (network-first, cache fallback) + map tiles (cache-only when offline)
const SHELL = 'roam-shell-v1', TILES = 'roam-tiles';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('message', e => {
  if (e.data && e.data.cache) e.waitUntil(caches.open(SHELL).then(c => Promise.all(e.data.cache.map(u => c.add(u).catch(() => {})))));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  if (u.pathname.startsWith('/tiles/')) {
    e.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(r.url); if (hit) return hit;
      if (!self.navigator.onLine) return new Response('', { status: 404 });   // never go to network when offline
      try { return await fetch(r); } catch { return new Response('', { status: 404 }); }
    }));
    return;
  }
  e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(SHELL).then(c => c.put(r, cp)); return res; })
    .catch(() => caches.match(r).then(m => m || caches.match('/index.html') || caches.match('/'))));
});
