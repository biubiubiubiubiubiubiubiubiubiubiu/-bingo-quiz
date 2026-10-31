// --- PWA Service Worker 注册与自动热重载 ---
let refreshing = false;
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('SW registered:', reg);
            // 每次页面加载主动检查 SW 更新
            if (reg && typeof reg.update === 'function') {
                reg.update().catch(() => {});
            }
        }).catch(err => console.log('SW failed:', err));
    });

    // 当新 Service Worker 激活并通过 clients.claim() 接管控制权时，自动重载页面以应用最新资源
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            console.log('[PWA] Service Worker 已更新并接管，立即刷新页面...');
            window.location.reload();
        }
    });
}

// 供用户或调试调用的彻底清除缓存并强制刷新工具
window.forceUpdateAppCache = async function() {
    try {
        if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            for (let reg of regs) {
                await reg.unregister();
            }
        }
        if ('caches' in window) {
            const keys = await caches.keys();
            for (let key of keys) {
                await caches.delete(key);
            }
        }
        console.log('[PWA] 缓存与 Service Worker 已全部清除，正在强制重新载入...');
        window.location.reload(true);
    } catch (e) {
        console.error('[PWA] 清除缓存失败:', e);
        window.location.reload();
    }
};

// --- PWA 安装提示 ---
function initPWAInstallPrompt() {
            // PWA安装逻辑
            const installBtn = document.getElementById('btn-install-pwa');
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredInstallPrompt = e;
                if (installBtn) installBtn.style.display = 'flex';
            });

            if (installBtn) {
                installBtn.addEventListener('click', async () => {
                    if (deferredInstallPrompt) {
                        deferredInstallPrompt.prompt();
                        await deferredInstallPrompt.userChoice;
                        deferredInstallPrompt = null;
                        installBtn.style.display = 'none';
                    }
                });
            }

            window.addEventListener('appinstalled', () => {
                deferredInstallPrompt = null;
                if (installBtn) installBtn.style.display = 'none';
            });
}
