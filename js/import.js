        let tempImportData = null;
        let cachedPresetDecks = null;
        let textInputDebounce = null;

        function showImportModal(initialTab = 'excel') {
            document.getElementById('modal-import').style.display = 'flex';
            document.getElementById('import-feedback').style.display = 'none';
            document.getElementById('import-status').innerText = '';
            document.getElementById('import-loader').style.display = 'none';
            document.getElementById('import-preview').style.display = 'none';
            document.getElementById('btn-confirm-import').style.display = 'none';
            document.getElementById('btn-select-file').style.display = 'inline-flex';
            switchImportTab(initialTab);
        }

        function closeImportModal() {
            document.getElementById('modal-import').style.display = 'none';
            const fileInput = document.getElementById('file-input');
            if (fileInput) fileInput.value = '';
        }

        function switchImportTab(tab) {
            const tabs = ['excel', 'text', 'presets'];
            tabs.forEach(t => {
                const btn = document.getElementById(`tab-btn-${t}`);
                const panel = document.getElementById(`import-tab-${t}`);
                if (btn) btn.classList.toggle('active', t === tab);
                if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
            });
            if (tab === 'presets') {
                renderPresetDecks();
            }
        }

        // ==========================================
        // 1. 原有 Excel 导入逻辑 (100% 完整保留与兼容)
        // ==========================================

        function handleFileSelect(input) {
            const file = input.files[0];
            if (!file) return;

            const feedbackContainer = document.getElementById('import-feedback');
            const loader = document.getElementById('import-loader');
            const status = document.getElementById('import-status');
            const preview = document.getElementById('import-preview');

            feedbackContainer.style.display = 'block';
            loader.style.display = 'block';
            status.innerText = '';
            preview.style.display = 'none';
            document.getElementById('btn-confirm-import').style.display = 'none';
            document.getElementById('btn-select-file').style.display = 'none';

            const reader = new FileReader();
            reader.onload = function (e) {
                loader.style.display = 'none';
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });

                    tempImportData = {};
                    const sheetSelectionContainer = document.getElementById('sheet-selection-container');
                    sheetSelectionContainer.innerHTML = '';

                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(worksheet, {
                            raw: false,
                            dateNF: 'yyyy/mm/dd'
                        });
                        const parsedData = parseImportData(json);
                        if (parsedData.length > 0) {
                            tempImportData[sheetName] = parsedData;

                            const checkbox = document.createElement('div');
                            checkbox.innerHTML = `
                            <label>
                                <input type="checkbox" name="sheet" value="${sheetName}" checked>
                                ${sheetName} (${parsedData.length} 根骨头)
                            </label>
                        `;
                            sheetSelectionContainer.appendChild(checkbox);
                        }
                    });

                    if (Object.keys(tempImportData).length > 0) {
                        feedbackContainer.style.display = 'none';
                        preview.style.display = 'block';
                        document.getElementById('btn-confirm-import').style.display = 'inline-block';
                    } else {
                        status.innerText = '解析失败！请检查您的 Excel 文件，确保其中包含 "题目" 和 "答案" 列。';
                        document.getElementById('btn-select-file').style.display = 'inline-flex';
                    }
                } catch (err) {
                    console.error("File parsing error:", err);
                    status.innerText = '文件读取出错，可能不是一个有效的 Excel 文件。';
                    document.getElementById('btn-select-file').style.display = 'inline-flex';
                }
            };
            reader.onerror = function () {
                loader.style.display = 'none';
                status.innerText = '无法读取文件。';
                document.getElementById('btn-select-file').style.display = 'inline-flex';
            };
            reader.readAsArrayBuffer(file);
        }

        function parseImportData(json) {
            const parsed = json.map(row => {
                const qKey = Object.keys(row).find(k => /题目|问题|Question/i.test(k));
                const aKey = Object.keys(row).find(k => /答案|Answer/i.test(k));
                const eKey = Object.keys(row).find(k => /解析|解释|Explanation/i.test(k));
                const tKey = Object.keys(row).find(k => /题型|Type/i.test(k));
                const cKey = Object.keys(row).find(k => /类别|分类|Category/i.test(k));

                if (!qKey || !aKey) return null;

                const options = {};
                ['A', 'B', 'C', 'D', 'E', 'F'].forEach(opt => {
                    const optKey = Object.keys(row).find(k => k.toUpperCase().trim() === `选项${opt}` || k.toUpperCase().trim() === opt);
                    if (optKey && row[optKey]) options[opt] = row[optKey];
                });

                let cleanAns = String(row[aKey]).toUpperCase().replace(/[^A-Z]/g, '');

                if (Object.keys(options).length === 0 && (String(row[aKey]).includes('对') || String(row[aKey]).includes('错'))) {
                    options['A'] = '正确'; options['B'] = '错误';
                    if (String(row[aKey]).includes('对')) cleanAns = 'A';
                    if (String(row[aKey]).includes('错')) cleanAns = 'B';
                }

                return {
                    q: row[qKey],
                    a: cleanAns,
                    o: options,
                    e: eKey ? row[eKey] : '',
                    t: tKey ? row[tKey] : (cleanAns.length > 1 ? '多选' : '单选'),
                    c: cKey ? row[cKey] : '未分类'
                };
            }).filter(item => item !== null);
            return parsed;
        }

        function confirmImport() {
            const selectedSheets = Array.from(document.querySelectorAll('#sheet-selection-container input[name="sheet"]:checked'))
                .map(input => input.value);

            if (selectedSheets.length === 0) {
                alert('总得选个地方挖吧？');
                return;
            }

            const meta = getMeta();
            let updatedCount = 0;
            let newCount = 0;

            selectedSheets.forEach(sheetName => {
                const data = tempImportData[sheetName];
                const existingDb = meta.find(m => m.name === sheetName);

                if (existingDb) {
                    const userWantsUpdate = confirm(
                        `发现已存在的狗窝：【${sheetName}】\n\n` +
                        `🦴 点击【确定】：更新题目，但保留你的刷题进度和历史成绩。\n` +
                        `🆕 点击【取消】：把它当作一个新的狗窝导入（不覆盖旧的）。`
                    );

                    if (userWantsUpdate) {
                        try {
                            localStorage.setItem(`bingo_db_${existingDb.id}`, JSON.stringify(data));
                            existingDb.count = data.length;
                            existingDb.lastUsed = Date.now();
                            localStorage.removeItem(`bingo_wip_${existingDb.id}`);

                            let currentProg = parseInt(localStorage.getItem(`bingo_prog_${existingDb.id}`) || '0');
                            if (currentProg > data.length) {
                                localStorage.setItem(`bingo_prog_${existingDb.id}`, data.length);
                                existingDb.progress = data.length;
                            }
                            updatedCount++;
                        } catch (e) {
                            alert('更新失败，可能是存储空间不足！');
                            console.error(e);
                        }
                    } else {
                        createNewDb(sheetName, data, meta);
                        newCount++;
                    }
                } else {
                    createNewDb(sheetName, data, meta);
                    newCount++;
                }
            });

            saveMeta(meta);
            closeImportModal();
            renderDbList();

            if (updatedCount > 0 || newCount > 0) {
                alert(`汪！操作完成：\n🛠 更新了 ${updatedCount} 个旧狗窝\n✨ 挖掘了 ${newCount} 个新狗窝`);
            }
        }

        // ==========================================
        // 2. 智能文本粘贴解析逻辑 (支持 Aiken、微信试卷、Markdown)
        // ==========================================

        function parsePlainText(rawText) {
            if (!rawText || !rawText.trim()) return [];

            const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

            let rawBlocks = [];
            const questionHeaderRegex = /(?:^|\n)(?:(?:第\s*[0-9一二三四五六七八九十百]+\s*题|(?:\d+|[一二三四五六七八九十]+)[\.\、\)\:：\s]|\([0-9]+\)))\s*/g;
            const matches = [...normalized.matchAll(questionHeaderRegex)];

            if (matches.length >= 2) {
                let lastIndex = 0;
                for (let i = 1; i < matches.length; i++) {
                    const splitIdx = matches[i].index;
                    rawBlocks.push(normalized.substring(lastIndex, splitIdx).trim());
                    lastIndex = splitIdx;
                }
                rawBlocks.push(normalized.substring(lastIndex).trim());
            } else {
                rawBlocks = normalized.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
            }

            const parsedList = [];

            rawBlocks.forEach(block => {
                if (!block) return;
                const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length === 0) return;

                let answer = '';
                let explanation = '';
                let category = '未分类';
                let type = '';
                const options = {};
                const qLines = [];
                const expLines = [];
                let inExplanation = false;

                const catMatch = block.match(/(?:【|\[)(?:分类|类别|科目)[\:：\s]*([^】\]]+)(?:】|\])/);
                if (catMatch) category = catMatch[1].trim();

                const typeMatch = block.match(/【?(?:单选题|多选题|判断题|单选|多选|判断)】?/);
                if (typeMatch) {
                    if (typeMatch[0].includes('多')) type = '多选';
                    else if (typeMatch[0].includes('判')) type = '判断';
                    else if (typeMatch[0].includes('单')) type = '单选';
                }

                for (let line of lines) {
                    const ansMatch = line.match(/^(?:【?\s*(?:正确答案|参考答案|答案|Answer|ANSWER|Key)\s*】?[\:：\s]*)([A-Za-z对错正确错误√×]+)/i);
                    if (ansMatch) {
                        let rawAns = ansMatch[1].trim();
                        if (rawAns.includes('对') || rawAns.includes('正确') || rawAns.includes('√')) {
                            answer = 'A';
                        } else if (rawAns.includes('错') || rawAns.includes('错误') || rawAns.includes('×')) {
                            answer = 'B';
                        } else {
                            answer = rawAns.toUpperCase().replace(/[^A-Z]/g, '');
                        }
                        inExplanation = false;
                        continue;
                    }

                    const expMatch = line.match(/^(?:【?\s*(?:解析|解释|Explanation|分析)\s*】?[\:：\s]*)(.*)/i);
                    if (expMatch) {
                        inExplanation = true;
                        if (expMatch[1].trim()) {
                            expLines.push(expMatch[1].trim());
                        }
                        continue;
                    }

                    if (inExplanation) {
                        expLines.push(line);
                        continue;
                    }

                    const mdCheck = line.match(/^[-*]\s*\[([ xX])\]\s*(.+)$/);
                    if (mdCheck) {
                        const optKey = String.fromCharCode(65 + Object.keys(options).length);
                        options[optKey] = mdCheck[2].trim();
                        if (mdCheck[1].toLowerCase() === 'x') {
                            answer += optKey;
                        }
                        continue;
                    }

                    if (/^(?:\(|\[)?([A-F])(?:\)|\])?[\.\、\:：\s]/i.test(line)) {
                        const optMatches = [...line.matchAll(/(?:\(|\[)?([A-F])(?:\)|\])?[\.\、\:：\s]+([^\n\rA-F]+?)(?=(?:\s+(?:\(|\[)?[A-F](?:\)|\])?[\.\、\:：\s]|$))/gi)];
                        if (optMatches.length > 0) {
                            optMatches.forEach(m => {
                                const optKey = m[1].toUpperCase();
                                const optVal = m[2].trim().replace(/[;；，,]$/, '');
                                if (optVal) options[optKey] = optVal;
                            });
                        } else {
                            const singleM = line.match(/^(?:\(|\[)?([A-F])(?:\)|\])?[\.\、\:：\s]+(.*)$/i);
                            if (singleM) {
                                options[singleM[1].toUpperCase()] = singleM[2].trim();
                            }
                        }
                        continue;
                    }

                    qLines.push(line);
                }

                if (!answer) {
                    const fallbackAns = block.match(/(?:【?\s*(?:正确答案|参考答案|答案|Answer|ANSWER|Key)\s*】?[\:：\s]*)([A-Za-z对错正确错误√×]+)/i);
                    if (fallbackAns) {
                        let rawAns = fallbackAns[1].trim();
                        if (rawAns.includes('对') || rawAns.includes('正确') || rawAns.includes('√')) answer = 'A';
                        else if (rawAns.includes('错') || rawAns.includes('错误') || rawAns.includes('×')) answer = 'B';
                        else answer = rawAns.toUpperCase().replace(/[^A-Z]/g, '');
                    }
                }

                explanation = expLines.join('\n').trim();

                let qText = qLines.join('\n').trim();
                qText = qText.replace(/^(?:第\s*[0-9一二三四五六七八九十百]+\s*题|(?:\d+|[一二三四五六七八九十]+)[\.\、\)\:：\s]|\([0-9]+\))\s*/, '');
                qText = qText.replace(/\(?(?:单选题|多选题|判断题|单选|多选|判断)\)?/g, '').trim();

                if (Object.keys(options).length === 0) {
                    if (answer === 'A' || answer === 'B' || block.includes('对') || block.includes('错') || block.includes('判断')) {
                        options['A'] = '正确';
                        options['B'] = '错误';
                        if (!type) type = '判断';
                    }
                }

                if (!type) {
                    if (answer.length > 1) type = '多选';
                    else if (Object.keys(options).length === 2 && options['A'] && (options['A'].includes('正') || options['A'].includes('对'))) type = '判断';
                    else type = '单选';
                }

                if (qText && answer) {
                    parsedList.push({
                        q: qText,
                        a: answer,
                        o: options,
                        e: explanation,
                        t: type,
                        c: category
                    });
                }
            });

            return parsedList;
        }

        function handleTextInputChange() {
            clearTimeout(textInputDebounce);
            textInputDebounce = setTimeout(() => {
                const content = document.getElementById('text-import-content')?.value || '';
                const parsed = parsePlainText(content);
                const badge = document.getElementById('text-import-preview-badge');
                const countEl = document.getElementById('text-parsed-count');
                if (badge && countEl) {
                    countEl.innerText = parsed.length;
                    badge.style.display = parsed.length > 0 ? 'block' : 'none';
                }
            }, 150);
        }

        function fillSampleText() {
            const sample = 
`1. 什么是 JavaScript 中的闭包（Closure）？
A. 函数内部可以访问外部作用域变量的机制
B. 立即执行函数表达式（IIFE）的别名
C. 私有类的构造器
D. DOM节点的事件冒泡捕获
答案: A
解析: 闭包由函数以及创建该函数的词法环境组合而成。

2. 任意两位数乘 11 的速算口诀是“两头一拉，中间相加”。计算 45 × 11 的结果是？
A. 455
B. 485
C. 495
D. 505
答案: C
解析: 首位是4，末位是5，中间 4 + 5 = 9，因此是 495。

3. 月球本身是不发光的，我们看到的皎洁月光完全来自反射太阳光。
答案: 对
解析: 月球不发光不透明，通过漫反射太阳辐射在夜空中显现。

4. 以下哪些属于 JavaScript 事件循环中的微任务（Microtask）？
A. setTimeout 定时器回调
B. Promise.then 回调
C. queueMicrotask() 回调
D. setInterval 定时器回调
答案: BC
解析: Promise.then 与 queueMicrotask 属于微任务，setTimeout 为宏任务。`;

            const contentEl = document.getElementById('text-import-content');
            const nameEl = document.getElementById('text-import-name');
            if (contentEl) contentEl.value = sample;
            if (nameEl && !nameEl.value) nameEl.value = '💡 精选综合知识小测试';
            handleTextInputChange();
        }

        function confirmTextImport() {
            const content = document.getElementById('text-import-content')?.value || '';
            const parsed = parsePlainText(content);
            if (parsed.length === 0) {
                alert('汪！没有识别到有效的题目。\n请检查文本，确保每题包含题干与“答案: A”或“答案: 对”等标记。');
                return;
            }

            let nameInput = document.getElementById('text-import-name')?.value?.trim();
            if (!nameInput) {
                const firstQ = parsed[0].q.replace(/[\r\n\t]/g, ' ').substring(0, 10);
                nameInput = firstQ ? `速记: ${firstQ}...` : `速记题库_${new Date().toLocaleDateString()}`;
            }

            const meta = getMeta();
            const existingDb = meta.find(m => m.name === nameInput);

            if (existingDb) {
                const userWantsUpdate = confirm(
                    `发现已存在的狗窝：【${nameInput}】\n\n` +
                    `🦴 点击【确定】：更新题目，但保留你的刷题进度和历史成绩。\n` +
                    `🆕 点击【取消】：把它当作一个新的狗窝导入（不覆盖旧的）。`
                );
                if (userWantsUpdate) {
                    try {
                        localStorage.setItem(`bingo_db_${existingDb.id}`, JSON.stringify(parsed));
                        existingDb.count = parsed.length;
                        existingDb.lastUsed = Date.now();
                        localStorage.removeItem(`bingo_wip_${existingDb.id}`);
                        saveMeta(meta);
                        closeImportModal();
                        renderDbList();
                        alert(`汪！成功更新了狗窝【${nameInput}】（共 ${parsed.length} 根骨头）！`);
                        return;
                    } catch (e) {
                        alert('更新失败，存储空间不足！');
                        return;
                    }
                }
            }

            createNewDb(nameInput, parsed, meta);
            saveMeta(meta);
            closeImportModal();
            renderDbList();
            alert(`汪！成功挖掘到新狗窝【${nameInput}】（共 ${parsed.length} 根骨头）！`);
        }

        // ==========================================
        // 3. 官方推荐精品题库加载与一键挖宝
        // ==========================================

        async function loadPresetDecksData() {
            if (cachedPresetDecks) return cachedPresetDecks;
            try {
                const res = await fetch('./data/starter_decks.json?t=' + Date.now());
                if (res.ok) {
                    cachedPresetDecks = await res.json();
                    return cachedPresetDecks;
                }
            } catch (e) {
                console.warn('读取 starter_decks.json 失败，将使用内置保底推荐题库', e);
            }
            return [
                {
                    id: "starter_curiosity",
                    name: "🌟 奇妙自然与科学冷知识",
                    description: "天文地理、呆萌动物与自然科学奇趣大冒险，老少咸宜！",
                    tag: "趣味百科",
                    icon: "🌌",
                    questions: [
                        {
                            q: "在火星上看夕阳西下，太阳周围通常会呈现出什么奇妙的颜色？",
                            a: "B",
                            o: { A: "炽热的深红色", B: "梦幻的淡蓝色", C: "耀眼的翠绿色", D: "深沉的暗紫色" },
                            e: "火星大气微细尘埃会发生前向瑞利散射，使得太阳周围呈现淡蓝色日落。",
                            t: "单选",
                            c: "天文探索"
                        },
                        {
                            q: "金星的“一天”和“一年”相比，哪个更长？",
                            a: "A",
                            o: { A: "金星的一天比一年更长", B: "金星的一年比一天更长", C: "两者完全相等", D: "金星没有公转周期" },
                            e: "金星自转极为缓慢（约243个地球日），绕太阳公转约225日，因此一天比一年长！",
                            t: "单选",
                            c: "天文探索"
                        },
                        {
                            q: "海獭在水面睡觉时，为什么经常彼此手牵着手？",
                            a: "C",
                            o: { A: "互相取暖", B: "玩游戏", C: "防止被海浪水流冲散", D: "互相传递信号" },
                            e: "海獭手牵手是为了防止在睡梦中被海浪或洋流冲离族群。",
                            t: "单选",
                            c: "神奇动物"
                        }
                    ]
                }
            ];
        }

        async function renderPresetDecks() {
            const container = document.getElementById('preset-decks-list');
            if (!container) return;
            container.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-sub);">正在翻找官方宝藏...</div>';

            const decks = await loadPresetDecksData();
            const meta = getMeta();
            container.innerHTML = '';

            decks.forEach(deck => {
                const isInstalled = meta.some(m => m.name === deck.name);
                const card = document.createElement('div');
                card.className = 'preset-deck-card m3-ripple';
                card.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                        <div class="preset-deck-icon">${deck.icon || '📦'}</div>
                        <div style="flex:1; min-width:0;">
                            <div style="display:flex; align-items:center; gap:6px;">
                                <h4 style="margin:0; font-size:14px; font-weight:700; color:var(--md-sys-color-on-surface); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(deck.name)}</h4>
                                <span class="m3-badge" style="font-size:11px;">${escapeHtml(deck.tag || '精选')}</span>
                            </div>
                            <p style="margin:3px 0 0 0; font-size:12px; color:var(--text-sub); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                共 ${deck.questions.length} 根骨头 · ${escapeHtml(deck.description)}
                            </p>
                        </div>
                    </div>
                    <button class="btn ${isInstalled ? 'btn-ghost m3-btn--tonal' : 'btn-primary m3-btn--filled'} m3-ripple"
                        style="font-size:12px; padding:6px 12px; flex-shrink:0; margin-left:8px;"
                        onclick="importPresetDeck('${deck.id}')">
                        ${isInstalled ? '已挖入 ✓' : '挖进狗窝 🦴'}
                    </button>
                `;
                container.appendChild(card);
            });
        }

        async function importPresetDeck(deckId) {
            const decks = await loadPresetDecksData();
            const deck = decks.find(d => d.id === deckId);
            if (!deck) return;

            const meta = getMeta();
            const existingDb = meta.find(m => m.name === deck.name);
            if (existingDb) {
                const reimport = confirm(`【${deck.name}】已经在你的狗窝中了，要重新载入并重置进度吗？`);
                if (!reimport) return;
                try {
                    localStorage.setItem(`bingo_db_${existingDb.id}`, JSON.stringify(deck.questions));
                    existingDb.count = deck.questions.length;
                    existingDb.lastUsed = Date.now();
                    localStorage.removeItem(`bingo_wip_${existingDb.id}`);
                    saveMeta(meta);
                    renderDbList();
                    renderPresetDecks();
                    alert(`汪！已重新刷新【${deck.name}】！`);
                } catch (e) {
                    alert('存储空间不足，未能保存！');
                }
                return;
            }

            createNewDb(deck.name, deck.questions, meta);
            saveMeta(meta);
            renderDbList();
            renderPresetDecks();
            alert(`🎉 成功挖掘到【${deck.name}】（共 ${deck.questions.length} 根骨头）！`);
        }
