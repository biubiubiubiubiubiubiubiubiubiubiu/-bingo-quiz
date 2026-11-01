/**
 * Bingo Quiz - SheetJS 动态按需加载器 (XLSXLoader)
 * 作用：首屏不加载近 900KB 的 xlsx.full.min.js，仅在导入/导出 Excel 时按需动态注入执行。
 * 具备单例并发锁定、超时熔断与离线容错能力。
 */
(function(window) {
    'use strict';

    let loadPromise = null;
    const SCRIPT_PATH = 'vendor/xlsx.full.min.js';
    const TIMEOUT_MS = 15000;

    const XLSXLoader = {
        /**
         * 检查 SheetJS 是否已经就绪
         * @returns {boolean}
         */
        isLoaded() {
            return typeof window.XLSX !== 'undefined';
        },

        /**
         * 动态按需加载 SheetJS 库
         * @returns {Promise<any>} 返回 XLSX 全局对象
         */
        async load() {
            if (this.isLoaded()) {
                return window.XLSX;
            }

            if (loadPromise) {
                return loadPromise;
            }

            loadPromise = new Promise((resolve, reject) => {
                let timer = null;
                const script = document.createElement('script');
                script.src = SCRIPT_PATH;
                script.async = true;

                const cleanup = () => {
                    if (timer) clearTimeout(timer);
                    script.onload = null;
                    script.onerror = null;
                };

                timer = setTimeout(() => {
                    cleanup();
                    loadPromise = null;
                    if (script.parentNode) script.parentNode.removeChild(script);
                    const timeoutErr = new Error('Excel 处理组件加载超时，请检查网络或离线缓存状态');
                    console.error('[XLSXLoader]', timeoutErr);
                    reject(timeoutErr);
                }, TIMEOUT_MS);

                script.onload = () => {
                    cleanup();
                    if (typeof window.XLSX !== 'undefined') {
                        console.info('[XLSXLoader] SheetJS 动态加载就绪 (首屏节省 ~881KB)');
                        resolve(window.XLSX);
                    } else {
                        loadPromise = null;
                        const err = new Error('SheetJS 脚本加载成功但未检测到全局 XLSX 对象');
                        console.error('[XLSXLoader]', err);
                        reject(err);
                    }
                };

                script.onerror = (err) => {
                    cleanup();
                    loadPromise = null;
                    if (script.parentNode) script.parentNode.removeChild(script);
                    const loadErr = new Error('Excel 模块加载失败，请确认 vendor/xlsx.full.min.js 文件存在');
                    console.error('[XLSXLoader]', loadErr, err);
                    reject(loadErr);
                };

                document.head.appendChild(script);
            });

            return loadPromise;
        }
    };

    window.XLSXLoader = XLSXLoader;
})(window);
