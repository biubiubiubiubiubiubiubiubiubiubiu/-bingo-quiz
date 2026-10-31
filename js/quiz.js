        // --- HTML 安全转义 ---
        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // --- 选项防背乱序引擎 (Option Shuffling Engine) ---
        function isOptionShuffleEnabled() {
            return localStorage.getItem('bingo_shuffle_options') !== 'false';
        }

        function applyOptionShuffleToQuiz(questions) {
            if (!questions || !Array.isArray(questions)) return questions;
            if (!isOptionShuffleEnabled()) return questions;

            return questions.map(item => {
                // 判断题不乱序 (保持 A. 正确, B. 错误)
                if (item.t === '判断' || (item.o && Object.keys(item.o).length === 2 && (item.o.A === '正确' || item.o.A === '对'))) {
                    return { ...item };
                }
                if (!item.o || Object.keys(item.o).length <= 1) return { ...item };

                const originalKeys = Object.keys(item.o);
                const shuffledEntries = originalKeys.map(k => ({ oldKey: k, text: item.o[k] }));

                // Fisher-Yates 洗牌
                for (let i = shuffledEntries.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledEntries[i], shuffledEntries[j]] = [shuffledEntries[j], shuffledEntries[i]];
                }

                const newOptions = {};
                const oldToNewMap = {};
                shuffledEntries.forEach((entry, idx) => {
                    const newKey = String.fromCharCode(65 + idx);
                    newOptions[newKey] = entry.text;
                    oldToNewMap[entry.oldKey] = newKey;
                });

                let newAnswer = '';
                if (item.a) {
                    newAnswer = item.a.split('')
                        .map(k => oldToNewMap[k] || k)
                        .sort()
                        .join('');
                }

                return {
                    ...item,
                    o: newOptions,
                    a: newAnswer,
                    _isShuffled: true
                };
            });
        }

        // --- 翻牌闪记背题模式 (Flashcard Mode) ---
        function startFlashcardQuiz() {
            quizType = 'flashcard';
            isReviewMode = false;
            userAnswers = {};
            flaggedQuestions.clear();
            eliminatedOptions = {};
            currentSingleIndex = 0;
            lastVisibleQuestionIndex = 0;

            const countVal = document.getElementById('flashcard-count')?.value || '20';
            const selectedCategory = document.getElementById('category-select')?.value;
            let questionsForQuiz = currentDb.questions;

            if (selectedCategory && selectedCategory !== 'all') {
                questionsForQuiz = currentDb.questions.filter(q => (q.c || '未分类') === selectedCategory);
            }

            if (!questionsForQuiz || questionsForQuiz.length === 0) {
                alert('当前没有可供背诵的题目！');
                return;
            }

            const count = countVal === 'all' ? questionsForQuiz.length : parseInt(countVal);
            const shuffled = [...questionsForQuiz].sort(() => 0.5 - Math.random());
            currentQuiz = applyOptionShuffleToQuiz(shuffled.slice(0, count));

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });

            renderFlashcardView();
            updateQuizNavBarControls();
        }

        function renderFlashcardView() {
            const container = document.getElementById('quiz-container');
            container.innerHTML = '';
            container.className = 'flashcard-mode-view';

            const singleNav = document.getElementById('quiz-single-nav');
            if (singleNav) singleNav.style.display = 'none';
            const fabArea = document.getElementById('quiz-fab-area');
            if (fabArea) fabArea.style.display = 'none';

            const progEl = document.getElementById('quiz-progress-text');
            if (progEl) {
                progEl.innerText = `🎴 闪记 ${Math.min(currentSingleIndex + 1, currentQuiz.length)} / ${currentQuiz.length}`;
            }

            if (currentSingleIndex >= currentQuiz.length) {
                renderFlashcardCompletion();
                return;
            }

            const item = currentQuiz[currentSingleIndex];
            const stage = document.createElement('div');
            stage.className = 'flashcard-stage';

            let optionsHtml = '';
            if (item.o && Object.keys(item.o).length > 0) {
                optionsHtml = `
                    <div style="margin: 14px 0 8px 0; display:flex; flex-direction:column; gap:8px;">
                        ${Object.keys(item.o).map(k => `
                            <div style="background:var(--md-sys-color-surface-container); padding:8px 12px; border-radius:10px; font-size:14px; color:var(--md-sys-color-on-surface); text-align:left;">
                                <strong style="color:var(--md-sys-color-primary);">${k}.</strong> ${escapeHtml(item.o[k])}
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            let answerText = item.a;
            if (item.o && item.a) {
                const optTexts = item.a.split('').map(k => item.o[k] ? `${k} (${item.o[k]})` : k).join('，');
                if (optTexts) answerText = optTexts;
            }

            stage.innerHTML = `
                <div class="flashcard-card" id="flashcard-card-element" onclick="flipFlashcard()">
                    <!-- 正面 -->
                    <div class="flashcard-face flashcard-front">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span class="m3-badge" style="font-size:12px;">${escapeHtml(item.t || '单选')} · ${escapeHtml(item.c || '未分类')}</span>
                                <span style="font-size:12px; font-weight:700; color:var(--text-sub);">第 ${currentSingleIndex + 1} / ${currentQuiz.length} 张</span>
                            </div>
                            <div style="font-size:17px; font-weight:700; line-height:1.5; color:var(--md-sys-color-on-surface); margin-top:10px; text-align:left;">
                                ${escapeHtml(item.q)}
                            </div>
                            ${optionsHtml}
                        </div>
                        <div class="flashcard-hint-pill">
                            <span>👆 轻触卡片翻面看答案</span>
                        </div>
                    </div>

                    <!-- 背面 -->
                    <div class="flashcard-face flashcard-back">
                        <div style="text-align:left;">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                                <span class="m3-badge" style="background:#FFF3CD; color:#856404; font-size:12px;">⭐ 答案与解析</span>
                                <span style="font-size:12px; font-weight:700; color:var(--text-sub);">第 ${currentSingleIndex + 1} / ${currentQuiz.length} 张</span>
                            </div>
                            <div style="background:var(--md-sys-color-surface-container); border-left:4px solid var(--md-sys-color-success); padding:10px 14px; border-radius:8px; margin-bottom:14px;">
                                <div style="font-size:12px; color:var(--text-sub); margin-bottom:2px;">正确答案</div>
                                <div style="font-size:16px; font-weight:800; color:var(--md-sys-color-success);">${escapeHtml(answerText)}</div>
                            </div>
                            <div style="font-size:14px; color:var(--md-sys-color-on-surface-variant); line-height:1.6; max-height:160px; overflow-y:auto;">
                                <strong>【解析精编】</strong><br>
                                ${escapeHtml(item.e || '暂无详细解析，多读两遍加深印象吧！')}
                            </div>
                        </div>

                        <div class="flashcard-actions" onclick="event.stopPropagation()">
                            <button class="btn btn-warning m3-btn--tonal m3-ripple" style="flex:1; height:44px; font-weight:bold;" onclick="handleFlashcardAction(false)">
                                🤔 还不熟 (稍后再练)
                            </button>
                            <button class="btn btn-success m3-btn--filled m3-ripple" style="flex:1; height:44px; font-weight:bold;" onclick="handleFlashcardAction(true)">
                                💡 记住了 (下一个)
                            </button>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(stage);
        }

        function flipFlashcard() {
            const card = document.getElementById('flashcard-card-element');
            if (card) card.classList.toggle('flipped');
        }

        function handleFlashcardAction(mastered) {
            if (!mastered) {
                const currentItem = currentQuiz[currentSingleIndex];
                currentQuiz.push(currentItem);
            }
            currentSingleIndex++;
            renderFlashcardView();
        }

        function renderFlashcardCompletion() {
            const container = document.getElementById('quiz-container');
            container.innerHTML = `
                <div class="m3-card m3-card--elevated ios-card" style="text-align:center; max-width:480px; margin:30px auto; padding:32px 20px;">
                    <div style="font-size:56px; margin-bottom:12px;">🎉</div>
                    <h2 class="m3-title-large" style="margin:0 0 8px 0;">这组骨头全记住啦！</h2>
                    <p style="font-size:14px; color:var(--text-sub); margin-bottom:24px;">你已经完成了本组闪卡的全部背诵与回顾。</p>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <button class="btn btn-primary m3-btn--filled m3-ripple" onclick="startFlashcardQuiz()">🔂 再背一轮</button>
                        <button class="btn btn-ghost m3-btn--tonal m3-ripple" onclick="handleQuizExit()">回狗窝</button>
                    </div>
                </div>
            `;
        }

        function handleQuizExit() {
            // 如果是模拟考试模式，且并不是在回看错题（是在答题中）
            if (quizType === 'mock_exam' && !isReviewMode) {
                // 弹出警告
                if (confirm('⚠️ 正在模拟考试中！\n\n现在退出将强制交卷并生成成绩单，且无法撤销。\n\n确定要交卷吗？')) {
                    // 参数 true 代表自动交卷，不再次弹窗确认
                    submitPaper(true);
                    // 注意：submitPaper 会打开成绩 Modal，用户可以在成绩单上点击“回狗窝”离开
                }
            } else {
                // 普通模式，直接返回
                history.back();
            }
        }


        function startWrongAnswerQuiz() {
            const wipData = localStorage.getItem(`bingo_wip_${currentDb.id}`);
            if (wipData) {
                if (!confirm('汪！你之前藏的骨头还没啃完呢，现在就要挖个新坑吗？旧坑里的骨头可就没咯！')) {
                    return;
                }
            }
            clearWipQuiz();
            const wrongQuestions = getAllWrongQuestions(currentDb.id);

            if (wrongQuestions.length === 0) {
                alert('太棒了，没有发现错题！你就是最聪明的斌狗！');
                return;
            }

            quizType = 'wrong_review';
            isReviewMode = false;
            userAnswers = {};
            flaggedQuestions.clear();
            eliminatedOptions = {};
            currentSingleIndex = 0;
            if (typeof childSessionWrongQuestions !== 'undefined') childSessionWrongQuestions = [];
            quizFeedbackMode = localStorage.getItem('bingo_feedback_mode') || 'instant';
            masteredInSession = 0;
            currentQuiz = applyOptionShuffleToQuiz(wrongQuestions.sort(() => 0.5 - Math.random()));
            lastVisibleQuestionIndex = 0;
            if (window.PetEngine && PetEngine.Skills) { PetEngine.Skills.resetQuizSkills(); }

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });

            renderQuizItems();
            saveWipQuiz();
            setupQuizScrollListener();
            window.addEventListener('beforeunload', saveWipQuiz);
        }

        // --- 历史记录 ---

        function resumeQuiz() {
            const wipData = localStorage.getItem(`bingo_wip_${currentDb.id}`);
            if (!wipData) {
                console.error("No WIP data found to resume.");
                return;
            }

            const wipState = JSON.parse(wipData);
            currentQuiz = wipState.currentQuiz;
            userAnswers = wipState.userAnswers || {};
            quizType = wipState.quizType;
            isReviewMode = false;
            lastVisibleQuestionIndex = wipState.lastVisibleQuestionIndex || 0;
            currentSingleIndex = wipState.currentSingleIndex || 0;
            flaggedQuestions = new Set(wipState.flaggedQuestions || []);
            eliminatedOptions = {};
            quizFeedbackMode = (quizType === 'mock_exam') ? 'exam' : (localStorage.getItem('bingo_feedback_mode') || 'instant');

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });

            renderQuizItems();
            setupQuizScrollListener();
            window.addEventListener('beforeunload', saveWipQuiz);

            if (quizDisplayMode === 'list') {
                setTimeout(() => {
                    const targetEl = document.getElementById(`q-${lastVisibleQuestionIndex}`);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        targetEl.style.transition = 'outline 0.2s ease-in-out';
                        targetEl.style.outline = '3px solid var(--primary)';
                        setTimeout(() => {
                            targetEl.style.outline = 'none';
                        }, 1500);
                    }
                }, 100);
            }

            if (quizType === 'mock_exam') {
                const count = currentQuiz.length;
                const totalTime = count * 90;
                startTimer(totalTime);
            }
        }

        // --- 修复后的 loadReview 函数 ---

        function loadReview(historyIndex) {
            const id = currentDb.id;
            const list = JSON.parse(localStorage.getItem(`bingo_hist_${id}`) || '[]');
            const record = list[historyIndex];

            if (!record) return;

            currentQuiz = record.quizSnapshot;
            userAnswers = record.userAnswers || {};
            isReviewMode = true;
            flaggedQuestions.clear();
            eliminatedOptions = {};
            currentSingleIndex = 0;

            history.pushState({ view: 'quiz', dbId: id, history: true }, '', '#quiz');
            updateView({ view: 'quiz' });
            document.getElementById('quiz-fab-area').style.display = 'none'; // 回看不能交卷

            renderQuizItems();
        }

        // --- 模拟考试逻辑 ---

        let quizTimer = null;
        let timeLeft = 0;

        function startTimer(duration) {
            stopTimer();
            timeLeft = duration;
            updateTimerDisplay();
            quizTimer = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 0) {
                    stopTimer();
                    alert('时间到，自动交卷！');
                    submitPaper(true);
                }
            }, 1000);
        }

        function stopTimer() {
            clearInterval(quizTimer);
            quizTimer = null;
            document.getElementById('quiz-timer').innerText = '';
        }

        function updateTimerDisplay() {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            const timerEl = document.getElementById('quiz-timer');
            timerEl.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (timeLeft <= 30 && timeLeft > 10) {
                timerEl.style.color = 'var(--primary)';
            } else if (timeLeft <= 10) {
                timerEl.style.color = 'var(--danger)';
            } else {
                timerEl.style.color = 'var(--primary)';
            }
        }


        function startMockExam() {
            // 【重要修复】这里删除了 clearWipQuiz(); 
            // 这样模拟考试就不会清空之前的“继续进度”

            const count = parseInt(document.getElementById('mock-exam-count').value);
            const totalTime = count * 90;

            const selectedCategory = document.getElementById('category-select')?.value;
            let questionsForQuiz = currentDb.questions;

            if (selectedCategory && selectedCategory !== 'all') {
                questionsForQuiz = currentDb.questions.filter(q => (q.c || '未分类') === selectedCategory);
            }

            const shuffled = [...questionsForQuiz].sort(() => 0.5 - Math.random());
            currentQuiz = applyOptionShuffleToQuiz(shuffled.slice(0, count));

            if (currentQuiz.length === 0) {
                return alert('这个分类下没有足够的骨头进行模拟！');
            }

            quizType = 'mock_exam';
            isReviewMode = false;
            userAnswers = {};
            flaggedQuestions.clear();
            eliminatedOptions = {};
            currentSingleIndex = 0;
            if (typeof childSessionWrongQuestions !== 'undefined') childSessionWrongQuestions = [];
            quizFeedbackMode = 'exam';
            lastVisibleQuestionIndex = 0;

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });

            renderQuizItems();
            setupQuizScrollListener();

            startTimer(totalTime);
        }


        function finishExamAndExit() {
            // 彻底清理状态
            quizType = null;
            currentQuiz = [];
            userAnswers = {};
            document.getElementById('modal-score').style.display = 'none';
            history.back(); // 返回仪表盘
        }

        // --- 答题逻辑 ---

        function startQuiz(type) {
            const wipData = localStorage.getItem(`bingo_wip_${currentDb.id}`);
            if (wipData) {
                if (!confirm('汪！你之前藏的骨头还没啃完呢，现在就要挖个新坑吗？旧坑里的骨头可就没咯！')) {
                    return;
                }
            }
            clearWipQuiz();
            quizType = type;
            isReviewMode = false;
            userAnswers = {};
            flaggedQuestions.clear();
            eliminatedOptions = {};
            currentSingleIndex = 0;
            if (typeof childSessionWrongQuestions !== 'undefined') childSessionWrongQuestions = [];
            quizFeedbackMode = localStorage.getItem('bingo_feedback_mode') || 'instant';
            lastVisibleQuestionIndex = 0;

            const selectedCategory = document.getElementById('category-select')?.value;
            let questionsForQuiz = currentDb.questions;

            // 处理分类筛选
            if (selectedCategory && selectedCategory !== 'all') {
                questionsForQuiz = currentDb.questions.filter(q => (q.c || '未分类') === selectedCategory);
            }

            if (type === 'random') {
                // 随机模式
                const countValue = document.getElementById('random-count').value;
                const count = countValue === 'all' ? questionsForQuiz.length : parseInt(countValue);
                const shuffled = [...questionsForQuiz].sort(() => 0.5 - Math.random());
                currentQuiz = shuffled.slice(0, count);
            } else {
                // 顺序模式 (修复版)
                const countValue = document.getElementById('sequence-count').value;
                const totalQuestions = questionsForQuiz.length;
                const count = countValue === 'all' ? totalQuestions : parseInt(countValue);

                // 1. 获取输入框的值
                let inputStart = parseInt(document.getElementById('sequence-start-input').value);

                // 2. 校验合法性
                if (isNaN(inputStart) || inputStart < 1) inputStart = 1;
                // 如果输入超过总数，自动修正为最后一题（或者也可以提示用户）
                // 这里不做强制修正为总数，允许逻辑判断后续是否为空

                // 3. 计算数组索引 (输入是1开始，索引是0开始)
                const startIndex = inputStart - 1;

                // 4. 切片
                if (countValue === 'all') {
                    currentQuiz = questionsForQuiz.slice(startIndex);
                } else {
                    currentQuiz = questionsForQuiz.slice(startIndex, startIndex + count);
                }

                // 5. 空数据处理
                if (currentQuiz.length === 0) {
                    // 如果是因为其实位置超过了总数
                    if (startIndex >= totalQuestions) {
                        if (confirm('这就啃到底啦！要从第 1 根重新开始吗？')) {
                            document.getElementById('sequence-start-input').value = 1;
                            startQuiz('sequence'); // 递归调用，重新开始
                            return;
                        }
                    }
                    return alert('这个位置后面没有骨头啦！请调整起始位置。');
                }
            }

            currentQuiz = applyOptionShuffleToQuiz(currentQuiz);

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });

            renderQuizItems();
            saveWipQuiz();
            setupQuizScrollListener();
            window.addEventListener('beforeunload', saveWipQuiz);
        }

        // --- 顶栏控件与指示器同步 ---
        function updateQuizNavBarControls() {
            if (quizType === 'flashcard') {
                const progEl = document.getElementById('quiz-progress-text');
                if (progEl && currentQuiz) {
                    progEl.innerText = `🎴 闪记 ${Math.min(currentSingleIndex + 1, currentQuiz.length)} / ${currentQuiz.length}`;
                }
                const paletteBtn = document.getElementById('btn-quiz-palette');
                if (paletteBtn) paletteBtn.style.display = 'none';
                const viewBtn = document.getElementById('btn-quiz-view-mode');
                if (viewBtn) viewBtn.style.display = 'none';
                const feedbackBtn = document.getElementById('btn-quiz-feedback-mode');
                if (feedbackBtn) feedbackBtn.style.display = 'none';
                return;
            }

            const progEl = document.getElementById('quiz-progress-text');
            if (progEl && currentQuiz) {
                if (isChildMode) {
                    if (quizDisplayMode === 'single') {
                        progEl.innerText = `⭐ 寻宝 ${currentSingleIndex + 1} / ${currentQuiz.length}`;
                    } else {
                        const answered = Object.keys(userAnswers).length;
                        progEl.innerText = `⭐ 寻宝 ${answered} / ${currentQuiz.length}`;
                    }
                } else if (quizDisplayMode === 'single') {
                    progEl.innerText = `${currentSingleIndex + 1} / ${currentQuiz.length}`;
                } else {
                    progEl.innerText = `本轮 ${currentQuiz.length} 根骨头`;
                }
            }

            const paletteBtn = document.getElementById('btn-quiz-palette');
            if (paletteBtn) {
                paletteBtn.style.display = (quizDisplayMode === 'single') ? 'none' : 'inline-flex';
                paletteBtn.setAttribute('title', isChildMode ? '海底寻宝图 (P)' : '答题卡 (P)');
            }

            const viewBtn = document.getElementById('btn-quiz-view-mode');
            if (viewBtn) {
                viewBtn.style.display = 'inline-flex';
                const iconSingle = viewBtn.querySelector('.icon-view-single');
                const iconList = viewBtn.querySelector('.icon-view-list');
                if (quizDisplayMode === 'single') {
                    if (iconSingle) iconSingle.style.display = 'none';
                    if (iconList) iconList.style.display = 'block';
                    viewBtn.setAttribute('title', isChildMode ? '当前：卡片探险模式（点击切为长卷列表）' : '当前：单题沉浸模式（点击切为长卷列表）');
                } else {
                    if (iconSingle) iconSingle.style.display = 'block';
                    if (iconList) iconList.style.display = 'none';
                    viewBtn.setAttribute('title', isChildMode ? '当前：长卷列表模式（点击切为卡片探险）' : '当前：长卷列表模式（点击切为单题沉浸）');
                }
            }

            const fbBtn = document.getElementById('btn-quiz-feedback-mode');
            if (fbBtn) {
                if (quizType === 'mock_exam') {
                    fbBtn.style.display = 'none';
                } else {
                    fbBtn.style.display = 'inline-flex';
                    const iconInst = fbBtn.querySelector('.icon-mode-instant');
                    const iconExam = fbBtn.querySelector('.icon-mode-exam');
                    if (quizFeedbackMode === 'instant') {
                        if (iconInst) iconInst.style.display = 'block';
                        if (iconExam) iconExam.style.display = 'none';
                        fbBtn.classList.remove('is-exam');
                        fbBtn.setAttribute('title', isChildMode ? '当前：即时鼓励模式（点击切为勇士大挑战）' : '当前：即练即判模式（点击切为全卷测验）');
                    } else {
                        if (iconInst) iconInst.style.display = 'none';
                        if (iconExam) iconExam.style.display = 'block';
                        fbBtn.classList.add('is-exam');
                        fbBtn.setAttribute('title', isChildMode ? '当前：勇士大挑战模式（点击切为即时鼓励）' : '当前：全卷测验模式（点击切为即练即判）');
                    }
                }
            }

            const navBadge = document.getElementById('nav-palette-badge');
            if (navBadge && currentQuiz) {
                const answered = Object.keys(userAnswers).length;
                if (isChildMode) {
                    navBadge.innerText = `⭐ ${answered} / ${currentQuiz.length}`;
                } else {
                    navBadge.innerText = `已答 ${answered} / ${currentQuiz.length}`;
                }
            }

            if (typeof updatePetWidgets === 'function') updatePetWidgets();
            if (window.roamingPet && typeof window.roamingPet.clampToBounds === 'function') {
                window.roamingPet.clampToBounds();
            }
        }

        function toggleDisplayMode() {
            quizDisplayMode = (quizDisplayMode === 'single') ? 'list' : 'single';
            localStorage.setItem('bingo_display_mode', quizDisplayMode);
            renderQuizItems();
        }

        function toggleFeedbackMode() {
            if (quizType === 'mock_exam') {
                alert('模拟考试模式下默认采用全真考场规范，无法开启即时判定哦！');
                return;
            }
            quizFeedbackMode = (quizFeedbackMode === 'instant') ? 'exam' : 'instant';
            localStorage.setItem('bingo_feedback_mode', quizFeedbackMode);
            renderQuizItems();
        }

        // --- 答题卡抽屉控制逻辑 ---
        function toggleAnswerPalette() {
            const drawer = document.getElementById('answer-palette-drawer');
            if (!drawer) return;
            const isVisible = drawer.style.display === 'flex';
            if (isVisible) {
                drawer.style.display = 'none';
            } else {
                renderAnswerPaletteGrid();
                drawer.style.display = 'flex';
            }
        }

        function handlePaletteBackdropClick(e) {
            if (e.target && e.target.id === 'answer-palette-drawer') {
                toggleAnswerPalette();
            }
        }

        function renderAnswerPaletteGrid() {
            const grid = document.getElementById('palette-grid');
            const summary = document.getElementById('palette-summary-text');
            const legend = document.getElementById('palette-legend');
            const titleEl = document.querySelector('#answer-palette-drawer .palette-title');
            if (!grid || !currentQuiz) return;

            grid.innerHTML = '';
            const answeredCount = Object.keys(userAnswers).length;
            const flaggedCount = flaggedQuestions.size;

            if (isChildMode) {
                if (titleEl) titleEl.innerText = '🗺️ 海底寻宝图';
                if (summary) {
                    summary.innerText = `⭐ 已收集 ${answeredCount} 颗小珍珠 · 探险进度 ${answeredCount} / ${currentQuiz.length}`;
                }
                if (legend) {
                    legend.innerHTML = `
                        <span class="legend-pill"><span class="legend-dot child-answered"></span> ⭐ 已解开</span>
                        <span class="legend-pill"><span class="legend-dot unanswered"></span> 🐚 未解开</span>
                        <span class="legend-pill"><span class="legend-dot flagged"></span> 🚩 探险标记</span>
                        <span class="legend-pill"><span class="legend-dot current"></span> 🐾 正在这里</span>
                    `;
                }

                const pet = (typeof getPetData === 'function') ? getPetData() : null;
                const petIcon = (pet && typeof SEAFOOD_PETS !== 'undefined' && SEAFOOD_PETS[pet.type])
                    ? SEAFOOD_PETS[pet.type].avatar
                    : '🐾';

                currentQuiz.forEach((q, idx) => {
                    const uAns = userAnswers[idx];
                    const isAnswered = uAns !== undefined && uAns !== '';
                    const isFlagged = flaggedQuestions.has(idx);
                    const isCurrent = (currentSingleIndex === idx);

                    let statusClass = 'child-palette-item';
                    if (isAnswered) statusClass += ' palette-answered';
                    if (isCurrent) statusClass += ' palette-current';

                    const item = document.createElement('div');
                    item.className = `palette-item ${statusClass}`;

                    let content = `<span>${idx + 1}</span>`;
                    if (isAnswered) {
                        content = `<span style="font-size:18px;">⭐</span>`;
                    } else if (isCurrent) {
                        content = `<span style="font-size:16px;">${petIcon}</span>`;
                    }
                    if (isFlagged) {
                        content += `<span class="palette-flag-badge">🚩</span>`;
                    }
                    item.innerHTML = content;
                    item.onclick = () => jumpToQuestion(idx);
                    grid.appendChild(item);
                });

                const submitBtn = document.getElementById('btn-palette-submit');
                if (submitBtn) {
                    submitBtn.style.display = 'none';
                }
                return;
            }

            if (titleEl) titleEl.innerText = '📋 答题卡';
            if (summary) {
                summary.innerText = `已答 ${answeredCount} / ${currentQuiz.length} · 📌 标记 ${flaggedCount}`;
            }

            if (legend) {
                if (isReviewMode) {
                    legend.innerHTML = `
                        <span class="legend-pill"><span class="legend-dot correct"></span> 啃对</span>
                        <span class="legend-pill"><span class="legend-dot wrong"></span> 啃错</span>
                        <span class="legend-pill"><span class="legend-dot current"></span> 当前位置</span>
                    `;
                } else {
                    legend.innerHTML = `
                        <span class="legend-pill"><span class="legend-dot answered"></span> 已答</span>
                        <span class="legend-pill"><span class="legend-dot unanswered"></span> 未答</span>
                        <span class="legend-pill"><span class="legend-dot flagged"></span> 📌 标记</span>
                        <span class="legend-pill"><span class="legend-dot current"></span> 当前题</span>
                    `;
                }
            }

            currentQuiz.forEach((q, idx) => {
                const uAns = userAnswers[idx];
                const isAnswered = uAns !== undefined && uAns !== '';
                const isFlagged = flaggedQuestions.has(idx);
                const isCurrent = (quizDisplayMode === 'single') ? (currentSingleIndex === idx) : (lastVisibleQuestionIndex === idx);

                let statusClass = '';
                if (isReviewMode) {
                    statusClass = (uAns === q.a) ? 'palette-correct' : 'palette-wrong';
                } else {
                    if (isAnswered) statusClass = 'palette-answered';
                }
                if (isCurrent) statusClass += ' palette-current';

                const item = document.createElement('div');
                item.className = `palette-item ${statusClass}`;
                item.innerHTML = `<span>${idx + 1}</span>${isFlagged ? '<span class="palette-flag-badge">📌</span>' : ''}`;
                item.onclick = () => jumpToQuestion(idx);
                grid.appendChild(item);
            });

            const submitBtn = document.getElementById('btn-palette-submit');
            if (submitBtn) {
                submitBtn.style.display = isReviewMode ? 'none' : 'inline-block';
            }
        }

        function jumpToQuestion(idx) {
            toggleAnswerPalette();
            if (idx < 0 || idx >= currentQuiz.length) return;
            if (quizDisplayMode === 'single') {
                const dir = idx >= currentSingleIndex ? 'right' : 'left';
                currentSingleIndex = idx;
                renderSingleQuestion(idx, dir);
            } else {
                const el = document.getElementById(`q-${idx}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    el.style.transition = 'outline 0.2s ease-in-out';
                    el.style.outline = '3px solid var(--md-sys-color-primary)';
                    setTimeout(() => { el.style.outline = 'none'; }, 1500);
                }
            }
        }

        // --- 标记与排除法逻辑 ---
        function toggleFlagQuestion(idx) {
            if (flaggedQuestions.has(idx)) {
                flaggedQuestions.delete(idx);
            } else {
                flaggedQuestions.add(idx);
            }
            updateQuestionFlagUI(idx);
            saveWipQuiz();
        }

        function toggleFlagCurrentQuestion() {
            toggleFlagQuestion(currentSingleIndex);
        }

        function updateQuestionFlagUI(idx) {
            const isFlagged = flaggedQuestions.has(idx);
            const flagChar = isChildMode ? (isFlagged ? '🚩' : '📍') : (isFlagged ? '📌' : '📍');
            const flagTitle = isChildMode
                ? (isFlagged ? '已插探险小旗 (点击取消)' : '插上探险小旗 (F)')
                : (isFlagged ? '已标记 (点击取消)' : '标记疑难题 (F)');

            const navFlagBtn = document.getElementById('btn-nav-flag');
            if (navFlagBtn && quizDisplayMode === 'single' && currentSingleIndex === idx) {
                navFlagBtn.classList.toggle('is-flagged', isFlagged);
                navFlagBtn.innerHTML = `<span class="flag-icon">${flagChar}</span>`;
                navFlagBtn.setAttribute('title', flagTitle);
            }
            const cardFlagBtn = document.getElementById(`flag-btn-${idx}`);
            if (cardFlagBtn) {
                cardFlagBtn.classList.toggle('is-flagged', isFlagged);
                cardFlagBtn.innerHTML = flagChar;
                cardFlagBtn.setAttribute('title', flagTitle);
            }
            updateQuizNavBarControls();
        }

        function toggleEliminateOption(idx, key, e) {
            if (e) e.stopPropagation();
            if (isChildMode && typeof PetSound !== 'undefined' && PetSound.isEnabled()) {
                PetSound.bubble();
            }
            if (!eliminatedOptions[idx]) eliminatedOptions[idx] = [];
            const list = eliminatedOptions[idx];
            const pos = list.indexOf(key);
            if (pos > -1) {
                list.splice(pos, 1);
            } else {
                list.push(key);
            }
            const card = document.getElementById(`q-${idx}`);
            if (card) {
                const optRows = card.querySelectorAll('.option-row');
                optRows.forEach(row => {
                    const circle = row.querySelector('.option-circle');
                    if (circle && circle.innerText.trim() === key) {
                        row.classList.toggle('eliminated', list.includes(key));
                    }
                });
            }
        }

        // --- 单题沉浸模式卡片渲染 ---
        function renderSingleQuestion(idx, direction = 'none') {
            if (!currentQuiz || currentQuiz.length === 0) return;
            if (idx < 0) idx = 0;
            if (idx >= currentQuiz.length) idx = currentQuiz.length - 1;
            currentSingleIndex = idx;

            const container = document.getElementById('quiz-container');
            container.innerHTML = '';
            container.className = isReviewMode ? 'review-mode single-mode' : 'single-mode';

            const item = currentQuiz[idx];
            const uAns = userAnswers[idx] || '';
            const isFlagged = flaggedQuestions.has(idx);

            let animClass = '';
            if (direction === 'right') animClass = 'slide-in-right';
            if (direction === 'left') animClass = 'slide-in-left';

            let cardClass = `m3-card m3-card--elevated ios-card single-card ${animClass}`;
            if (isChildMode && uAns && uAns === item.a) cardClass += ' question-locked';
            if (isReviewMode) {
                cardClass += (uAns === item.a) ? ' correct' : ' wrong';
            }

            let analysisHtml = '';
            let peekButtonHtml = '';
            let masteredButtonHtml = '';
            if (quizType === 'wrong_review' && !isReviewMode) {
                masteredButtonHtml = `<button class="btn-mastered" onclick="markAsMastered(${idx})">我啃会了</button>`;
            }

            const answerContent = `
                <div style="font-weight:bold; margin-bottom:6px; font-size:15px;">
                    汪的答案：<span style="color:var(--md-sys-color-success)">${item.a}</span>
                    ${(isReviewMode || (quizFeedbackMode === 'instant' && uAns && uAns !== item.a)) ? `<span style="margin-left:10px; color:var(--md-sys-color-error)">你刨的：${uAns || '未选'}</span>` : ''}
                </div>
                <div style="color:var(--md-sys-color-on-surface-variant); line-height:1.5;">${escapeHtml(item.e || '这道题只能意会，多啃两遍就能懂！')}</div>
            `;

            const shouldShowInstantAnalysis = (!isReviewMode && quizFeedbackMode === 'instant' && quizType !== 'mock_exam' && !isChildMode && uAns);
            if (isReviewMode || shouldShowInstantAnalysis) {
                analysisHtml = `<div class="analysis-box" id="analysis-${idx}" style="display:block; margin-top:16px; padding:12px; background:var(--md-sys-color-surface-container); border-radius:12px;">${answerContent}</div>`;
            } else if (quizType !== 'mock_exam' && !isChildMode) {
                peekButtonHtml = `<div style="text-align:right; margin-top:10px;"><button class="btn-peek m3-ripple" onclick="toggleAnalysis(${idx})">👀 偷偷看一眼</button></div>`;
                analysisHtml = `<div class="analysis-box" id="analysis-${idx}" style="display:none; margin-top:16px; padding:12px; background:var(--md-sys-color-surface-container); border-radius:12px;">${answerContent}</div>`;
            }

            const elimList = eliminatedOptions[idx] || [];
            const elimTitle = isChildMode ? '拍碎调皮干扰项' : '排除/划掉干扰项';
            const flagChar = isChildMode ? (isFlagged ? '🚩' : '📍') : (isFlagged ? '📌' : '📍');
            const flagTitle = isChildMode ? '探险标记 (F)' : '标记疑难题 (F)';

            let optionsHtml = '';
            for (let key in item.o) {
                const isSelected = ((!isChildMode || quizFeedbackMode === 'exam') && uAns.includes(key)) ? 'selected' : '';
                const isEliminated = elimList.includes(key) ? 'eliminated' : '';
                let instantClass = '';
                if (shouldShowInstantAnalysis) {
                    if (item.a.includes(key)) instantClass = 'instant-correct';
                    else if (uAns.includes(key)) instantClass = 'instant-wrong';
                }
                let childCorrectClass = (isChildMode && quizFeedbackMode === 'instant' && uAns && item.a.includes(key)) ? 'child-correct' : '';
                let isRealAnswer = (isReviewMode && item.a.includes(key)) ? 'correct-answer' : '';

                optionsHtml += `
                    <div class="option-row m3-ripple ${isSelected} ${isRealAnswer} ${childCorrectClass} ${instantClass} ${isEliminated}"
                        tabindex="0" role="button"
                        onclick="selectOption(event, ${idx}, '${key}', '${item.t}')"
                        oncontextmenu="event.preventDefault(); toggleEliminateOption(${idx}, '${key}', event);"
                        onkeydown="handleOptionKeyDown(event, ${idx}, '${key}', '${item.t}')">
                        <div class="option-circle">${key}</div>
                        <div style="flex:1; word-break:break-word;">${escapeHtml(item.o[key])}</div>
                        <button class="btn-eliminate" onclick="toggleEliminateOption(${idx}, '${key}', event)" title="${elimTitle}">✕</button>
                    </div>
                `;
            }

            const html = `
                <div class="${cardClass}" id="q-${idx}">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                        <span style="font-weight:600; font-size:18px; line-height:1.5; padding-right:10px;">
                            <span class="bingo-badge" style="margin-left:0; margin-right:8px;">${item.t || '单选'}</span>
                            ${idx + 1}. ${escapeHtml(item.q)}
                        </span>
                        <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                            <button class="btn-flag-q ${isFlagged ? 'is-flagged' : ''}" id="flag-btn-${idx}" onclick="toggleFlagQuestion(${idx})" title="${flagTitle}">
                                ${flagChar}
                            </button>
                            <button class="btn-tts" onclick="speakQuestion(${idx})" title="朗读题目">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                            </button>
                            ${masteredButtonHtml}
                        </div>
                    </div>
                    <div>${optionsHtml}</div>
                    ${peekButtonHtml}
                    ${analysisHtml}
                </div>
            `;

            container.insertAdjacentHTML('beforeend', html);

            const singleNav = document.getElementById('quiz-single-nav');
            if (singleNav) {
                singleNav.style.display = 'flex';
                const prevBtn = document.getElementById('btn-nav-prev');
                const nextBtn = document.getElementById('btn-nav-next');
                const flagBtn = document.getElementById('btn-nav-flag');
                const paletteBadge = document.getElementById('nav-palette-badge');

                if (prevBtn) prevBtn.disabled = (idx === 0);
                if (flagBtn) {
                    flagBtn.classList.toggle('is-flagged', isFlagged);
                    const flagChar = isChildMode ? (isFlagged ? '🚩' : '📍') : (isFlagged ? '📌' : '📍');
                    flagBtn.innerHTML = `<span class="flag-icon">${flagChar}</span>`;
                    const flagTitle = isChildMode
                        ? (isFlagged ? '已插探险小旗 (点击取消)' : '插上探险小旗 (F)')
                        : (isFlagged ? '已标记 (点击取消)' : '标记疑难题 (F)');
                    flagBtn.setAttribute('title', flagTitle);
                }
                if (paletteBadge) {
                    paletteBadge.innerText = isChildMode ? `⭐ ${idx + 1} / ${currentQuiz.length}` : `${idx + 1} / ${currentQuiz.length}`;
                }

                if (nextBtn) {
                    if (idx === currentQuiz.length - 1) {
                        if (isChildMode) {
                            nextBtn.innerHTML = (quizFeedbackMode === 'exam') ? `<span>🎉 完成大挑战！</span>` : `<span>🎉 探险通关！</span>`;
                            nextBtn.className = 'btn btn-primary m3-btn--filled nav-next-btn';
                            nextBtn.onclick = () => (typeof showChildVictoryModal === 'function' ? showChildVictoryModal() : alert('通关啦！'));
                        } else {
                            nextBtn.innerHTML = isReviewMode ? `<span>回狗窝</span>` : `<span>汪！交卷！</span>`;
                            nextBtn.className = isReviewMode ? 'btn btn-ghost m3-btn--tonal nav-next-btn' : 'btn btn-success m3-btn--success nav-next-btn';
                            nextBtn.onclick = isReviewMode ? finishExamAndExit : () => submitPaper();
                        }
                    } else {
                        nextBtn.innerHTML = `<span>下一题</span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                        nextBtn.className = 'btn btn-primary m3-btn--filled m3-ripple nav-next-btn';
                        nextBtn.onclick = nextSingleQuestion;
                    }
                }
            }

            const fabArea = document.getElementById('quiz-fab-area');
            if (fabArea) fabArea.style.display = 'none';

            updateQuizNavBarControls();
            saveWipQuiz();
        }

        function nextSingleQuestion() {
            if (currentSingleIndex < currentQuiz.length - 1) {
                renderSingleQuestion(currentSingleIndex + 1, 'right');
            } else if (currentSingleIndex === currentQuiz.length - 1) {
                if (isChildMode) {
                    if (typeof showChildVictoryModal === 'function') showChildVictoryModal();
                } else if (!isReviewMode) {
                    submitPaper();
                }
            }
        }

        function prevSingleQuestion() {
            if (currentSingleIndex > 0) {
                renderSingleQuestion(currentSingleIndex - 1, 'left');
            }
        }

        function handleChildListSubmit() {
            const answeredCount = Object.keys(userAnswers).length;
            const totalCount = currentQuiz ? currentQuiz.length : 0;
            if (answeredCount < totalCount) {
                if (!confirm(`⭐ 还有 ${totalCount - answeredCount} 道宝藏题目还没探索完呢，确定现在完成探险吗？`)) {
                    return;
                }
            }
            if (typeof showChildVictoryModal === 'function') {
                showChildVictoryModal();
            }
        }

        // --- 全卷/主视图渲染逻辑 ---
        function renderQuizItems() {
            const container = document.getElementById('quiz-container');
            container.innerHTML = '';

            updateQuizNavBarControls();

            // 如果处于闪卡背题模式
            if (quizType === 'flashcard') {
                renderFlashcardView();
                return;
            }

            // 如果处于单题沉浸模式
            if (quizDisplayMode === 'single') {
                renderSingleQuestion(currentSingleIndex, 'none');
                return;
            }

            // 长卷列表模式
            const singleNav = document.getElementById('quiz-single-nav');
            if (singleNav) singleNav.style.display = 'none';

            const fabArea = document.getElementById('quiz-fab-area');
            if (fabArea && !isReviewMode && quizType !== 'mock_exam') {
                fabArea.style.display = 'flex';
                const submitBtn = document.getElementById('btn-submit-paper');
                if (submitBtn) {
                    if (isChildMode) {
                        submitBtn.innerText = '🎉 探险交卷';
                        submitBtn.onclick = handleChildListSubmit;
                    } else {
                        submitBtn.innerText = '汪！交卷！';
                        submitBtn.onclick = () => submitPaper();
                    }
                }
            }

            const bodyClass = isReviewMode ? 'review-mode list-mode' : 'list-mode';
            container.className = bodyClass;

            currentQuiz.forEach((item, idx) => {
                const uAns = userAnswers[idx] || '';
                const isFlagged = flaggedQuestions.has(idx);

                let cardClass = 'm3-card m3-card--elevated ios-card';
                if (isChildMode && quizFeedbackMode === 'instant' && uAns && uAns === item.a) {
                    cardClass += ' question-locked';
                }

                let analysisHtml = '';
                let masteredButtonHtml = '';
                let peekButtonHtml = '';

                if (quizType === 'wrong_review' && !isReviewMode) {
                    masteredButtonHtml = `<button class="btn-mastered" onclick="markAsMastered(${idx})">我啃会了</button>`;
                }

                const answerContent = `
                    <div style="font-weight:bold; margin-bottom:4px;">
                        汪的答案：<span style="color:var(--success)">${item.a}</span>
                        ${(isReviewMode || (quizFeedbackMode === 'instant' && uAns && uAns !== item.a)) ? `<span style="margin-left:10px; color:var(--danger)">你刨的：${uAns || '未选'}</span>` : ''}
                    </div>
                    <div style="color:var(--text-sub);">${escapeHtml(item.e || '只能意会')}</div>
                `;

                const shouldShowInstantAnalysis = (!isReviewMode && quizFeedbackMode === 'instant' && quizType !== 'mock_exam' && !isChildMode && uAns);

                if (isReviewMode) {
                    const isCorrect = uAns === item.a;
                    cardClass += isCorrect ? ' correct' : ' wrong';
                    analysisHtml = `<div style="margin-top:15px; padding:10px; background:var(--bg-input); border-radius:8px; font-size:14px;">${answerContent}</div>`;
                } else if (shouldShowInstantAnalysis) {
                    analysisHtml = `<div class="analysis-box" id="analysis-${idx}" style="display:block; margin-top:12px; padding:10px; background:var(--bg-input); border-radius:8px; font-size:14px;">${answerContent}</div>`;
                } else if (quizType !== 'mock_exam' && !isChildMode) {
                    peekButtonHtml = `<div style="text-align:right; margin-top:10px;"><button class="btn-peek m3-ripple" onclick="toggleAnalysis(${idx})">👀 偷偷看一眼</button></div>`;
                    analysisHtml = `<div class="analysis-box" id="analysis-${idx}" style="display:none; margin-top:12px; padding:10px; background:var(--bg-input); border-radius:8px; font-size:14px;">${answerContent}</div>`;
                }

                const elimList = eliminatedOptions[idx] || [];
                const elimTitle = isChildMode ? '拍碎调皮干扰项' : '排除/划掉干扰项';
                const flagChar = isChildMode ? (isFlagged ? '🚩' : '📍') : (isFlagged ? '📌' : '📍');
                const flagTitle = isChildMode
                    ? (isFlagged ? '已插探险小旗 (点击取消)' : '插上探险小旗 (F)')
                    : (isFlagged ? '已标记 (点击取消)' : '标记疑难题 (F)');

                let optionsHtml = '';
                for (let key in item.o) {
                    const isSelected = ((!isChildMode || quizFeedbackMode === 'exam') && uAns.includes(key)) ? 'selected' : '';
                    const isEliminated = elimList.includes(key) ? 'eliminated' : '';
                    let instantClass = '';
                    if (shouldShowInstantAnalysis) {
                        if (item.a.includes(key)) instantClass = 'instant-correct';
                        else if (uAns.includes(key)) instantClass = 'instant-wrong';
                    }
                    let childCorrectClass = (isChildMode && quizFeedbackMode === 'instant' && uAns && item.a.includes(key)) ? ' child-correct' : '';
                    let isRealAnswer = isReviewMode && item.a.includes(key) ? 'correct-answer' : '';

                    optionsHtml += `
                        <div class="option-row m3-ripple ${isSelected} ${isRealAnswer} ${childCorrectClass} ${instantClass} ${isEliminated}"
                            tabindex="0" role="button"
                            onclick="selectOption(event, ${idx}, '${key}', '${item.t}')"
                            oncontextmenu="event.preventDefault(); toggleEliminateOption(${idx}, '${key}', event);"
                            onkeydown="handleOptionKeyDown(event, ${idx}, '${key}', '${item.t}')">
                            <div class="option-circle">${key}</div>
                            <div style="flex:1">${escapeHtml(item.o[key])}</div>
                            <button class="btn-eliminate" onclick="toggleEliminateOption(${idx}, '${key}', event)" title="${elimTitle}">✕</button>
                        </div>
                    `;
                }

                let ttsHtml = `
                    <button class="btn-tts" onclick="speakQuestion(${idx})" title="朗读题目">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </button>
                `;

                const html = `
                    <div class="${cardClass}" id="q-${idx}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom:10px;">
                            <span style="font-weight:600; font-size:17px; line-height:1.4; padding-right: 15px;">
                                <span class="bingo-badge" style="margin-left:0; margin-right:5px;">${item.t || '单选'}</span>
                                ${idx + 1}. ${escapeHtml(item.q)}
                            </span>
                            <div style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                                <button class="btn-flag-q ${isFlagged ? 'is-flagged' : ''}" id="flag-btn-${idx}" onclick="toggleFlagQuestion(${idx})" title="${flagTitle}">
                                    ${flagChar}
                                </button>
                                ${ttsHtml}
                                ${masteredButtonHtml}
                            </div>
                        </div>
                        <div>${optionsHtml}</div>
                        ${peekButtonHtml}
                        ${analysisHtml}
                    </div>
                `;

                container.insertAdjacentHTML('beforeend', html);
            });

            if (window.roamingPet && typeof window.roamingPet.clampToBounds === 'function') {
                window.roamingPet.clampToBounds();
            }
        }

        


                function speakText(text) {
                    if (typeof window.speakText === 'function') {
                        window.speakText(text, null, true); // true: 题目/解析学术清晰播音轨，不混淆萌宠搞怪音
                        return;
                    }

                    if ('speechSynthesis' in window) {

                        window.speechSynthesis.cancel();

                        const utterance = new SpeechSynthesisUtterance(text);

                        utterance.lang = 'zh-CN';

                        utterance.rate = 0.9;

                        window.speechSynthesis.speak(utterance);

                    } else {

                        alert('抱歉，您的浏览器不支持朗读功能。');

                    }

                }

        


                function speakQuestion(idx) {
                    if (currentQuiz && currentQuiz[idx]) {
                        speakText(currentQuiz[idx].q);
                    }
                }

                function handleOptionKeyDown(evt, idx, key, type) {
                    if (evt.key === ' ' || evt.key === 'Enter') {
                        evt.preventDefault();
                        selectOption(evt, idx, key, type);
                    }
                }

                function toggleAnalysis(qIdx) {

                    const analysisEl = document.getElementById(`analysis-${qIdx}`);

                    if (analysisEl) {

                        analysisEl.style.display = analysisEl.style.display === 'block' ? 'none' : 'block';

                    }

                }

        


                function markAsMastered(qIdx) {

                    if (!confirm('确定把这根骨头从硬骨头里扔掉吗？以后答错了还是会回来的哦。')) return;

        

                    const questionToMaster = currentQuiz[qIdx];

                    if (!questionToMaster) return;

        

                    // Remove from wrong questions in history

                    const questionText = questionToMaster.q;

                    const historyKey = `bingo_hist_${currentDb.id}`;

                    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');

        

                    history.forEach(record => {

                        if (!record.quizSnapshot || !record.userAnswers) return;

        

                        record.quizSnapshot.forEach((question, index) => {

                            if (question.q === questionText) {

                                if (record.userAnswers[index] !== question.a) {

                                    record.userAnswers[index] = question.a;

                                }

                            }

                        });

                    });

        

                    localStorage.setItem(historyKey, JSON.stringify(history));

        

                    const cardElement = document.getElementById(`q-${qIdx}`);

                    if (cardElement) {

                        cardElement.style.transition = 'opacity 0.3s, transform 0.3s';

                        cardElement.style.opacity = '0';

                        cardElement.style.transform = 'scale(0.95)';

                        setTimeout(() => { cardElement.style.display = 'none'; }, 300);

                    }

        

                    masteredInSession++;

                    const totalInQuiz = currentQuiz.length;

                    document.getElementById('quiz-progress-text').innerText = `本轮 ${totalInQuiz - masteredInSession} / ${totalInQuiz} 根`;

        

                    alert('这根骨头你已经啃会了！');

                }


        function selectOption(evt, qIdx, optKey, type) {
            if (isReviewMode) return;

            // --- 儿童模式逻辑 START (已修改支持保存进度与双反馈模式) ---
            if (isChildMode) {
                const currentQuestion = currentQuiz[qIdx];
                const correctAns = currentQuestion.a;
                const row = (evt && evt.currentTarget) ? evt.currentTarget : (typeof event !== 'undefined' && event ? event.currentTarget : null);
                if (!row) return;

                // 如果整个问题已正确回答并锁定，则阻止任何操作
                if (row.closest('.ios-card').classList.contains('question-locked')) return;

                const parentCard = row.closest('.ios-card');
                const isMulti = currentQuestion.t.includes('多');

                // 1. 勇士大挑战模式 (Exam Mode: 闭卷自选，不立即公布正误)
                if (quizFeedbackMode === 'exam') {
                    if (typeof PetSound !== 'undefined') PetSound.bubble();
                    if (!isMulti) {
                        parentCard.querySelectorAll('.option-row').forEach(r => r.classList.remove('selected'));
                        row.classList.add('selected');
                        userAnswers[qIdx] = optKey;
                    } else {
                        row.classList.toggle('selected');
                        let currentSel = userAnswers[qIdx] ? userAnswers[qIdx].split('') : [];
                        const pos = currentSel.indexOf(optKey);
                        if (pos > -1) {
                            currentSel.splice(pos, 1);
                        } else {
                            currentSel.push(optKey);
                        }
                        currentSel.sort();
                        userAnswers[qIdx] = currentSel.join('');
                    }
                    saveWipQuiz();
                    updateQuizNavBarControls();
                    return;
                }

                // 2. 即时鼓励模式 (Instant Mode: 选对即欢庆喂食，选错抖动提示)
                if (correctAns.includes(optKey)) {
                    // 点击了正确选项
                    row.classList.add('child-correct');
                    if (navigator.vibrate) navigator.vibrate(30);

                    // 检查是否所有正确选项都已被选中
                    const parentCard = row.closest('.ios-card');
                    const correctOptionsInDom = parentCard.querySelectorAll('.child-correct');

                    const isMulti = currentQuestion.t.includes('多');

                    // 如果是单选题，或多选题的所有正确答案都已选定
                    if (!isMulti || correctOptionsInDom.length === correctAns.length) {
                        // 锁定问题
                        parentCard.classList.add('question-locked');
                        userAnswers[qIdx] = correctAns; // 保存答案

                        saveWipQuiz();
                        updateQuizNavBarControls();

                        if (typeof feedPetOnCorrectAnswer === 'function') {
                            feedPetOnCorrectAnswer();
                        }
                        setTimeout(showChildFeedback, 350);
                    }

                } else {
                    // 点击了错误选项
                    // 记录错题，便于通关后“再抓一次小水母”
                    if (typeof childSessionWrongQuestions !== 'undefined' && !childSessionWrongQuestions.some(q => q.q === currentQuestion.q)) {
                        childSessionWrongQuestions.push(currentQuestion);
                    }

                    // 检查小泡鱼锦鲤结界 (Koi Blessing Shield)
                    if (window.PetEngine && PetEngine.Skills && PetEngine.Skills.activeEffects.koiShieldActive) {
                        PetEngine.Skills.activeEffects.koiShieldActive = false;
                        const parentCard = row.closest('.ios-card');
                        if (parentCard) parentCard.classList.remove('pet-bubble-shield-active');
                        if (typeof PetSound !== 'undefined') PetSound.cheer();
                        if (window.roamingPet) {
                            window.roamingPet.say('🫧 锦鲤结界抵挡了本次错误！保住连胜，小主人再试一次！✨', 4000);
                            if (typeof PetVoice !== 'undefined') PetVoice.speak('锦鲤结界生效啦，再试一次！', 'fish');
                        }
                        row.classList.add('shake-it');
                        setTimeout(() => row.classList.remove('shake-it'), 400);
                        return;
                    }

                    row.classList.add('shake-it');
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                    if (typeof recordQuizWrong === 'function') { recordQuizWrong(); }
                    setTimeout(() => {
                        row.classList.remove('shake-it');
                    }, 400);
                }
                return; // 阻止执行后面的普通模式逻辑
            }
            // --- 儿童模式逻辑 END ---

            const isMulti = type.includes('多');
            let current = userAnswers[qIdx] || '';

            if (!isMulti) {
                current = optKey;
            } else {
                if (current.includes(optKey)) {
                    current = current.replace(optKey, '');
                } else {
                    current += optKey;
                }
                current = current.split('').sort().join('');
            }

            userAnswers[qIdx] = current;
            saveWipQuiz();

            const currentQuestion = currentQuiz[qIdx];
            const isInstant = (!isReviewMode && quizFeedbackMode === 'instant' && quizType !== 'mock_exam');

            if (quizDisplayMode === 'single') {
                renderSingleQuestion(currentSingleIndex, 'none');

                if (!isMulti && isInstant) {
                    if (current === currentQuestion.a) {
                        if (typeof PetSound !== 'undefined' && PetSound.isEnabled()) {
                            PetSound.chime();
                        }
                        if (currentSingleIndex < currentQuiz.length - 1) {
                            setTimeout(() => {
                                if (currentSingleIndex === qIdx) {
                                    nextSingleQuestion();
                                }
                            }, 550);
                        }
                    } else {
                        if (typeof PetSound !== 'undefined' && PetSound.isEnabled()) {
                            PetSound.wrong();
                        }
                    }
                }
            } else {
                const card = document.getElementById(`q-${qIdx}`);
                if (card) {
                    const rows = card.querySelectorAll('.option-row');
                    rows.forEach(row => {
                        const circle = row.querySelector('.option-circle');
                        if (!circle) return;
                        const k = circle.innerText.trim();
                        if (isMulti) {
                            if (current.includes(k)) row.classList.add('selected');
                            else row.classList.remove('selected');
                        } else {
                            if (k === current) row.classList.add('selected');
                            else row.classList.remove('selected');
                        }

                        if (isInstant && current) {
                            if (currentQuestion.a.includes(k)) {
                                row.classList.add('instant-correct');
                                row.classList.remove('instant-wrong');
                            } else if (current.includes(k)) {
                                row.classList.add('instant-wrong');
                                row.classList.remove('instant-correct');
                            } else {
                                row.classList.remove('instant-correct', 'instant-wrong');
                            }
                        }
                    });

                    if (isInstant && current) {
                        const analysisBox = document.getElementById(`analysis-${qIdx}`);
                        if (analysisBox) analysisBox.style.display = 'block';
                    }
                }
            }

            updateQuizNavBarControls();
        }

        // 儿童模式专用：显示反馈

        function cleanupQuizSession() {
            stopTimer();
            removeQuizScrollListener();
            window.removeEventListener('beforeunload', saveWipQuiz);
        }

        function submitPaper(autoSubmit = false) {
            let unansweredCount = 0;
            currentQuiz.forEach((q, i) => {
                if (!userAnswers[i]) unansweredCount++;
            });

            if (!autoSubmit && unansweredCount > 0) {
                if (!confirm(`⚠️ 还有 ${unansweredCount} 根骨头没啃完（未作答）！\n\n点击【确定】强制交卷并算分。\n点击【取消】打开答题卡继续作答。`)) {
                    toggleAnswerPalette();
                    return;
                }
            }

            if (!autoSubmit && unansweredCount === 0 && !confirm('不改了？真的交卷了哦？')) return;

            stopTimer();
            removeQuizScrollListener();
            window.removeEventListener('beforeunload', saveWipQuiz); // 移除保存监听

            let correctCount = 0;
            const wrongList = [];
            currentQuiz.forEach((q, i) => {
                const uAns = userAnswers[i] || '';
                if (uAns === q.a) {
                    correctCount++;
                } else {
                    wrongList.push(q);
                }
            });

            lastSessionWrongQuestions = wrongList;
            const score = Math.round((currentQuiz.length > 0 ? (correctCount / currentQuiz.length) : 0) * 100);

            // 记录历史（模拟考试必须记录）
            saveHistory(score, quizType);

            // 只有非模拟考试，才清空 WIP
            if (quizType !== 'mock_exam') {
                clearWipQuiz();
            }

            lastCompletedQuiz = currentQuiz;
            lastCompletedAnswers = userAnswers;

            document.getElementById('result-score').innerText = score;

            const totalEl = document.getElementById('score-total-count');
            const correctEl = document.getElementById('score-correct-count');
            const wrongEl = document.getElementById('score-wrong-count');
            if (totalEl) totalEl.innerText = currentQuiz.length;
            if (correctEl) correctEl.innerText = correctCount;
            if (wrongEl) wrongEl.innerText = wrongList.length;

            const retryBtn = document.getElementById('btn-retry-wrong');
            const retryCount = document.getElementById('retry-wrong-count');
            if (retryBtn) {
                if (wrongList.length > 0) {
                    retryBtn.style.display = 'inline-block';
                    if (retryCount) retryCount.innerText = wrongList.length;
                } else {
                    retryBtn.style.display = 'none';
                }
            }

            document.getElementById('modal-score').style.display = 'flex';

            if (quizType === 'mock_exam') {
                document.getElementById('quiz-fab-area').style.display = 'none';
            }
        }

        function startRetryWrongQuiz() {
            if (!lastSessionWrongQuestions || lastSessionWrongQuestions.length === 0) {
                alert('太棒啦！本次练习没有错题！');
                return;
            }
            document.getElementById('modal-score').style.display = 'none';
            quizType = 'wrong_review';
            isReviewMode = false;
            userAnswers = {};
            flaggedQuestions.clear();
            eliminatedOptions = {};
            currentSingleIndex = 0;
            currentQuiz = applyOptionShuffleToQuiz([...lastSessionWrongQuestions]);
            renderQuizItems();
            saveWipQuiz();
        }


        function enterReviewMode() {
            document.getElementById('modal-score').style.display = 'none';

            currentQuiz = lastCompletedQuiz;
            userAnswers = lastCompletedAnswers;

            isReviewMode = true;

            updateView({ view: 'quiz' });
            document.getElementById('quiz-fab-area').style.display = 'none';
            renderQuizItems();
            window.scrollTo(0, 0);
        }


        function exitQuiz() {
            if (quizType === 'mock_exam' && !isReviewMode) {
                if (confirm('您正在进行模拟开啃，现在退出将直接交卷，确定吗？')) {
                    submitPaper(true);
                } else {
                    return;
                }
            }

            if (!isReviewMode) {
                saveWipQuiz();
            }

            history.back();
        }

