// --- 全局状态变量 ---
        let currentDb = null; // { id, name, questions, progress }
        let currentQuiz = []; // 当前正在做的题
        let userAnswers = {}; // 用户当前选择
        let isReviewMode = false; // 是否处于回看模式
        let lastCompletedQuiz = []; // 用于交卷后回看
        let lastCompletedAnswers = {}; // 用于交卷后回看
        let lastVisibleQuestionIndex = 0;
        let masteredInSession = 0; // 用于“啃硬骨头”模式的计数
        let deferredInstallPrompt = null;
        let quizType = 'random';
        let childFeedbackTimeout = null; // 新增：用于儿童模式反馈的计时器

        // --- 做题体验增强专属状态 ---
        let flaggedQuestions = new Set(); // 标记疑难的题目索引 (📌)
        let eliminatedOptions = {}; // 排除掉的选项 { qIdx: ['A', 'C'] }
        let currentSingleIndex = 0; // 单题沉浸模式当前题号
        let quizDisplayMode = localStorage.getItem('bingo_display_mode') || 'single'; // 'single' | 'list'
        let quizFeedbackMode = localStorage.getItem('bingo_feedback_mode') || 'instant'; // 'instant' | 'exam'
        let lastSessionWrongQuestions = []; // 用于考后消灭错题闭环


        // --- 主题切换 ---
        function initTheme() {
            const t = localStorage.getItem('app_theme');
            if (t) document.documentElement.setAttribute('data-theme', t);
        }
        function toggleTheme() {
            const html = document.documentElement;
            if (isChildMode) {
                const currentTheme = html.getAttribute('data-theme');
                // 在儿童模式下，我们只在 'girl' 和 'boy' 之间切换
                const newTheme = (currentTheme === 'boy') ? 'girl' : 'boy';
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('app_kid_theme', newTheme);
            } else {
                // 普通模式的逻辑保持不变
                const isDark = html.getAttribute('data-theme') === 'everforest';
                const newTheme = isDark ? 'light' : 'everforest';
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('app_theme', isDark ? 'light' : 'everforest');
            }
        }


// --- 初始化 ---
        
        // --- Material Design 3 (M3) 交互系统 ---
        function initM3Ripple() {
            document.addEventListener('pointerdown', function (e) {
                const target = e.target.closest('.m3-ripple, .btn, .m3-btn, .option-row, .db-list-item, .history-item');
                if (!target || target.disabled || target.classList.contains('disabled')) return;

                const rect = target.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height) * 2;
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                const wave = document.createElement('span');
                wave.className = 'm3-ripple-wave';
                wave.style.width = `${size}px`;
                wave.style.height = `${size}px`;
                wave.style.left = `${x}px`;
                wave.style.top = `${y}px`;

                target.appendChild(wave);
                setTimeout(() => {
                    if (wave.parentNode) wave.parentNode.removeChild(wave);
                }, 550);
            });
        }

        function initTopAppBarScroll() {
            window.addEventListener('scroll', function () {
                const scrolled = window.scrollY > 8;
                document.querySelectorAll('.m3-top-app-bar, .nav-bar').forEach(bar => {
                    bar.classList.toggle('scrolled', scrolled);
                });
            }, { passive: true });
        }

        function initSegmentedButtons() {
            document.addEventListener('click', function (e) {
                const btn = e.target.closest('.m3-segmented-button__btn');
                if (!btn) return;
                const group = btn.closest('.m3-segmented-button');
                if (!group) return;
                const targetSelectId = group.getAttribute('data-for');
                const select = targetSelectId ? document.getElementById(targetSelectId) : null;
                const val = btn.getAttribute('data-val');

                group.querySelectorAll('.m3-segmented-button__btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (select) {
                    select.value = val;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        }

        function syncSegmentedButtons() {
            document.querySelectorAll('.m3-segmented-button').forEach(group => {
                const targetSelectId = group.getAttribute('data-for');
                const select = targetSelectId ? document.getElementById(targetSelectId) : null;
                if (!select) return;
                const currentVal = select.value;
                group.querySelectorAll('.m3-segmented-button__btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-val') === currentVal);
                });
            });
        }

        // --- M3 更多操作菜单 (Overflow Menu) ---
        function toggleOverflowMenu(e) {
            if (e) e.stopPropagation();
            const menu = document.getElementById('home-overflow-menu');
            const btn = document.getElementById('btn-more-options');
            if (!menu) return;
            const isShow = menu.classList.toggle('show');
            if (btn) btn.setAttribute('aria-expanded', isShow ? 'true' : 'false');
        }

        function closeOverflowMenu() {
            const menu = document.getElementById('home-overflow-menu');
            const btn = document.getElementById('btn-more-options');
            if (menu && menu.classList.contains('show')) {
                menu.classList.remove('show');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            }
        }

        function handleMenuAction(action) {
            closeOverflowMenu();
            if (action === 'exportBackup') {
                if (typeof exportBackup === 'function') exportBackup();
            } else if (action === 'importBackup') {
                const input = document.getElementById('backup-input');
                if (input) input.click();
            } else if (action === 'deleteAllData') {
                if (typeof deleteAllData === 'function') deleteAllData();
            }
        }

        function initOverflowMenu() {
            document.addEventListener('click', function (e) {
                if (!e.target.closest('.m3-menu-anchor')) {
                    closeOverflowMenu();
                }
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                    closeOverflowMenu();
                }
            });
        }

        window.onload = function () {
            initM3Ripple();
            initTopAppBarScroll();
            initSegmentedButtons();
            initTheme();
            initOverflowMenu();

            const currentHash = window.location.hash;
            if (currentHash.startsWith('#dashboard/')) {
                const dbId = currentHash.split('/')[1];
                history.replaceState({ view: 'dashboard', dbId: dbId }, '', currentHash);
                updateView({ view: 'dashboard', dbId: dbId });
            } else {
                history.replaceState({ view: 'home' }, '', '#home');
                updateView({ view: 'home' });
            }

            initPWAInstallPrompt();

            initChildMode();
        };


        // --- 全局防手滑刷新/关闭 ---
        window.addEventListener('beforeunload', function (e) {
            // 只有在模拟考试且未交卷时才拦截
            if (quizType === 'mock_exam' && !isReviewMode) {
                // 标准做法，虽然现代浏览器可能不会显示自定义文本，但会弹出默认警告
                e.preventDefault();
                e.returnValue = '正在考试中，确定要离开吗？';
                return '正在考试中，确定要离开吗？';
            }
            // 普通练习时，我们有 saveWipQuiz 自动保存，所以不需要拦截，让它直接关
        });


        // --- 手势与键盘快捷处理 (优化版) ---
        window.addEventListener('load', () => {
            try {
                // 初始化手势库
                const gesture = new TinyGesture(document.body);

                // 监听左滑事件 (Swipe Left: 单题模式下切到下一题)
                gesture.on('swipeleft', (event) => {
                    const quizView = document.getElementById('view-quiz');
                    if (quizView && quizView.style.display === 'block') {
                        if (event.target.tagName === 'INPUT' ||
                            event.target.tagName === 'SELECT' ||
                            window.getSelection().toString()) return;

                        if (typeof quizDisplayMode !== 'undefined' && quizDisplayMode === 'single') {
                            if (typeof nextSingleQuestion === 'function') nextSingleQuestion();
                        }
                    }
                });

                // 监听右滑事件 (Swipe Right)
                gesture.on('swiperight', (event) => {
                    const dashboardView = document.getElementById('view-dashboard');
                    const quizView = document.getElementById('view-quiz');

                    // 1. 如果在仪表盘界面，右滑 = 返回首页
                    if (dashboardView && dashboardView.style.display === 'block') {
                        // 防止在输入框或选择文字时误触
                        if (event.target.tagName === 'INPUT' ||
                            event.target.tagName === 'SELECT' ||
                            window.getSelection().toString()) return;

                        history.back();
                    }

                    // 2. 如果在答题界面，右滑 = 上一题 / 退出
                    if (quizView && quizView.style.display === 'block') {
                        // 防止在输入框或选择文字时误触
                        if (event.target.tagName === 'INPUT' ||
                            event.target.tagName === 'SELECT' ||
                            window.getSelection().toString()) return;

                        // 如果在单题沉浸模式且不是第一题，右滑 = 上一题
                        if (typeof quizDisplayMode !== 'undefined' && quizDisplayMode === 'single' && currentSingleIndex > 0) {
                            if (typeof prevSingleQuestion === 'function') prevSingleQuestion();
                            return;
                        }

                        // 核心逻辑修改：
                        // 如果是【模拟考试】且【非回看模式】，调用 handleQuizExit() 来触发弹窗逻辑
                        if (quizType === 'mock_exam' && !isReviewMode) {
                            handleQuizExit();
                        } else {
                            // 其他情况（普通练习、回看模式），直接保存进度并返回
                            if (!isReviewMode) {
                                saveWipQuiz(); // 确保普通练习手势退出也能保存进度
                            }
                            history.back();
                        }
                    }
                });
            } catch (e) {
                console.log("Gesture library load failed or not compatible", e);
            }
        });

        // --- 桌面端全键盘极速做题快捷键系统 ---
        window.addEventListener('keydown', (e) => {
            const quizView = document.getElementById('view-quiz');
            if (!quizView || quizView.style.display !== 'block') return;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            const key = e.key.toUpperCase();
            const currentIdx = (typeof quizDisplayMode !== 'undefined' && quizDisplayMode === 'single')
                ? currentSingleIndex : (typeof lastVisibleQuestionIndex !== 'undefined' ? lastVisibleQuestionIndex : 0);
            const currentQuestion = (currentQuiz && currentQuiz[currentIdx]) ? currentQuiz[currentIdx] : null;

            // 1. 选项快捷键 (A-F, 1-6)
            const numToLetter = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E', '6': 'F' };
            const optLetter = numToLetter[e.key] || (['A', 'B', 'C', 'D', 'E', 'F'].includes(key) ? key : null);
            if (optLetter && currentQuestion && currentQuestion.o && currentQuestion.o[optLetter]) {
                e.preventDefault();
                selectOption(null, currentIdx, optLetter, currentQuestion.t);
                return;
            }

            // 2. 切题快捷键 (方向键左右，或 J/K)
            if (typeof quizDisplayMode !== 'undefined' && quizDisplayMode === 'single') {
                if (e.key === 'ArrowRight' || key === 'K') {
                    e.preventDefault();
                    if (typeof nextSingleQuestion === 'function') nextSingleQuestion();
                    return;
                }
                if (e.key === 'ArrowLeft' || key === 'J') {
                    e.preventDefault();
                    if (typeof prevSingleQuestion === 'function') prevSingleQuestion();
                    return;
                }
            }

            // 3. 标记键 (F)
            if (key === 'F') {
                e.preventDefault();
                if (typeof toggleFlagQuestion === 'function') toggleFlagQuestion(currentIdx);
                return;
            }

            // 4. 答题卡键 (P)
            if (key === 'P') {
                e.preventDefault();
                if (typeof toggleAnswerPalette === 'function') toggleAnswerPalette();
                return;
            }

            // 5. 偷看/展开解析键 (E)
            if (key === 'E') {
                e.preventDefault();
                if (typeof toggleAnalysis === 'function') toggleAnalysis(currentIdx);
                return;
            }
        });
