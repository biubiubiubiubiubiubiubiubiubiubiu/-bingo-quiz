const CACHE_NAME = 'bingo-quiz-m3-v37';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    './css/app.css',
    './data/dynamic_banter.json',
    './data/starter_decks.json',
    './js/xlsx-loader.js',
    './js/app.js',
    './js/pwa.js',
    './js/storage.js',
    './js/navigation.js',
    './js/import.js',
    './js/quiz.js',
    './js/pet-engine.js',
    './js/child-mode.js',
    './vendor/xlsx.full.min.js',
    './vendor/tinygesture.min.js',
    // 补齐全部伴学萌宠 SVG 资产与配置，确保 100% 离线可用
    './assets/pets/manifest.json',
    './assets/pets/crab/celebrate.svg',
    './assets/pets/crab/climb.svg',
    './assets/pets/crab/drag.svg',
    './assets/pets/crab/idle.svg',
    './assets/pets/crab/move.svg',
    './assets/pets/crab/sleep.svg',
    './assets/pets/crab/think.svg',
    './assets/pets/fish/celebrate.svg',
    './assets/pets/fish/drag.svg',
    './assets/pets/fish/idle.svg',
    './assets/pets/fish/move.svg',
    './assets/pets/fish/sleep.svg',
    './assets/pets/fish/think.svg',
    './assets/pets/octopus/celebrate.svg',
    './assets/pets/octopus/drag.svg',
    './assets/pets/octopus/idle.svg',
    './assets/pets/octopus/move.svg',
    './assets/pets/octopus/sleep.svg',
    './assets/pets/octopus/think.svg',
    './assets/pets/shrimp/celebrate.svg',
    './assets/pets/shrimp/drag.svg',
    './assets/pets/shrimp/idle.svg',
    './assets/pets/shrimp/move.svg',
    './assets/pets/shrimp/sleep.svg',
    './assets/pets/shrimp/think.svg'
];

// 安装时预缓存核心资产，等待用户或客户端确认后激活，不再暴力无脑 skipWaiting
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// 支持客户端发送 SKIP_WAITING 消息进行平滑受控激活
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 激活时清理旧版本缓存并接管客户端
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

// 离线优先响应策略
self.addEventListener('fetch', (e) => {
    // 忽略非 GET 请求
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(e.request).then((networkResponse) => {
                return networkResponse;
            }).catch(() => {
                // 如果是页面跳转失败且离线，回退到 index.html
                if (e.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
