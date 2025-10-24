const CACHE_NAME = 'quiz-antincendio-v1.3.2-statefix'; // Aggiornato!
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/quiz_antincendio_ocr_improved.json', // Cruciale: assicura che il file JSON sia ricaricato
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com' 
];

// Installazione Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        // Aggiungo una gestione più robusta dell'errore cacheAdd per la CDN
        return cache.addAll(urlsToCache).catch(err => {
            // Se la CDN fallisce, procediamo con gli altri file
            console.error('Service Worker: Cache add failed (forse la CDN)', err);
            return Promise.resolve(); 
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Attivazione Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercettazione richieste (Strategia Cache-First)
self.addEventListener('fetch', event => {
  // Ignora le richieste che non sono HTTP/HTTPS (es. chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - ritorna risposta dalla cache
        if (response) {
          return response;
        }
        
        // Clone della richiesta
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verifica risposta valida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone della risposta
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              // Cacha solo le richieste che hanno successo e non sono "opache" (es. immagini CORS)
              // Controlla se l'URL da cachare era nella lista iniziale, o è la CDN che lasciamo comunque
              if (urlsToCache.some(url => event.request.url.includes(url))) {
                cache.put(event.request, responseToCache);
              }
            });
          
          return response;
        });
      })
      .catch(error => {
          // Fallback per richieste non riuscite (ad esempio, immagini mancanti)
          console.error('Service Worker: Fetch failed:', error);
          // Fallback alla index.html se non disponibile (per navigazione offline profonda)
          if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
          }
      })
  );
});