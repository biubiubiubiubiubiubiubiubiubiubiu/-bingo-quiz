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
        window.onload = function () {
            initTheme();

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


        // --- 手势处理 (优化版) ---
        window.addEventListener('load', () => {
            try {
                // 初始化手势库
                const gesture = new TinyGesture(document.body);

                // 监听右滑事件 (Swipe Right)
                gesture.on('swiperight', (event) => {
                    const dashboardView = document.getElementById('view-dashboard');
                    const quizView = document.getElementById('view-quiz');

                    // 1. 如果在仪表盘界面，右滑 = 返回首页
                    if (dashboardView.style.display === 'block') {
                        // 防止在输入框或选择文字时误触
                        if (event.target.tagName === 'INPUT' ||
                            event.target.tagName === 'SELECT' ||
                            window.getSelection().toString()) return;

                        history.back();
                    }

                    // 2. 如果在答题界面，右滑 = 退出/交卷
                    if (quizView.style.display === 'block') {
                        // 防止在输入框或选择文字时误触
                        if (event.target.tagName === 'INPUT' ||
                            event.target.tagName === 'SELECT' ||
                            window.getSelection().toString()) return;

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
