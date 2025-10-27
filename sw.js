// Service Worker v1.3.5 - Quiz Antincendio
// Versione corretta con gestione ottimizzata della cache

const CACHE_NAME = 'quiz-antincendio-v1.3.5-fixed';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/quiz_antincendio_ocr_improved.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Installazione Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] All files cached');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// Attivazione Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activated');
      return self.clients.claim();
    })
  );
});

// Strategia di fetch: Network First con Cache Fallback per JSON, Cache First per assets
self.addEventListener('fetch', event => {
  // Ignora richieste non HTTP/HTTPS
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Ignora richieste POST/PUT/DELETE
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Strategia Network First per il JSON delle domande
  if (url.pathname.includes('quiz_antincendio_ocr_improved.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clona e aggiorna la cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback alla cache se offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategia Cache First per tutto il resto
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            // Verifica che la risposta sia valida
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clona la risposta
            const responseToCache = response.clone();

            // Salva in cache solo risorse del nostro dominio
            if (url.origin === location.origin) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(error => {
            console.error('[SW] Fetch failed:', error);
            
            // Fallback per pagine HTML
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Gestione dei messaggi (per future funzionalità)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});