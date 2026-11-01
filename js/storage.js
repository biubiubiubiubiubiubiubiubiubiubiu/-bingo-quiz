        function getMeta() { return JSON.parse(localStorage.getItem('bingo_meta') || '[]'); }
        function saveMeta(list) { safeSetItem('bingo_meta', JSON.stringify(list)); }


        // --- 安全存储包装层 (捕获配额溢出并自动清理) ---
        function safeSetItem(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
                    console.warn('LocalStorage 配额超限，正在自动清理多余历史记录...');
                    try {
                        const meta = getMeta();
                        meta.forEach(db => {
                            const histKey = `bingo_hist_${db.id}`;
                            const hist = JSON.parse(localStorage.getItem(histKey) || '[]');
                            if (hist.length > 10) {
                                localStorage.setItem(histKey, JSON.stringify(hist.slice(-10)));
                            }
                        });
                        localStorage.setItem(key, value);
                        return true;
                    } catch (retryErr) {
                        alert('狗窝存储空间不足，未能保存数据！请删除部分旧题库或历史记录。');
                        return false;
                    }
                } else {
                    console.error('safeSetItem 失败:', e);
                    return false;
                }
            }
        }

        // 辅助函数：创建新题库
        function createNewDb(name, data, metaArray) {
            try {
                const id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
                safeSetItem(`bingo_db_${id}`, JSON.stringify(data));
                metaArray.push({ id, name: name, count: data.length, lastUsed: Date.now() });
            } catch (e) {
                alert(`导入【${name}】失败，狗窝满了（存储空间不足）！快丢掉点旧骨头。`);
            }
        }


        function saveWipQuiz() {
            // 【修改】如果是模拟考试，绝对不保存进度，这意味着刷新或强退后无法“继续”
            if (!currentDb || !currentQuiz.length || isReviewMode || quizType === 'mock_exam') return;

            const wipState = {
                quizType: quizType,
                currentQuiz: currentQuiz,
                userAnswers: userAnswers,
                lastVisibleQuestionIndex: lastVisibleQuestionIndex,
                currentSingleIndex: typeof currentSingleIndex !== 'undefined' ? currentSingleIndex : 0,
                flaggedQuestions: typeof flaggedQuestions !== 'undefined' ? Array.from(flaggedQuestions) : []
            };
            localStorage.setItem(`bingo_wip_${currentDb.id}`, JSON.stringify(wipState));
        }


        function clearWipQuiz() {
            if (currentDb) localStorage.removeItem(`bingo_wip_${currentDb.id}`);
        }


        function deleteCurrentDb() {
            if (!confirm('真要把这窝骨头都扔了？再也找不回了哦！')) return;

            const id = currentDb.id;
            localStorage.removeItem(`bingo_db_${id}`);
            localStorage.removeItem(`bingo_prog_${id}`);
            localStorage.removeItem(`bingo_hist_${id}`);
            localStorage.removeItem(`bingo_wip_${id}`);

            const meta = getMeta().filter(m => m.id !== id);
            saveMeta(meta);

            goHome();
        }


        function deleteAllData() {
            if (!confirm('【高危操作】警告！此操作将彻底删除所有题库、练习历史和设置，且无法恢复。您确定要清空所有狗窝吗？')) return;
            if (!confirm('【二次确认】真的，所有东西都没了，确定吗？')) return;

            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('bingo_') || key === 'app_theme') {
                    localStorage.removeItem(key);
                }
            });

            alert('所有狗窝和骨头都已丢掉！');
            location.reload();
        }


        function getAllWrongQuestions(dbId) {
            const history = JSON.parse(localStorage.getItem(`bingo_hist_${dbId}`) || '[]');
            const wrongQuestions = {};

            history.forEach(record => {
                if (!record.quizSnapshot || !record.userAnswers) return;

                record.quizSnapshot.forEach((question, index) => {
                    const userAnswer = record.userAnswers[index] || '';
                    if (userAnswer !== question.a) {
                        const qKey = question.id || (question.q ? question.q.trim() : `q_${index}`);
                        wrongQuestions[qKey] = question;
                    }
                });
            });

            return Object.values(wrongQuestions);
        }


        // --- 保存历史记录 (轻量化瘦身版，防止配额溢出) ---
        function saveHistory(score, type) {
            if (!currentDb) return;
            const id = currentDb.id;
            const histKey = `bingo_hist_${id}`;
            let history = JSON.parse(localStorage.getItem(histKey) || '[]');

            // 对题目快照进行轻量化瘦身：
            // - 做错的题目：保留全部完整字段（题干、答案、选项、解析、题型、分类），确保错题本与重点复习 100% 完整可用
            // - 做对的题目：移除冗长的大段解析和非必要信息，保留题干、答案、选项与题型，大幅削减空间
            const lightweightSnapshot = (currentQuiz || []).map((q, idx) => {
                const userAns = (userAnswers && userAnswers[idx]) ? userAnswers[idx] : '';
                const isWrong = userAns !== q.a;
                if (isWrong) {
                    return {
                        id: q.id,
                        q: q.q,
                        a: q.a,
                        o: q.o,
                        e: q.e || '',
                        t: q.t || '单选',
                        c: q.c || '未分类'
                    };
                } else {
                    return {
                        id: q.id,
                        q: q.q,
                        a: q.a,
                        o: q.o,
                        t: q.t || '单选'
                    };
                }
            });

            const record = {
                date: Date.now(),
                score: score,
                type: type,
                quizSnapshot: lightweightSnapshot, // 优化后的轻量题目快照
                userAnswers: userAnswers           // 保存用户答案
            };

            history.push(record);
            // 将常驻历史记录上限优化为 15 条，既满足近期复盘需求，又彻底避免 5MB 爆仓
            if (history.length > 15) history = history.slice(-15);
            safeSetItem(histKey, JSON.stringify(history));

            // ...
            // 如果是顺序练习，更新进度
            if (type === 'sequence') {
                const currentProg = parseInt(localStorage.getItem(`bingo_prog_${id}`)) || 0;

                // 计算这批题目的结束位置索引 (基于题目在原始数组中的位置)
                // 注意：这需要我们知道 currentQuiz 里的题目在原始 questions 里的 index。
                // 由于你的数据结构没存 ID，我们简化处理：
                // 假设是按顺序切片的，那么用户的 "起始位置输入框" + "当前题目数量" = 新的潜在进度

                const startInputVal = parseInt(document.getElementById('sequence-start-input').value) || 1;
                const potentialNewProg = (startInputVal - 1) + currentQuiz.length;

                // 只有当新的进度比旧进度大时，才更新 (避免复习旧题时把进度覆盖回去)
                if (potentialNewProg > currentProg) {
                    let newProg = potentialNewProg;
                    // 防止溢出
                    if (newProg > currentDb.questions.length) newProg = currentDb.questions.length;

                    localStorage.setItem(`bingo_prog_${id}`, newProg);
                    currentDb.progress = newProg;
                }
            }
            // ...

        }


        function deleteHistoryRecord(index) {
            if (!confirm('确定要删除这条啃骨头记忆吗？')) return;

            const historyKey = `bingo_hist_${currentDb.id}`;
            let history = JSON.parse(localStorage.getItem(historyKey) || '[]');

            history.splice(index, 1);

            localStorage.setItem(historyKey, JSON.stringify(history));
            renderHistoryList(currentDb.id);
        }

        // --- 数据备份：导出/导入 JSON ---
        const BACKUP_APP_KEYS = ['app_theme', 'app_mode', 'app_kid_theme'];

        function collectBackupData() {
            const data = {};
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('bingo_') || BACKUP_APP_KEYS.includes(key)) {
                    data[key] = localStorage.getItem(key);
                }
            });
            return data;
        }

        function exportBackup() {
            const data = collectBackupData();
            if (Object.keys(data).length === 0) {
                alert('狗窝里什么都没有，没啥可备份的！');
                return;
            }

            const payload = {
                app: 'bingo-quiz',
                version: 1,
                exportedAt: new Date().toISOString(),
                data: data
            };

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const ts = new Date();
            const pad = n => String(n).padStart(2, '0');
            a.href = url;
            a.download = `bingo-backup-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }

        function handleBackupSelect(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const payload = JSON.parse(e.target.result);
                    if (!payload || payload.app !== 'bingo-quiz' || typeof payload.data !== 'object' || payload.data === null) {
                        alert('这不是有效的斌狗备份文件！');
                        return;
                    }

                    const entries = Object.entries(payload.data);
                    if (entries.length === 0) {
                        alert('备份文件里没有数据。');
                        return;
                    }

                    // 验证备份数据中是否包含必要的有效键
                    const hasValidAppKeys = entries.some(([k]) => k.startsWith('bingo_') || BACKUP_APP_KEYS.includes(k));
                    if (!hasValidAppKeys) {
                        alert('备份文件未包含有效题库或设置数据，导入中止！');
                        return;
                    }

                    if (!confirm(`将导入 ${entries.length} 项数据。\n\n⚠️ 当前所有题库、进度和历史会被替换！\n\n确定继续吗？`)) return;

                    // === 事务安全机制：先为当前 localStorage 拍摄一份内存快照 ===
                    const backupSnapshot = {};
                    Object.keys(localStorage).forEach(key => {
                        if (key.startsWith('bingo_') || BACKUP_APP_KEYS.includes(key)) {
                            backupSnapshot[key] = localStorage.getItem(key);
                        }
                    });

                    try {
                        // 1. 尝试清空原应用键
                        Object.keys(backupSnapshot).forEach(key => localStorage.removeItem(key));

                        // 2. 逐项安全写入新数据
                        for (const [key, value] of entries) {
                            if (key.startsWith('bingo_') || BACKUP_APP_KEYS.includes(key)) {
                                localStorage.setItem(key, String(value));
                            }
                        }

                        // 3. 校验写入有效性
                        const restoredMeta = localStorage.getItem('bingo_meta');
                        if (restoredMeta !== null) {
                            JSON.parse(restoredMeta); // 确保元数据解析正常
                        }

                        alert('汪！备份恢复完成！');
                        location.reload();
                    } catch (writeErr) {
                        // 发生 QuotaExceededError 或解析异常，执行原子级安全回滚
                        console.error('[BackupRestore] 写入备份失败，启动自动回滚:', writeErr);
                        try {
                            // 清理失败的不完整数据
                            entries.forEach(([key]) => localStorage.removeItem(key));
                            // 写回原快照
                            Object.entries(backupSnapshot).forEach(([key, val]) => {
                                localStorage.setItem(key, val);
                            });
                        } catch (rollbackErr) {
                            console.error('[BackupRestore] 回滚异常:', rollbackErr);
                        }
                        alert('恢复备份失败（存储空间不足或数据项异常）！\n系统已安全回滚至导入前状态，原有数据完好无损。');
                    }
                } catch (err) {
                    console.error(err);
                    alert('备份文件解析失败，请确认文件未损坏。');
                } finally {
                    input.value = '';
                }
            };
            reader.readAsText(file);
        }

        // --- 题库导出为 Excel (.xlsx) ---
        async function exportDbToExcel(dbId) {
            const meta = (getMeta().find(m => m.id === dbId)) || currentDb;
            if (!meta) {
                alert('未找到该题库！');
                return;
            }
            const questions = JSON.parse(localStorage.getItem(`bingo_db_${meta.id}`) || '[]');
            if (!questions || questions.length === 0) {
                alert('这窝骨头是空的，没啥可导出的！');
                return;
            }

            // 动态按需加载 SheetJS 引擎
            try {
                if (typeof XLSXLoader !== 'undefined') {
                    await XLSXLoader.load();
                }
            } catch (err) {
                alert('Excel 导出组件加载失败，请检查网络后重试。');
                console.error(err);
                return;
            }

            if (typeof XLSX === 'undefined') {
                alert('Excel 导出组件还在准备中，请稍候再试...');
                return;
            }

            const rows = questions.map(item => {
                const row = {
                    '题型': item.t || (item.a && item.a.length > 1 ? '多选' : '单选'),
                    '题目': item.q || ''
                };
                ['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => {
                    row[`选项${k}`] = (item.o && item.o[k]) ? item.o[k] : '';
                });
                row['答案'] = item.a || '';
                row['解析'] = item.e || '';
                row['分类'] = item.c || '未分类';
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            const safeSheetName = (meta.name || '题库').slice(0, 31).replace(/[\\/?*[\]]/g, '_');
            XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
            const fileName = `${meta.name || '题库'}_藏宝图.xlsx`;
            XLSX.writeFile(wb, fileName);
        }

        // --- 错题本导出为 Excel (.xlsx) ---
        async function exportWrongQuestionsToExcel(dbId) {
            const meta = (getMeta().find(m => m.id === dbId)) || currentDb;
            if (!meta) return;
            const wrongQuestions = getAllWrongQuestions(meta.id);
            if (!wrongQuestions || wrongQuestions.length === 0) {
                alert('没有发现错题，太棒啦！');
                return;
            }

            // 动态按需加载 SheetJS 引擎
            try {
                if (typeof XLSXLoader !== 'undefined') {
                    await XLSXLoader.load();
                }
            } catch (err) {
                alert('Excel 导出组件加载失败，请检查网络后重试。');
                console.error(err);
                return;
            }

            if (typeof XLSX === 'undefined') {
                alert('Excel 导出组件还在准备中，请稍候再试...');
                return;
            }

            const rows = wrongQuestions.map(item => {
                const row = {
                    '题型': item.t || (item.a && item.a.length > 1 ? '多选' : '单选'),
                    '题目': item.q || ''
                };
                ['A', 'B', 'C', 'D', 'E', 'F'].forEach(k => {
                    row[`选项${k}`] = (item.o && item.o[k]) ? item.o[k] : '';
                });
                row['答案'] = item.a || '';
                row['解析'] = item.e || '';
                row['分类'] = item.c || '硬骨头错题';
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '硬骨头错题本');
            const fileName = `${meta.name || '题库'}_硬骨头错题本.xlsx`;
            XLSX.writeFile(wb, fileName);
        }
