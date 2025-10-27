const CACHE_NAME = 'quiz-antincendio-v1.3.6';
const ORIGIN = self.location.origin;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll([
        `${ORIGIN}/`,
        `${ORIGIN}/index.html`,
        `${ORIGIN}/app.js`,
        `${ORIGIN}/manifest.json`,
        `${ORIGIN}/quiz_antincendio_ocr_improved.json`,
        `${ORIGIN}/icon-192.png`,
        `${ORIGIN}/icon-512.png`
      ]);
      try { await cache.add('https://cdn.tailwindcss.com'); }
      catch { console.warn('SW: CDN skip'); }
    } catch (err) {
      console.error('SW: Cache core failed', err);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
  ));
  return self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request)
      .then(r => r || fetch(e.request).then(fr => {
        if (!fr || fr.status !== 200 || fr.type !== 'basic') return fr;
        const clone = fr.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return fr;
      }))
      .catch(() => e.request.mode === 'navigate' ? caches.match(`${ORIGIN}/index.html`) : undefined)
  );
});

