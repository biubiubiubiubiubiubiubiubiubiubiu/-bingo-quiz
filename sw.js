const CACHE_NAME = 'bingo-quiz-m3-v35';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    './css/app.css',
    './data/dynamic_banter.json',
    './js/app.js',
    './js/pwa.js',
    './js/storage.js',
    './js/navigation.js',
    './js/import.js',
    './js/quiz.js',
    './js/pet-engine.js',
    './js/child-mode.js',
    './vendor/xlsx.full.min.js',
    './vendor/tinygesture.min.js'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 激活时清理旧缓存并立即接管当前客户端
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
