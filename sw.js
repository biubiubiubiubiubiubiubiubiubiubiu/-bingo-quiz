const CACHE_NAME = 'bingo-quiz-v5';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './xlsx.full.min.js',
    // 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' 
    './icon.png' // 如果你有图标的话
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
