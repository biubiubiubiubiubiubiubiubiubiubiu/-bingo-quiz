// --- PWA Service Worker 注册、柔性无感热更新与安装管理 ---
(function(window) {
    'use strict';

    let refreshing = false;
    let waitingWorker = null;
    let pwaInstallPrompt = null;

    /**
     * 显示 Material Design 3 风格的新版本更新提示 Snackbar
     */
    function showUpdateSnackbar(worker) {
        waitingWorker = worker;

        // 防止重复插入多个弹窗
        if (document.getElementById('pwa-update-snackbar')) return;

        const snackbar = document.createElement('div');
        snackbar.id = 'pwa-update-snackbar';
        snackbar.setAttribute('role', 'alert');
        snackbar.style.cssText = `
            position: fixed;
            bottom: calc(24px + env(safe-area-inset-bottom, 0px));
            left: 50%;
            transform: translateX(-50%) translateY(120px);
            background: var(--md-sys-color-inverse-surface, #2B322F);
            color: var(--md-sys-color-inverse-on-surface, #ECF2EE);
            padding: 12px 16px 12px 20px;
            border-radius: 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 10000;
            max-width: 92vw;
            box-sizing: border-box;
            transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
            opacity: 0;
            font-size: 14px;
        `;

        snackbar.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:0;">
                <span style="font-size:18px;">✨</span>
                <span style="font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    斌狗新版本已就绪！
                </span>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                <button type="button" id="btn-sw-dismiss" style="
                    background: transparent;
                    border: none;
                    color: var(--md-sys-color-inverse-on-surface, #ECF2EE);
                    opacity: 0.8;
                    padding: 6px 10px;
                    font-size: 13px;
                    border-radius: 8px;
                    cursor: pointer;
                ">稍后</button>
                <button type="button" id="btn-sw-apply" style="
                    background: var(--md-sys-color-inverse-primary, #53DBC8);
                    color: var(--md-sys-color-inverse-surface, #003731);
                    border: none;
                    padding: 6px 14px;
                    font-size: 13px;
                    font-weight: bold;
                    border-radius: 10px;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
                ">立即应用</button>
            </div>
        `;

        document.body.appendChild(snackbar);

        // 入场动画
        requestAnimationFrame(() => {
            snackbar.style.transform = 'translateX(-50%) translateY(0)';
            snackbar.style.opacity = '1';
        });

        // 按钮事件绑定
        const applyBtn = document.getElementById('btn-sw-apply');
        const dismissBtn = document.getElementById('btn-sw-dismiss');

        if (applyBtn) {
            applyBtn.onclick = () => {
                applyBtn.disabled = true;
                applyBtn.innerText = '更新中...';
                if (waitingWorker) {
                    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                } else {
                    window.location.reload();
                }
            };
        }

        if (dismissBtn) {
            dismissBtn.onclick = () => {
                snackbar.style.transform = 'translateX(-50%) translateY(120px)';
                snackbar.style.opacity = '0';
                setTimeout(() => {
                    if (snackbar.parentNode) snackbar.parentNode.removeChild(snackbar);
                }, 350);
            };
        }
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(reg => {
                console.info('[PWA] Service Worker 注册成功:', reg.scope);

                // 1. 若当前已有 waiting 状态的 Service Worker，立即提示用户更新
                if (reg.waiting) {
                    showUpdateSnackbar(reg.waiting);
                }

                // 2. 监听后续的更新发现
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        // 当新 worker 安装完成且已有活跃 controller 时，表示存在新版本可用
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.info('[PWA] 检测到新版 Service Worker 已下载就绪，弹出柔性更新提示');
                            showUpdateSnackbar(newWorker);
                        }
                    });
                });

                // 页面激活时触发更新巡检
                if (typeof reg.update === 'function') {
                    reg.update().catch(() => {});
                }
            }).catch(err => {
                console.warn('[PWA] Service Worker 注册失败:', err);
            });
        });

        // 当新 Service Worker 真正接管（用户主动点击了立即更新）时，平稳刷新页面
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.info('[PWA] Service Worker 控制权已切换，平稳重新载入应用...');
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
            console.info('[PWA] 缓存与 Service Worker 已全部清除，正在强制重新载入...');
            window.location.reload(true);
        } catch (e) {
            console.error('[PWA] 清除缓存失败:', e);
            window.location.reload();
        }
    };

    // --- PWA 安装提示 ---
    window.initPWAInstallPrompt = function() {
        const installBtn = document.getElementById('btn-install-pwa');
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            pwaInstallPrompt = e;
            if (typeof deferredInstallPrompt !== 'undefined') {
                deferredInstallPrompt = e;
            }
            if (installBtn) installBtn.style.display = 'flex';
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (pwaInstallPrompt) {
                    pwaInstallPrompt.prompt();
                    await pwaInstallPrompt.userChoice;
                    pwaInstallPrompt = null;
                    if (typeof deferredInstallPrompt !== 'undefined') deferredInstallPrompt = null;
                    installBtn.style.display = 'none';
                }
            });
        }

        window.addEventListener('appinstalled', () => {
            pwaInstallPrompt = null;
            if (typeof deferredInstallPrompt !== 'undefined') deferredInstallPrompt = null;
            if (installBtn) installBtn.style.display = 'none';
        });
    };
})(window);
