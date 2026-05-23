// Service Worker for RP Wallet PWA
// Handles: background notifications + aggressive asset caching for native-like speed

const CACHE_NAME = 'rp-wallet-v8';
const STATIC_ASSETS = [
  '/tokens/sol.webp',
  '/tokens/eth.webp',
  '/tokens/btc.webp',
  '/tokens/sui.webp',
  '/tokens/usdc.webp',
  '/tokens/doge.webp',
  '/tokens/bnb.webp',
  '/tokens/hype.webp',
  '/tokens/avax.webp',
  '/tokens/link.webp',
  '/tokens/uni.webp',
  '/tokens/matic.webp',
  '/tokens/mon.webp',
  '/tokens/usdt.png',
  '/icons/home-selected.webp',
  '/icons/home-unselected.webp',
  '/icons/card-selected.webp',
  '/icons/card-unselected.webp',
  '/icons/swap-selected.webp',
  '/icons/swap-unselected.webp',
  '/icons/activity-selected.webp',
  '/icons/activity-unselected.webp',
  '/icons/search-selected.webp',
  '/icons/search-unselected.webp',
  '/logos/icon_128x128.png',
  '/logos/icon_512x512.png',
  '/rive/nav-home.rivx',
  '/rive/progress-send.rivx',
  '/rive/nav-wallet.rivx',
  '/rive/nav-chat.rivx',
  '/rive/nav-swap.rivx',
  '/rive/nav-search.rivx',
  '/rive/rive.wasm',
  '/sound-effect/confetti.mp3',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API calls and external URLs
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) return;

  // For navigation requests (HTML pages): network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest navigation response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => cached || caches.match('/home'));
        })
    );
    return;
  }

  // For static media assets (images, fonts, animations): cache-first
  if (
    url.pathname.startsWith('/tokens/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logos/') ||
    url.pathname.startsWith('/avatars/') ||
    url.pathname.startsWith('/rive/') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.riv') ||
    url.pathname.endsWith('.rivx') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.endsWith('.mp3')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // For Next.js assets and RSC payloads: stale-while-revalidate
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/data/') || url.pathname.includes('.rsc')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notification from Phantom';
  const options = {
    body: data.body || 'Received transaction',
    icon: '/logos/icon_512x512.png',
    badge: '/logos/icon_512x512.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/activity'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
