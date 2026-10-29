// --- PWA Service Worker 注册 ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('SW registered:', reg);
        }).catch(err => console.log('SW failed:', err));
    });
}

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
