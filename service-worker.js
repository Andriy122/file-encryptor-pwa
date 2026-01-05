/**
 * Service Worker для офлайн роботи PWA
 */

const CACHE_NAME = 'file-encryptor-v3';
const urlsToCache = [
    './',
    './index.html',
    './css/styles.css',
    './js/encryptor_v3.js',
    './js/app_v3.js',
    './manifest.json'
];

// Встановлення Service Worker та кешування файлів
self.addEventListener('install', (event) => {
    console.log('Service Worker: Встановлення...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Кешування файлів');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Встановлено');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Помилка кешування:', error);
            })
    );
});

// Активація Service Worker та очищення старого кешу
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активація...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Видалення старого кешу:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Активовано');
                return self.clients.claim();
            })
    );
});

// Обробка запитів - Network First, потім Cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Якщо отримали відповідь з мережі, оновлюємо кеш
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Якщо немає мережі, повертаємо з кешу
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log('Service Worker: Завантажено з кешу:', event.request.url);
                            return cachedResponse;
                        }
                        // Якщо запит до HTML сторінки і немає в кеші, повертаємо index.html
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Обробка повідомлень від клієнта
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
