        let tempImportData = null;

        function showImportModal() {
            document.getElementById('modal-import').style.display = 'flex';
            document.getElementById('import-feedback').style.display = 'none';
            document.getElementById('import-status').innerText = '';
            document.getElementById('import-loader').style.display = 'none';
            document.getElementById('import-preview').style.display = 'none';
            document.getElementById('btn-confirm-import').style.display = 'none';
            document.getElementById('btn-select-file').style.display = 'inline-flex';
        }
        function closeImportModal() {
            document.getElementById('modal-import').style.display = 'none';
            document.getElementById('file-input').value = '';
        }


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
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true },);

                    tempImportData = {};
                    const sheetSelectionContainer = document.getElementById('sheet-selection-container');
                    sheetSelectionContainer.innerHTML = '';

                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const json = XLSX.utils.sheet_to_json(worksheet, {
                            raw: false,
                            dateNF: 'yyyy/mm/dd' // 你可以改成 'yyyy-mm-dd' 或其他格式
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

        // --- 核心修改：支持更新题库并保留进度的导入逻辑 ---

        function confirmImport() {
            const selectedSheets = Array.from(document.querySelectorAll('#sheet-selection-container input[name="sheet"]:checked'))
                .map(input => input.value);

            if (selectedSheets.length === 0) {
                alert('总得选个地方挖吧？');
                return;
            }

            const meta = getMeta(); // 获取现有题库列表
            let updatedCount = 0;
            let newCount = 0;

            selectedSheets.forEach(sheetName => {
                const data = tempImportData[sheetName];

                // 1. 检查是否存在同名题库
                const existingDb = meta.find(m => m.name === sheetName);

                if (existingDb) {
                    // 2. 如果存在，询问用户意图
                    const userWantsUpdate = confirm(
                        `发现已存在的狗窝：【${sheetName}】\n\n` +
                        `🦴 点击【确定】：更新题目，但保留你的刷题进度和历史成绩。\n` +
                        `🆕 点击【取消】：把它当作一个新的狗窝导入（不覆盖旧的）。`
                    );

                    if (userWantsUpdate) {
                        // --- A. 更新模式 ---
                        try {
                            // 覆盖题目数据
                            localStorage.setItem(`bingo_db_${existingDb.id}`, JSON.stringify(data));

                            // 更新元数据中的数量和时间
                            existingDb.count = data.length;
                            existingDb.lastUsed = Date.now();

                            // 关键：清除“中断暂存”的状态。因为题目变了，之前的断点可能对应不上，防止报错。
                            localStorage.removeItem(`bingo_wip_${existingDb.id}`);

                            // 修正进度：如果新题目变少了，而你进度已经超出了新总数，把进度重置为最大值
                            let currentProg = parseInt(localStorage.getItem(`bingo_prog_${existingDb.id}`) || '0');
                            if (currentProg > data.length) {
                                localStorage.setItem(`bingo_prog_${existingDb.id}`, data.length);
                                existingDb.progress = data.length; // 如果内存中有也要更新
                            }

                            updatedCount++;
                        } catch (e) {
                            alert('更新失败，可能是存储空间不足！');
                            console.error(e);
                        }
                    } else {
                        // --- B. 新建模式 (用户点击了取消) ---
                        createNewDb(sheetName, data, meta);
                        newCount++;
                    }
                } else {
                    // --- C. 新建模式 (原本就不存在) ---
                    createNewDb(sheetName, data, meta);
                    newCount++;
                }
            });

            saveMeta(meta);
            closeImportModal();
            renderDbList(); // 刷新列表

            // 提示结果
            if (updatedCount > 0 || newCount > 0) {
                alert(`汪！操作完成：\n🛠 更新了 ${updatedCount} 个旧狗窝\n✨ 挖掘了 ${newCount} 个新狗窝`);
            }
        }

        // 辅助函数：创建新题库
