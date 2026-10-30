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
            masteredInSession = 0;
            currentQuiz = wrongQuestions.sort(() => 0.5 - Math.random());
            lastVisibleQuestionIndex = 0;

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });

            document.getElementById('quiz-fab-area').style.display = 'flex';
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
            userAnswers = wipState.userAnswers;
            quizType = wipState.quizType;
            isReviewMode = false;
            lastVisibleQuestionIndex = wipState.lastVisibleQuestionIndex || 0;

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });
            document.getElementById('quiz-fab-area').style.display = 'flex';

            renderQuizItems();
            setupQuizScrollListener();
            window.addEventListener('beforeunload', saveWipQuiz);

            setTimeout(() => {
                const targetEl = document.getElementById(`q-${lastVisibleQuestionIndex}`);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // 增加临时高亮
                    targetEl.style.transition = 'outline 0.2s ease-in-out';
                    targetEl.style.outline = '3px solid var(--primary)';
                    setTimeout(() => {
                        targetEl.style.outline = 'none';
                    }, 1500);
                }
            }, 100);

            if (quizType === 'mock_exam') {
                const count = currentQuiz.length;
                const totalTime = count * 90;
                // 恢复考试时简单重置计时器（简化处理，不记忆剩余时间）
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
            userAnswers = record.userAnswers;
            isReviewMode = true;

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
            currentQuiz = shuffled.slice(0, count);

            if (currentQuiz.length === 0) {
                return alert('这个分类下没有足够的骨头进行模拟！');
            }

            quizType = 'mock_exam';
            isReviewMode = false;
            userAnswers = {};
            lastVisibleQuestionIndex = 0;

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });
            document.getElementById('quiz-fab-area').style.display = 'flex';

            renderQuizItems();
            // saveWipQuiz();
            setupQuizScrollListener();
            // window.addEventListener('beforeunload', saveWipQuiz);

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

            history.pushState({ view: 'quiz', dbId: currentDb.id }, '', '#quiz');
            updateView({ view: 'quiz' });
            document.getElementById('quiz-fab-area').style.display = 'flex';

            renderQuizItems();
            saveWipQuiz();
            setupQuizScrollListener();
            window.addEventListener('beforeunload', saveWipQuiz);
        }


        function renderQuizItems() {

                    const container = document.getElementById('quiz-container');

                    container.innerHTML = '';

                    const bodyClass = isReviewMode ? 'review-mode' : '';

                    container.className = bodyClass;

        

                    document.getElementById('quiz-progress-text').innerText = `本轮 ${currentQuiz.length} 根骨头`;
                    if (typeof updatePetWidgets === 'function') updatePetWidgets();

        

                    currentQuiz.forEach((item, idx) => {

                        const uAns = userAnswers[idx] || '';

                        let cardClass = 'm3-card m3-card--elevated ios-card';

        

                        if (isChildMode && uAns && uAns === item.a) {

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

                                ${isReviewMode && uAns !== item.a ? `<span style="margin-left:10px; color:var(--danger)">你刨的：${uAns || '未选'}</span>` : ''}

                            </div>

                            <div style="color:var(--text-sub);">${escapeHtml(item.e || '只能意会')}</div>

                        `;

        

                        if (isReviewMode) {

                            const isCorrect = uAns === item.a;

                            cardClass += isCorrect ? ' correct' : ' wrong';

                            analysisHtml = `<div style="margin-top:15px; padding:10px; background:var(--bg-input); border-radius:8px; font-size:14px;">${answerContent}</div>`;

                        } else if (quizType !== 'mock_exam') {

                            peekButtonHtml = `<div style="text-align:right; margin-top:10px;"><button class="btn-peek m3-ripple" onclick="toggleAnalysis(${idx})">👀 偷偷看一眼</button></div>`;

                            analysisHtml = `<div class="analysis-box" id="analysis-${idx}" style="display:none;">${answerContent}</div>`;

                        }

        

        

                        let optionsHtml = '';

                        for (let key in item.o) {

                            const isSelected = (!isChildMode && uAns.includes(key)) ? 'selected' : '';

        

                            let childCorrectClass = '';

                            if (isChildMode && uAns && item.a.includes(key)) {

                                childCorrectClass = ' child-correct';

                            }

        

                            const isRealAnswer = isReviewMode && item.a.includes(key) ? 'correct-answer' : '';

        

                            optionsHtml += `

                            <div class="option-row m3-ripple ${isSelected} ${isRealAnswer} ${childCorrectClass}" tabindex="0" role="button" onclick="selectOption(event, ${idx}, '${key}', '${item.t}')" onkeydown="handleOptionKeyDown(event, ${idx}, '${key}', '${item.t}')">

                                <div class="option-circle">${key}</div>

                                <div style="flex:1">${escapeHtml(item.o[key])}</div>

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

                                ${ttsHtml}

                                ${masteredButtonHtml}

                            </div>

                            <div>${optionsHtml}</div>

                            ${peekButtonHtml}

                            ${analysisHtml}

                        </div>

                    `;

                        container.insertAdjacentHTML('beforeend', html);

                    });

                }

        


                function speakText(text) {
                    if (typeof window.speakText === 'function') {
                        window.speakText(text);
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

            // --- 儿童模式逻辑 START (已修改支持保存进度) ---
            if (isChildMode) {
                const currentQuestion = currentQuiz[qIdx];
                const correctAns = currentQuestion.a;
                const row = (evt && evt.currentTarget) ? evt.currentTarget : (typeof event !== 'undefined' && event ? event.currentTarget : null);
                if (!row) return;

                // 如果整个问题已正确回答并锁定，则阻止任何操作
                if (row.closest('.ios-card').classList.contains('question-locked')) return;

                // 判断点击的选项是否是正确答案的一部分
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

                        if (typeof feedPetOnCorrectAnswer === 'function') {
                            feedPetOnCorrectAnswer();
                        }
                        setTimeout(showChildFeedback, 400);
                    }

                } else {
                    // 点击了错误选项
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

            const card = document.getElementById(`q-${qIdx}`);
            const rows = card.querySelectorAll('.option-row');
            rows.forEach(row => {
                const k = row.querySelector('.option-circle').innerText;
                if (isMulti) {
                    if (current.includes(k)) row.classList.add('selected');
                    else row.classList.remove('selected');
                } else {
                    if (k === current) row.classList.add('selected');
                    else row.classList.remove('selected');
                }
            });
        }

        // 儿童模式专用：显示反馈

        function cleanupQuizSession() {
            stopTimer();
            removeQuizScrollListener();
            window.removeEventListener('beforeunload', saveWipQuiz);
        }

        function submitPaper(autoSubmit = false) {
            if (!autoSubmit && !confirm('不改了？真的交卷了哦？')) return;

            stopTimer();
            removeQuizScrollListener();
            window.removeEventListener('beforeunload', saveWipQuiz); // 移除保存监听

            let correctCount = 0;
            currentQuiz.forEach((q, i) => {
                if ((userAnswers[i] || '') === q.a) correctCount++;
            });

            const score = Math.round((currentQuiz.length > 0 ? (correctCount / currentQuiz.length) : 0) * 100);

            // 记录历史（模拟考试必须记录）
            // 注意：wrong_review 模式通常不记录分数历史，或者你可以自行决定
            saveHistory(score, quizType);

            // 【重要修复】只有非模拟考试，才清空 WIP
            // 因为模拟考试本身就不保存 WIP，所以如果这里无脑清空，会把之前的普通练习进度删掉
            if (quizType !== 'mock_exam') {
                clearWipQuiz();
            }

            lastCompletedQuiz = currentQuiz;
            lastCompletedAnswers = userAnswers;

            // 清理现场：不要在这里调用 clearWipQuiz()，因为它已经在上面根据条件判断过了

            document.getElementById('result-score').innerText = score;
            document.getElementById('modal-score').style.display = 'flex';

            // 【新增】如果是模拟考，隐藏底部的提交按钮，防止用户关掉Modal后在这个页面迷茫
            if (quizType === 'mock_exam') {
                document.getElementById('quiz-fab-area').style.display = 'none';
            }
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

