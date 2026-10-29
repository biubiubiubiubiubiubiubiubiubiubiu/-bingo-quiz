let isChildMode = false;

// --- 海鲜宠物设定库 ---
const SEAFOOD_PETS = {
    fish: {
        id: 'fish',
        name: '小泡鱼',
        avatar: '🐟',
        evolveAvatars: ['🐟', '🐠', '🐡'],
        title: '吐泡大师',
        favoriteFood: '海藻小饼干',
        foodIcon: '🍪',
        quotes: [
            '咕噜咕噜~ 做题像吐泡泡一样简单！',
            '太香啦！小鱼饼干真好吃，再答对一题吧！',
            '小主人好厉害，我们是海底最强拍档！',
            '深呼吸，慢慢看题目，你一定行的~'
        ]
    },
    crab: {
        id: 'crab',
        name: '机灵蟹',
        avatar: '🦀',
        evolveAvatars: ['🦀', '🦞', '👑🦀'],
        title: '钳碎难题',
        favoriteFood: '香脆海苔',
        foodIcon: '🍘',
        quotes: [
            '咔嚓咔嚓！所有的难题都被我的大钳子剪碎啦！',
            '举起大双钳为你欢呼！太棒了！',
            '海苔脆脆，做题对对！继续前进！',
            '横着走也能通关，小主人冲鸭！'
        ]
    },
    shrimp: {
        id: 'shrimp',
        name: '跳跳虾',
        avatar: '🦐',
        evolveAvatars: ['🦐', '🍤', '✨🦐'],
        title: '弹射小能手',
        favoriteFood: '浮游布丁',
        foodIcon: '🍮',
        quotes: [
            '蹦蹦跳跳！答对一题我就长大一厘米！',
            '哇呜！弹射起飞，小主人你太聪明啦！',
            '布丁好甜呀~ 脑筋转得比海浪还快！',
            '跳一跳，十年少，做做题，得满分！'
        ]
    },
    octopus: {
        id: 'octopus',
        name: '皮皮章',
        avatar: '🐙',
        evolveAvatars: ['🐙', '🦑', '🎩🐙'],
        title: '八爪智多星',
        favoriteFood: '深海小丸子',
        foodIcon: '🍡',
        quotes: [
            '我有八只触手，一手写答案，七手为你鼓掌！',
            '咕嘟咕嘟，深海丸子真美味！',
            '墨汁喷走所有烦恼，正确答案就在眼前！',
            '智慧如海，小主人今天也是满分选手！'
        ]
    }
};

// --- 宠物状态与存储 ---
function getPetData() {
    try {
        const saved = localStorage.getItem('bingo_child_pet');
        if (saved) {
            const data = JSON.parse(saved);
            if (data && SEAFOOD_PETS[data.type]) return data;
        }
    } catch (e) {
        console.error('读取宠物数据失败:', e);
    }
    return {
        type: 'fish',
        customName: '小泡鱼',
        exp: 0,
        feedCount: 0,
        level: 1
    };
}

function savePetData(pet) {
    try {
        localStorage.setItem('bingo_child_pet', JSON.stringify(pet));
    } catch (e) {
        console.error('保存宠物数据失败:', e);
    }
}

function getPetLevelInfo(exp) {
    if (exp >= 250) {
        return { level: 4, title: '龙宫大仙', nextExp: 500, minExp: 250, evolveIndex: 2 };
    } else if (exp >= 100) {
        return { level: 3, title: '深海学霸', nextExp: 250, minExp: 100, evolveIndex: 2 };
    } else if (exp >= 30) {
        return { level: 2, title: '活泼小将', nextExp: 100, minExp: 30, evolveIndex: 1 };
    } else {
        return { level: 1, title: '萌宝幼苗', nextExp: 30, minExp: 0, evolveIndex: 0 };
    }
}

function getPetCurrentAvatar(pet) {
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const lvlInfo = getPetLevelInfo(pet.exp || 0);
    return petDef.evolveAvatars[lvlInfo.evolveIndex] || petDef.avatar;
}

// 答对喂食
let lastFeedingInfo = null;
function feedPetOnCorrectAnswer() {
    const pet = getPetData();
    const oldLvlInfo = getPetLevelInfo(pet.exp || 0);
    pet.exp = (pet.exp || 0) + 10;
    pet.feedCount = (pet.feedCount || 0) + 1;
    const newLvlInfo = getPetLevelInfo(pet.exp);
    pet.level = newLvlInfo.level;
    savePetData(pet);

    lastFeedingInfo = {
        pet: pet,
        leveledUp: newLvlInfo.level > oldLvlInfo.level,
        oldLevel: oldLvlInfo.level,
        newLevel: newLvlInfo.level,
        levelTitle: newLvlInfo.title
    };

    updatePetWidgets();
    return lastFeedingInfo;
}

// 宠物点击语音互动
function speakPetQuote() {
    const pet = getPetData();
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const quotes = petDef.quotes;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    // 弹跳动画
    const widgets = document.querySelectorAll('.child-pet-avatar, .child-pet-widget');
    widgets.forEach(w => {
        w.classList.add('pet-bounce');
        setTimeout(() => w.classList.remove('pet-bounce'), 800);
    });

    if (typeof speakText === 'function') {
        speakText(quote);
    }
}

// 更新界面上的宠物挂件
function updatePetWidgets() {
    if (!isChildMode) return;
    const pet = getPetData();
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const lvlInfo = getPetLevelInfo(pet.exp || 0);
    const currentAvatar = getPetCurrentAvatar(pet);

    // 1. 首页宠物状态卡片
    const homeBadge = document.getElementById('child-pet-home-badge');
    if (homeBadge) {
        homeBadge.innerHTML = `
            <div class="pet-avatar-circle" onclick="speakPetQuote()">${currentAvatar}</div>
            <div class="pet-badge-info" onclick="openPetModal()">
                <div style="font-weight:bold; font-size:15px; color:var(--text-main);">
                    ${pet.customName || petDef.name}
                    <span class="pet-level-tag">Lv.${lvlInfo.level} ${lvlInfo.title}</span>
                </div>
                <div style="font-size:12px; color:var(--text-sub); margin-top:2px;">
                    已投喂 ${pet.feedCount || 0} 次 · EXP: ${pet.exp}/${lvlInfo.nextExp}
                </div>
                <div class="pet-exp-bar"><div class="pet-exp-fill" style="width:${Math.min(100, Math.round(((pet.exp - lvlInfo.minExp) / (lvlInfo.nextExp - lvlInfo.minExp)) * 100))}%;"></div></div>
            </div>
            <button class="btn btn-ghost" style="padding:4px 10px; font-size:12px; border-radius:12px;" onclick="openPetModal()">水族馆 🐠</button>
        `;
        homeBadge.style.display = 'flex';
    }

    // 2. 答题界面伴学浮窗
    const quizWidget = document.getElementById('child-pet-quiz-widget');
    if (quizWidget) {
        quizWidget.innerHTML = `
            <div class="pet-quiz-avatar" onclick="speakPetQuote()" title="点击听我说说话！">${currentAvatar}</div>
            <div class="pet-quiz-name">${pet.customName || petDef.name} (Lv.${lvlInfo.level})</div>
        `;
        quizWidget.style.display = 'flex';
    }
}

// 宠物选择弹窗
function openPetModal() {
    const modal = document.getElementById('modal-pet-selection');
    if (!modal) return;
    const currentPet = getPetData();
    const listEl = document.getElementById('pet-selection-cards');
    if (listEl) {
        listEl.innerHTML = '';
        Object.values(SEAFOOD_PETS).forEach(p => {
            const isSelected = p.id === currentPet.type;
            const card = document.createElement('div');
            card.className = `pet-card ${isSelected ? 'selected' : ''}`;
            card.onclick = () => selectPet(p.id);
            card.innerHTML = `
                <div class="pet-card-avatar">${p.avatar}</div>
                <div style="font-weight:bold; font-size:16px;">${p.name}</div>
                <div style="font-size:12px; color:var(--text-sub); margin:4px 0;">喜好：${p.foodIcon} ${p.favoriteFood}</div>
                <div style="font-size:11px; color:var(--primary); font-style:italic;">“${p.quotes[0]}”</div>
                <div class="pet-card-check">${isSelected ? '正在陪伴中 ⭐' : '选我当伙伴 🐾'}</div>
            `;
            listEl.appendChild(card);
        });
    }
    modal.style.display = 'flex';
}

function closePetModal() {
    const modal = document.getElementById('modal-pet-selection');
    if (modal) modal.style.display = 'none';
}

function selectPet(petId) {
    if (!SEAFOOD_PETS[petId]) return;
    const pet = getPetData();
    pet.type = petId;
    pet.customName = SEAFOOD_PETS[petId].name;
    savePetData(pet);
    updatePetWidgets();
    closePetModal();

    // 庆祝并朗读
    const def = SEAFOOD_PETS[petId];
    if (typeof speakText === 'function') {
        speakText(`太棒啦！从现在开始，${def.name}就是你的好搭档啦！`);
    }
}

// 初始化儿童模式
function initChildMode() {
    const mode = localStorage.getItem('app_mode');
    if (mode === 'child') {
        enableChildMode(true);
    }
}

// 切换开关
function toggleChildMode() {
    isChildMode = !isChildMode;
    enableChildMode(isChildMode);
}

function enableChildMode(enable) {
    isChildMode = enable;
    const html = document.documentElement;
    const icon = document.getElementById('child-icon');
    const homeBadge = document.getElementById('child-pet-home-badge');
    const quizWidget = document.getElementById('child-pet-quiz-widget');

    if (enable) {
        html.setAttribute('data-mode', 'child');
        localStorage.setItem('app_mode', 'child');
        if (icon) icon.innerText = '👨‍👩‍👧';
        const kidTheme = localStorage.getItem('app_kid_theme') || 'girl';
        html.setAttribute('data-theme', kidTheme);
        updatePetWidgets();
    } else {
        html.removeAttribute('data-mode');
        localStorage.setItem('app_mode', 'normal');
        if (icon) icon.innerText = '👶';
        if (homeBadge) homeBadge.style.display = 'none';
        if (quizWidget) quizWidget.style.display = 'none';
        initTheme();
    }

    if (document.getElementById('view-home').style.display === 'block') renderDbList();
    if (document.getElementById('view-dashboard').style.display === 'block' && currentDb) setupDashboard(currentDb.id);
}

// --- 儿童模式答题即时反馈（集成海鲜萌宠喂食动画） ---
function showChildFeedback() {
    const feedback = document.getElementById('child-feedback');
    if (!feedback) return;

    const pet = getPetData();
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const lvlInfo = getPetLevelInfo(pet.exp);
    const currentAvatar = getPetCurrentAvatar(pet);

    const feedbackPetEl = document.getElementById('feedback-pet-container');
    if (feedbackPetEl) {
        let levelUpBanner = '';
        if (lastFeedingInfo && lastFeedingInfo.leveledUp) {
            levelUpBanner = `<div class="pet-levelup-banner">🎉 哇！升级啦！变成【${lastFeedingInfo.levelTitle}】！</div>`;
            if (typeof speakText === 'function') {
                speakText(`太棒啦！${pet.customName || petDef.name}升级成${lastFeedingInfo.levelTitle}啦！`);
            }
        }

        feedbackPetEl.innerHTML = `
            <div class="feedback-pet-animation">
                <span class="eating-food">${petDef.foodIcon}</span>
                <span class="eating-pet">${currentAvatar}</span>
            </div>
            <div style="font-weight:bold; font-size:18px; color:var(--text-main); margin-top:10px;">
                ${pet.customName || petDef.name} 饱餐了一顿！
                <span style="color:#FF70A6; font-size:16px;">+10 EXP</span>
            </div>
            ${levelUpBanner}
            <div class="pet-exp-bar" style="width:200px; margin:10px auto 0 auto;">
                <div class="pet-exp-fill" style="width:${Math.min(100, Math.round(((pet.exp - lvlInfo.minExp) / (lvlInfo.nextExp - lvlInfo.minExp)) * 100))}%;"></div>
            </div>
        `;
    }

    const titles = ['太棒了！', 'Bingo！', '真聪明！', '答对了！', '小海鲜为你鼓掌！'];
    const feedbackTitle = document.getElementById('feedback-title');
    if (feedbackTitle) {
        feedbackTitle.innerText = titles[Math.floor(Math.random() * titles.length)];
    }

    feedback.style.display = 'flex';

    if (childFeedbackTimeout) clearTimeout(childFeedbackTimeout);
    childFeedbackTimeout = setTimeout(nextChildQuestion, 2200);
}

// 儿童模式专用：下一题
function nextChildQuestion() {
    const feedback = document.getElementById('child-feedback');
    if (!feedback || feedback.style.display === 'none') return;

    if (childFeedbackTimeout) clearTimeout(childFeedbackTimeout);
    feedback.style.display = 'none';

    const nextIdx = lastVisibleQuestionIndex + 1;
    if (nextIdx < currentQuiz.length) {
        const nextEl = document.getElementById(`q-${nextIdx}`);
        if (nextEl) {
            nextEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            lastVisibleQuestionIndex = nextIdx;
            saveWipQuiz();
        }
    } else {
        clearWipQuiz();
        const pet = getPetData();
        const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
        alert(`哇！所有的题目都做完啦！${pet.customName || petDef.name} 吃得饱饱的，为你骄傲！`);
        history.back();
    }
}
