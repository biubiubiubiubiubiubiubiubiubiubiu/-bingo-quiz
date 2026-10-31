        // --- Navigation & History ---
        function updateView(state) {
            document.getElementById('view-home').style.display = 'none';
            document.getElementById('view-dashboard').style.display = 'none';
            document.getElementById('view-quiz').style.display = 'none';
            document.getElementById('modal-score').style.display = 'none';
            stopTimer();
            if (state && state.view !== 'quiz' && typeof cleanupQuizSession === 'function') {
                cleanupQuizSession();
            }

            if (!state || !state.view) {
                state = { view: 'home' };
            }

            switch (state.view) {
                case 'dashboard':
                    document.getElementById('view-dashboard').style.display = 'block';
                    setupDashboard(state.dbId);
                    break;
                case 'quiz':
                    document.getElementById('view-quiz').style.display = 'block';
                    break;
                default: // home
                    document.getElementById('view-home').style.display = 'block';
                    renderDbList();
                    if (typeof updatePetWidgets === 'function') updatePetWidgets();
                    break;
            }

            if (window.roamingPet && typeof window.roamingPet.clampToBounds === 'function') {
                window.roamingPet.clampToBounds();
            }
        }

        // --- Navigation & History (核心修改版) ---

        window.onpopstate = function (event) {
            // 【核心拦截逻辑】
            // 如果当前处于“模拟考试”且“非回看”状态
            if (quizType === 'mock_exam' && !isReviewMode) {
                // 弹出系统级确认框（这会暂停 JS 执行）
                const confirmExit = confirm('⚠️ 正在模拟考试中！\n\n系统检测到返回操作（或侧滑）。\n现在退出将强制交卷。\n\n确定要交卷吗？');

                if (confirmExit) {
                    // 用户点“确定”：虽然浏览器URL已经变了，但我们手动执行交卷流程
                    // true 代表自动交卷，不再重复弹窗
                    submitPaper(true);

                    // 注意：此时 URL 可能已经变回了 dashboard，但界面被 submitPaper 留在了 quiz
                    // 这对于 SPA 是允许的，等用户在成绩单点击“回狗窝”时会修正
                    return;
                } else {
                    // 用户点“取消”（我想留下）：
                    // 关键操作！因为刚才的侧滑已经让浏览器后退了一步
                    // 我们必须立刻把这个状态“推”回去，恢复原来的 URL 和状态
                    history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
                    return; // 阻止 updateView 执行，界面保持不变
                }
            }

            // --- 普通模式逻辑 (未变) ---
            if (event.state) {
                updateView(event.state);
            } else {
                updateView({ view: 'home' });
            }
        };


        function setupDashboard(id) {
            const meta = getMeta().find(m => m.id === id);
            if (!meta) {
                history.pushState({ view: 'home' }, '', '#home');
                updateView({ view: 'home' });
                return;
            }

            const questions = JSON.parse(localStorage.getItem(`bingo_db_${id}`) || '[]');
            const progress = parseInt(localStorage.getItem(`bingo_prog_${id}`) || '0');
            currentDb = { ...meta, questions, progress };

            const wipData = localStorage.getItem(`bingo_wip_${id}`);
            const resumeBtn = document.getElementById('btn-resume-quiz');
            if (wipData) {
                const wipState = JSON.parse(wipData);
                const total = wipState.currentQuiz.length;
                const current = (wipState.lastVisibleQuestionIndex || 0) + 1;
                resumeBtn.innerHTML = `继续上次的进度 (${current}/${total} 根)`;
                resumeBtn.style.display = 'block';
            } else {
                resumeBtn.style.display = 'none';
            }

            document.getElementById('dash-title').innerText = meta.name;
            document.getElementById('dash-count').innerText = questions.length;
            // 顶部大进度条
                        document.getElementById('dash-progress').innerText = `${progress} / ${questions.length}`;
            
            // --- M3 Linear Progress Bar & Segmented Buttons ---
            const progBar = document.getElementById('dash-progress-bar');
            if (progBar && questions.length > 0) {
                const pct = Math.min(100, Math.round((progress / questions.length) * 100));
                progBar.style.width = `${pct}%`;
            } else if (progBar) {
                progBar.style.width = '0%';
            }
            if (typeof syncSegmentedButtons === 'function') syncSegmentedButtons();
            
            // --- 进度显示优化 ---
            // 小标题上的进度显示
            const progDisplay = document.getElementById('current-prog-display');
            if(progDisplay) progDisplay.innerText = progress;

            // 设置顺序练习的输入框逻辑
            const startInput = document.getElementById('sequence-start-input');
            const maxHint = document.getElementById('max-count-hint');

            // 默认从当前进度+1开始
            let defaultStart = progress >= questions.length ? 1 : progress + 1;

            startInput.value = defaultStart;
            startInput.max = questions.length;
            startInput.min = 1;
            // 占位符提示
            startInput.placeholder = `上次啃到 ${progress}`; 
            
            maxHint.innerText = `(共 ${questions.length} 根)`;
            // --- 新增代码 END ---

            const categoryContainer = document.getElementById('category-container');
            const categorySelect = document.getElementById('category-select');
            const categories = [...new Set(questions.map(q => q.c || '未分类'))];

            if (categories.length > 1 || (categories.length === 1 && categories[0] !== '未分类')) {
                categorySelect.innerHTML = '<option value="all">全部</option>';
                categories.forEach(c => {
                    categorySelect.innerHTML += `<option value="${c}">${c}</option>`;
                });
                categoryContainer.style.display = 'block';
            } else {
                categoryContainer.style.display = 'none';
            }

            const allMeta = getMeta();
            const target = allMeta.find(m => m.id === id);
            if (target) {
                target.lastUsed = Date.now();
                saveMeta(allMeta);
            }

            // 同步选项防背乱序开关状态 (默认开启)
            const shuffleToggle = document.getElementById('toggle-option-shuffle');
            if (shuffleToggle) {
                shuffleToggle.checked = localStorage.getItem('bingo_shuffle_options') !== 'false';
            }

            renderHistoryList(id);
            if (typeof updatePetWidgets === 'function') updatePetWidgets();
        }

        function handleOptionShuffleChange(checked) {
            localStorage.setItem('bingo_shuffle_options', checked ? 'true' : 'false');
        }

        // 重置进度到 0

        function resetProgress() {
            if (!currentDb) return;
            if (!confirm('确定要重置“按顺序啃”的进度吗？\n下次将从第 1 根骨头重新开始。')) return;

            // 重置存储
            localStorage.setItem(`bingo_prog_${currentDb.id}`, 0);
            currentDb.progress = 0;

            // 同时清除“继续上次”的暂存，因为我们要重新开始了
            clearWipQuiz();
            const resumeBtn = document.getElementById('btn-resume-quiz');
            if (resumeBtn) resumeBtn.style.display = 'none';

            // 更新 UI
            setupDashboard(currentDb.id);
            alert('汪！进度已重置，从头开始吧！');
        }

        // 手动修改输入框时触发（可选，目前通过 startQuiz 自动处理更自然，这里留空或用于高级逻辑）

        function manualUpdateProgress() {
            // 这里可以不做操作，因为用户可能只是想临时回看前面的题
            // 只有当点击“开啃”时，我们才决定是否更新进度
        }

        // --- 初始化 ---

        let scrollTimeout;
        function handleQuizScroll() {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const quizNav = document.querySelector('#view-quiz .nav-bar');
                if (!quizNav) return;
                const quizNavHeight = quizNav.offsetHeight;
                const questionElements = document.querySelectorAll('#quiz-container .ios-card');

                for (let i = 0; i < questionElements.length; i++) {
                    const rect = questionElements[i].getBoundingClientRect();
                    if (rect.top >= quizNavHeight && rect.top < window.innerHeight) {
                        lastVisibleQuestionIndex = i;
                        return;
                    }
                }
            }, 150);
        }
        function setupQuizScrollListener() {
            window.addEventListener('scroll', handleQuizScroll, true);
        }
        function removeQuizScrollListener() {
            window.removeEventListener('scroll', handleQuizScroll, true);
        }

        // --- 首页：题库列表逻辑 ---

        function renderDbList() {
            const list = getMeta();
            const container = document.getElementById('db-list-container');
            const empty = document.getElementById('empty-state');

            container.innerHTML = '';
            if (list.length === 0) {
                empty.style.display = 'block';
                return;
            }
            empty.style.display = 'none';

            list.sort((a, b) => b.lastUsed - a.lastUsed);

            list.forEach(db => {
                const div = document.createElement('div');
                div.className = 'db-list-item m3-card m3-card--elevated ios-card m3-ripple';
                div.innerHTML = `
                <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:40px; height:40px; border-radius:50%; background:var(--md-sys-color-primary-container); color:var(--md-sys-color-on-primary-container); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">
                        🦴
                    </div>
                    <div class="db-info">
                        <h4 style="margin:0 0 4px 0; font-size:16px; font-weight:600; color:var(--md-sys-color-on-surface);">${escapeHtml(db.name)}</h4>
                        <p style="margin:0; font-size:13px; color:var(--md-sys-color-on-surface-variant);">共 ${db.count} 根骨头 · 上次开啃 ${new Date(db.lastUsed).toLocaleDateString()}</p>
                    </div>
                </div>
                <div style="color:var(--md-sys-color-on-surface-variant); font-size:18px; font-weight:700;">›</div>
            `;
                div.onclick = () => openDashboard(db.id);
                container.appendChild(div);
            });
        }

        // --- 导入逻辑 (SheetJS) ---

        function openDashboard(id) {
            history.pushState({ view: 'dashboard', dbId: id }, '', `#dashboard/${id}`);
            updateView({ view: 'dashboard', dbId: id });
        }


        function goHome() {
            history.pushState({ view: 'home' }, '', '#home');
            updateView({ view: 'home' });
        }


        function renderHistoryList(dbId) {
            const list = JSON.parse(localStorage.getItem(`bingo_hist_${dbId}`) || '[]');
            const container = document.getElementById('history-list');
            container.innerHTML = '';

            if (list.length === 0) {
                document.getElementById('no-history-btn').style.display = 'block';
            } else {
                document.getElementById('no-history-btn').style.display = 'none';
                list.slice().reverse().slice(0, 10).forEach((item, index) => {
                    const originalIndex = list.length - 1 - index;
                    const scoreClass = item.score >= 90 ? 'score-high' : (item.score < 60 ? 'score-low' : '');
                    const el = document.createElement('div');
                    el.className = 'history-item m3-ripple';

                    let quizName = '随便刨一个';
                    if (item.type === 'sequence') quizName = '按序开啃';
                    if (item.type === 'mock_exam') quizName = '模拟开啃';

                    el.innerHTML = `
                    <div style="flex-grow: 1; cursor: pointer;" onclick="loadReview(${originalIndex})">
                        <div style="font-weight:600; font-size:14px; color:var(--md-sys-color-on-surface);">${quizName}</div>
                        <div style="font-size:12px; color:var(--text-sub);">${new Date(item.date).toLocaleString()}</div>
                    </div>
                    <div class="score-badge ${scoreClass}" style="margin-right:8px;">${item.score}</div>
                    <button class="btn-delete-hist m3-ripple" onclick="event.stopPropagation(); deleteHistoryRecord(${originalIndex})" title="删除此记录">×</button>
                `;
                    container.appendChild(el);
                });
            }

            const wrongQuestions = getAllWrongQuestions(dbId);
            const wrongAnswersBtn = document.getElementById('btn-wrong-answers');
            const exportWrongBtn = document.getElementById('btn-export-wrong');
            if (exportWrongBtn) exportWrongBtn.style.display = wrongQuestions.length > 0 ? 'inline-flex' : 'none';
            if (wrongQuestions.length > 0) {
                wrongAnswersBtn.style.display = 'block';
                wrongAnswersBtn.innerText = `啃硬骨头 (${wrongQuestions.length} 根)`;
            } else {
                wrongAnswersBtn.style.display = 'none';
            }
        }

