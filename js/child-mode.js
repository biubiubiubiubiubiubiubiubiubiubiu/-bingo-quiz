let isChildMode = false;
let childStreak = 0; // 儿童模式连胜计数

// --- 全局声音总控与音量管理 (SOUND MASTER CONTROLLER) ---
function togglePetSound(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    PetSound.toggleSound();
}

// --- 伴学精灵个性习性与偏好管理 (PET HABIT & PERSONALITY CONTROLLER) ---
function getPetActivity() {
    return localStorage.getItem('bingo_child_pet_activity') || 'normal';
}

function setPetActivity(level) {
    if (!['low', 'normal', 'high'].includes(level)) level = 'normal';
    localStorage.setItem('bingo_child_pet_activity', level);
    if (typeof PetSound !== 'undefined' && PetSound.isEnabled()) {
        PetSound.bubble();
    }
    if (window.roamingPet) {
        window.roamingPet.applyHabitSettings();
    }
    syncHabitControlsUI();
}

function getPetChattiness() {
    return localStorage.getItem('bingo_child_pet_chattiness') || 'normal';
}

function setPetChattiness(level) {
    if (!['quiet', 'normal', 'talkative'].includes(level)) level = 'normal';
    localStorage.setItem('bingo_child_pet_chattiness', level);
    if (typeof PetSound !== 'undefined' && PetSound.isEnabled()) {
        PetSound.bubble();
    }
    if (window.roamingPet) {
        window.roamingPet.applyHabitSettings();
    }
    syncHabitControlsUI();
}

function syncHabitControlsUI() {
    const activity = getPetActivity();
    const chattiness = getPetChattiness();

    // 更新活跃度按钮高亮与文字说明
    const actBtns = document.querySelectorAll('#activity-selector .habit-seg-btn');
    actBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-val') === activity);
    });
    const actLabel = document.getElementById('pet-activity-label');
    if (actLabel) {
        const labels = {
            low: '文静 (安静少游动)',
            normal: '适中 (常规巡游)',
            high: '活泼 (元气漫游)'
        };
        actLabel.innerText = labels[activity] || labels.normal;
    }

    // 更新话痨度按钮高亮与文字说明
    const chatBtns = document.querySelectorAll('#chattiness-selector .habit-seg-btn');
    chatBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-val') === chattiness);
    });
    const chatLabel = document.getElementById('pet-chattiness-label');
    if (chatLabel) {
        const labels = {
            quiet: '乖巧 (仅互动时说话)',
            normal: '适中 (30~50秒)',
            talkative: '话痨 (12~20秒爆笑高频)'
        };
        chatLabel.innerText = labels[chattiness] || labels.normal;
    }
}

// --- 纯前端 Web Audio 仿生物理声学合成器 (100% 离线支持) ---
const PetSound = {
    ctx: null,
    getCtx() {
        try {
            if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return this.ctx;
        } catch (e) {
            return null;
        }
    },
    isEnabled() {
        return localStorage.getItem('bingo_child_sound') !== 'false';
    },
    toggleSound() {
        const next = !this.isEnabled();
        localStorage.setItem('bingo_child_sound', next ? 'true' : 'false');
        if (next) {
            this.bubble();
        }
        if (typeof updatePetWidgets === 'function') {
            updatePetWidgets();
        }
        return next;
    },

    // 1. Q 弹水泡破灭音 (吐泡/短促互动)
    bubble() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.11);
            gain.gain.setValueAtTime(0.20, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.11);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.11);
        } catch (e) {}
    },

    // 2. 连珠水泡升腾音 (小泡鱼欢快吐泡)
    multiBubble() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [0, 0.08, 0.16].forEach((delay, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                const startF = 460 + idx * 110;
                osc.frequency.setValueAtTime(startF, now + delay);
                osc.frequency.exponentialRampToValueAtTime(startF * 2.3, now + delay + 0.08);
                gain.gain.setValueAtTime(0.14, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.005, now + delay + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.085);
            });
        } catch (e) {}
    },

    // 3. 进食吧唧咀嚼声 (喂食饱餐)
    eat() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [0, 0.075, 0.15].forEach((delay, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(320 + i * 85, now + delay);
                osc.frequency.exponentialRampToValueAtTime(160, now + delay + 0.06);
                gain.gain.setValueAtTime(0.24, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.065);
            });
        } catch (e) {}
    },

    // 4. 变身盛典激昂大和弦琶音
    evolution() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.1);
                gain.gain.setValueAtTime(0, now + idx * 0.1);
                gain.gain.linearRampToValueAtTime(0.26, now + idx * 0.1 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.1);
                osc.stop(now + idx * 0.1 + 0.4);
            });
            setTimeout(() => {
                try {
                    const chordNow = ctx.currentTime;
                    const oscChord = ctx.createOscillator();
                    const gainChord = ctx.createGain();
                    oscChord.type = 'sine';
                    oscChord.frequency.setValueAtTime(1046.50, chordNow);
                    gainChord.gain.setValueAtTime(0.3, chordNow);
                    gainChord.gain.exponentialRampToValueAtTime(0.001, chordNow + 1.2);
                    oscChord.connect(gainChord);
                    gainChord.connect(ctx.destination);
                    oscChord.start(chordNow);
                    oscChord.stop(chordNow + 1.2);
                } catch (e) {}
            }, notes.length * 100);
        } catch (e) {}
    },

    // 5. 答对连胜鼓舞音 (大三和弦轻快弹拨)
    cheer() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.18, now + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.22);
            });
        } catch (e) {}
    },

    // 6. 机灵蟹：海底沙滩细碎小步足音 (沙沙微击)
    crabScuttle() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [0, 0.07].forEach((delay) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(850 + Math.random() * 200, now + delay);
                osc.frequency.exponentialRampToValueAtTime(320, now + delay + 0.025);
                gain.gain.setValueAtTime(0.06, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.002, now + delay + 0.025);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.03);
            });
        } catch (e) {}
    },

    // 7. 机灵蟹：沿侧边玻璃壁攀爬足音 (清脆微谐波敲击)
    crabClimb() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1760 + (Math.random() - 0.5) * 120, now);
            gain.gain.setValueAtTime(0.065, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {}
    },

    // 8. 机灵蟹：大螯双剪音 (咔嚓！咔嚓！)
    crabSnip() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [0, 0.075].forEach((delay) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(1400, now + delay);
                osc.frequency.exponentialRampToValueAtTime(320, now + delay + 0.035);
                gain.gain.setValueAtTime(0.20, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.035);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + delay);
                osc.stop(now + delay + 0.04);
            });
        } catch (e) {}
    },

    // 9. 机灵蟹：高空落回沙滩软落地撞击音 (沉闷沙滩噗通)
    crabThud() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
            gain.gain.setValueAtTime(0.26, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.16);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.17);
        } catch (e) {}
    },

    // 10. 小泡鱼：自然划水流线游弋音 (柔顺微波)
    fishGlide() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.22);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.002, now + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.23);
        } catch (e) {}
    },

    // 11. 小泡鱼：急速摆尾破水逃逸音
    fishDart() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(820, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.17);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.17);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch (e) {}
    },

    // 12. 跳跳虾：弓背爆发弹跳反冲音
    shrimpSnap() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(1700, now + 0.05);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.13);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.13);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.14);
        } catch (e) {}
    },

    // 13. 跳跳虾：如羽毛般慢速飘落水流声
    shrimpFloat() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(840, now);
            osc.frequency.exponentialRampToValueAtTime(620, now + 0.22);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.002, now + 0.22);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.23);
        } catch (e) {}
    },

    // 14. 皮皮章：漏斗强力喷流音
    octopusJet() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(340, now);
            osc.frequency.exponentialRampToValueAtTime(85, now + 0.20);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.20);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.21);
        } catch (e) {}
    },

    // 15. 皮皮章：黑紫墨雾炸裂散开音
    inkDiffuse() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(55, now + 0.32);
            gain.gain.setValueAtTime(0.20, now);
            gain.gain.exponentialRampToValueAtTime(0.002, now + 0.32);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.33);
        } catch (e) {}
    },

    // 16. 皮皮章：吸盘从玻璃壁脱离的空腔轻响 (啵~)
    suctionPop() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(640, now);
            osc.frequency.exponentialRampToValueAtTime(170, now + 0.055);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.055);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {}
    },

    // 17. 睡着打盹小呼噜呼吸音
    petSnore() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(155, now);
            osc.frequency.linearRampToValueAtTime(220, now + 0.35);
            osc.frequency.linearRampToValueAtTime(145, now + 0.7);
            gain.gain.setValueAtTime(0.02, now);
            gain.gain.linearRampToValueAtTime(0.10, now + 0.35);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.7);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.72);
            // 呼噜呼噜后冒一颗小泡泡
            setTimeout(() => this.bubble(), 750);
        } catch (e) {}
    },

    // 18. 醒来伸懒腰轻快和弦音
    petWake() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                gain.gain.setValueAtTime(0.14, now + idx * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.07 + 0.16);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.07);
                osc.stop(now + idx * 0.07 + 0.17);
            });
        } catch (e) {}
    },

    // 19. 靠近受惊快速闪避水声
    petFlee() {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(350, now);
            osc.frequency.exponentialRampToValueAtTime(1150, now + 0.085);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.085);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {}
    },

    // 20. 萌宠开口对话提示音 (按生物属性专属水族搞怪开嗓声学设计)
    // 20. 萌宠开口对话提示音 (按生物属性专属水族搞怪开嗓声学设计，含物理声学微解谐)
    voiceChime(petType = 'fish') {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const jitter = (Math.random() - 0.5) * 30; // 物理微谐波随机解谐
            if (petType === 'crab') {
                // 🦀 机灵蟹：搞怪机械小钢钳合击咔嚓声 (Snappy Claw Snip-Clack)
                [0, 0.045].forEach((d, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    const startF = (idx === 0 ? 1200 : 1600) + jitter;
                    osc.frequency.setValueAtTime(startF, now + d);
                    osc.frequency.exponentialRampToValueAtTime(320, now + d + 0.04);
                    gain.gain.setValueAtTime(0.20, now + d);
                    gain.gain.exponentialRampToValueAtTime(0.005, now + d + 0.04);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + d);
                    osc.stop(now + d + 0.045);
                });
            } else if (petType === 'shrimp') {
                // 🦐 跳跳虾：搞怪水下超高弹簧蹦射滑音 (Twangy Spring Sproing & Snap)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(420 + jitter, now);
                osc.frequency.exponentialRampToValueAtTime(2600 + jitter * 2, now + 0.08);
                gain.gain.setValueAtTime(0.16, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + 0.09);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.095);
            } else if (petType === 'octopus') {
                // 🐙 皮皮章：深海黏液吸盘滑音与咕嘟水压音 (Squishy Squelch & Deep Plop)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(560 + jitter, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.125);
            } else {
                // 🐟 小泡鱼：两连清脆滑稽的升腾水泡破灭音 (Glug-Plop Bubbles)
                [0, 0.055].forEach((d, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    const startF = (idx === 0 ? 460 : 720) + jitter;
                    const endF = (idx === 0 ? 1280 : 1850) + jitter * 1.5;
                    osc.frequency.setValueAtTime(startF, now + d);
                    osc.frequency.exponentialRampToValueAtTime(endF, now + d + 0.05);
                    gain.gain.setValueAtTime(0.18, now + d);
                    gain.gain.exponentialRampToValueAtTime(0.005, now + d + 0.05);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + d);
                    osc.stop(now + d + 0.055);
                });
            }
        } catch (e) {}
    }
};

// --- 拟真萌宠语音系统 (PET VOICE SYSTEM: DUAL ENGINE) ---
const PetVoice = {
    speaking: false,
    currentUtterance: null,

    // 四大物种专属搞怪水族声线与性格配置
    SPECIES_CONFIG: {
        fish: {
            pitch: 1.82, // 调皮滑稽超萌泡泡音
            rate: 1.16,
            preferredVoices: ['Xiaoxiao', 'Yaoyao', 'Ting-Ting', 'Huihui', 'Desktop', 'Google 普通话', 'zh-CN'],
            personaPrefix: '',
            baseFreq: 580,
            waveType: 'sine',
            name: '小泡鱼'
        },
        crab: {
            pitch: 1.45, // 傲娇快节奏小钢钳碎嘴
            rate: 1.30,
            preferredVoices: ['Yunxi', 'Kangkang', 'Yunjian', 'Danny', 'Male', '男', '康康', '云希', 'Huihui', 'Desktop', 'Google 普通话', 'zh-CN'],
            personaPrefix: '',
            baseFreq: 460,
            waveType: 'triangle',
            name: '机灵蟹'
        },
        shrimp: {
            pitch: 1.95, // 极速超音速鬼畜蹦跳音
            rate: 1.42,
            preferredVoices: ['Xiaoxiao', 'Xiaoyi', 'Yunxi', 'Ting-Ting', 'Huihui', 'Desktop', 'Google 普通话', 'zh-CN'],
            personaPrefix: '',
            baseFreq: 680,
            waveType: 'sawtooth',
            name: '跳跳虾'
        },
        octopus: {
            pitch: 0.65, // 慢条斯理、黏糊糊咕嘟深海怪兽低音
            rate: 0.88,
            preferredVoices: ['Xiaoyi', 'Yaoyao', 'Yunxi', 'Huihui', 'Desktop', 'Google 普通话', 'zh-CN'],
            personaPrefix: '',
            baseFreq: 320,
            waveType: 'sine',
            name: '皮皮章'
        }
    },

    // 获取特定物种匹配的最佳中文童声/亲和女声 (支持学术播音轨独立优选与跨浏览器降级兼容)
    getBestChineseVoice(preferredList, petType = 'fish', isAcademic = false) {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        // 筛选全部可用中文发音人
        const zhVoices = voices.filter(v => v.lang.startsWith('zh') || v.lang.includes('CN') || v.lang.includes('cmn'));
        if (zhVoices.length === 0) return voices[0];

        // 1. 学术播音轨优先策略：寻找最清晰纯正普通话发音人
        if (isAcademic) {
            const academicKeywords = ['Xiaoxiao', 'Yunxi', 'Ting-Ting', 'Huihui', 'Google 普通话', 'Natural', 'Online'];
            for (const kw of academicKeywords) {
                const found = zhVoices.find(v => v.name.includes(kw));
                if (found) return found;
            }
            const localZh = zhVoices.find(v => v.localService);
            if (localZh) return localZh;
            return zhVoices[0];
        }

        // 2. 若优先列表中有特定名称匹配 (如 Yunxi, Xiaoxiao, Kangkang, Huihui)
        if (preferredList && Array.isArray(preferredList)) {
            for (const name of preferredList) {
                const found = zhVoices.find(v => v.name.includes(name));
                if (found) return found;
            }
        }

        // 3. 针对机灵蟹 (crab)：强力优先寻找男声关键字 (Edge/Windows/macOS 男声)
        if (petType === 'crab') {
            const maleVoice = zhVoices.find(v => 
                v.name.includes('Yunxi') || v.name.includes('Kangkang') || 
                v.name.includes('Yunjian') || v.name.includes('Danny') || 
                v.name.includes('Male') || v.name.includes('男')
            );
            if (maleVoice) return maleVoice;
        }

        // 4. 针对小泡鱼/跳跳虾：优先寻找清脆童声/女声
        if (petType === 'fish' || petType === 'shrimp') {
            const sweetVoice = zhVoices.find(v => 
                v.name.includes('Xiaoxiao') || v.name.includes('Yaoyao') || 
                v.name.includes('Ting-Ting') || v.name.includes('Huihui')
            );
            if (sweetVoice) return sweetVoice;
        }

        // 5. 在 Chrome 等单/双音色环境中：
        // 优先使用 localService 为 true 的本地音色 (如 Microsoft Huihui Desktop)，
        // 因为 Chrome 的远程 Google 普通话会完全忽略 pitch 调音属性！
        const localZh = zhVoices.find(v => v.localService);
        if (localZh) return localZh;

        return zhVoices[0];
    },

    // 文本语音清洗过滤系统 (彻底过滤 Emoji、粗括号与拟声前缀)
    cleanTextForSpeech(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            // 1. 过滤扩展象形符号及各类 Emoji
            .replace(/\p{Extended_Pictographic}/gu, '')
            .replace(/[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FD}\u{25FB}\u{25FC}\u{25B6}\u{25C0}]/gu, '')
            // 2. 移除变体选择符 (FE0E/FE0F) 与零宽连接符 (200D/200B等)
            .replace(/[\uFE00-\uFE0F\u200D\u200B-\u200F]/gu, '')
            // 3. 移除各类首部括号及老旧拟声前缀 (如【咕噜噜~】、【噗嗤~】、【咔嚓咔嚓！】、【咻——！】等)
            .replace(/^【.*?】\s*/, '')
            .replace(/^(咕噜噜|咔嚓咔嚓|咻——|噗嗤)[~！!—\-]*\s*/, '')
            // 4. 移除装饰用粗括号【】及[]，替换为空格以防粘连
            .replace(/[【】\[\]]/g, ' ')
            // 5. 整理连续多余空格
            .replace(/\s+/g, ' ')
            .trim();
    },

    // 任天堂“动森式”程序化拟声语 (Animalese Procedural Babble: 0KB 纯前端音阶生成)
    playAnimalese(text, petType = 'fish') {
        if (!PetSound.isEnabled() || !text) return;
        const ctx = PetSound.getCtx();
        if (!ctx) return;

        const cleanText = this.cleanTextForSpeech(text);
        if (!cleanText) return;

        const cfg = this.SPECIES_CONFIG[petType] || this.SPECIES_CONFIG.fish;
        const baseFreq = cfg.baseFreq;
        const waveType = cfg.waveType;

        const now = ctx.currentTime;
        const len = Math.min(10, Math.max(3, cleanText.length));
        const stepTime = 0.065;
        const scaleOffsets = [0, 2, 4, 7, 9, 12, 14, 16];

        for (let i = 0; i < len; i++) {
            const code = cleanText.charCodeAt(i % cleanText.length);
            const semitone = scaleOffsets[code % scaleOffsets.length];
            const freq = baseFreq * Math.pow(2, semitone / 12);

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = waveType;
            const t = now + i * stepTime;

            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.005, t + stepTime - 0.005);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + stepTime);
        }
    },

    // 学术题目/解析朗读纯净播音入口 (独立音轨：无搞怪开嗓声效，标准母语语速语调，专注审题)
    speakAcademic(text, options = {}, onEndCallback = null) {
        if (!text) {
            if (typeof onEndCallback === 'function') onEndCallback();
            return;
        }
        const cleanText = this.cleanTextForSpeech(text);
        if (!cleanText) {
            if (typeof onEndCallback === 'function') onEndCallback();
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            this.speaking = false;

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'zh-CN';
            utterance.pitch = (options.pitch !== undefined) ? options.pitch : 1.0;
            utterance.rate = (options.rate !== undefined) ? options.rate : 0.95;
            utterance.volume = (options.volume !== undefined) ? options.volume : 1.0;

            const bestVoice = this.getBestChineseVoice(null, 'academic', true);
            if (bestVoice) utterance.voice = bestVoice;

            this.currentUtterance = utterance;
            this.speaking = true;
            if (window.PetEngine && PetEngine.Vector) {
                PetEngine.Vector.setSpeaking(true);
            }

            const resetSpeaking = () => {
                this.speaking = false;
                this.currentUtterance = null;
                if (window.PetEngine && PetEngine.Vector) {
                    PetEngine.Vector.setSpeaking(false);
                }
                if (typeof onEndCallback === 'function') {
                    const cb = onEndCallback;
                    onEndCallback = null;
                    cb();
                }
            };

            utterance.onend = resetSpeaking;
            utterance.onerror = () => resetSpeaking();

            setTimeout(() => {
                if (this.currentUtterance === utterance) resetSpeaking();
            }, Math.max(6000, cleanText.length * 450));

            window.speechSynthesis.speak(utterance);
        } else {
            if (typeof onEndCallback === 'function') onEndCallback();
        }
    },

    // 核心统一萌宠发声入口 (物种专属搞怪声学 + 声学微抖动)
    speak(text, petType = 'fish', options = {}, onEndCallback = null) {
        if (!PetSound.isEnabled() || !text) {
            if (typeof onEndCallback === 'function') onEndCallback();
            return;
        }

        const cleanText = this.cleanTextForSpeech(text);
        if (!cleanText) {
            if (typeof onEndCallback === 'function') onEndCallback();
            return;
        }

        // 1. 播放专属生物开口搞怪水族开嗓音效 (支持 options.skipChime 跳过)
        if (!options.skipChime) {
            PetSound.voiceChime(petType);
        }

        const cfg = this.SPECIES_CONFIG[petType] || this.SPECIES_CONFIG.fish;

        // 2. 调校版萌童声发音 (注入微抖动，告别机械恒定感)
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            this.speaking = false;

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'zh-CN';

            // 声学微抖动 (Acoustic Jitter: pitch ±0.04, rate ±0.03)
            const jitterPitch = (Math.random() - 0.5) * 0.08;
            const jitterRate = (Math.random() - 0.5) * 0.06;
            const basePitch = (options.pitch !== undefined) ? options.pitch : cfg.pitch;
            const baseRate = (options.rate !== undefined) ? options.rate : cfg.rate;

            utterance.pitch = Math.max(0.4, Math.min(2.0, basePitch + jitterPitch));
            utterance.rate = Math.max(0.5, Math.min(1.8, baseRate + jitterRate));
            utterance.volume = (options.volume !== undefined) ? options.volume : 0.95;

            const bestVoice = this.getBestChineseVoice(cfg.preferredVoices, petType, false);
            if (bestVoice) {
                utterance.voice = bestVoice;
            }

            this.currentUtterance = utterance;
            this.speaking = true;

            const resetSpeaking = () => {
                this.speaking = false;
                this.currentUtterance = null;
                if (typeof onEndCallback === 'function') {
                    const cb = onEndCallback;
                    onEndCallback = null;
                    cb();
                }
            };

            utterance.onend = resetSpeaking;
            utterance.onerror = () => {
                resetSpeaking();
                // TTS 发声异常时平滑回退至动森拟声
                this.playAnimalese(cleanText, petType);
            };

            // 语音状态看门狗 (防止个别浏览器垃圾回收漏触发 onend 事件导致状态锁死)
            setTimeout(() => {
                if (this.currentUtterance === utterance) {
                    resetSpeaking();
                }
            }, Math.max(6000, cleanText.length * 450));

            // 留出 100ms 间隔使开口音先清晰入耳
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, options.skipChime ? 0 : 100);
        } else {
            this.playAnimalese(cleanText, petType);
            if (typeof onEndCallback === 'function') {
                setTimeout(onEndCallback, Math.min(3000, cleanText.length * 120));
            }
        }
    }
};

// 预热浏览器语音列表
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        PetVoice.getBestChineseVoice();
    };
}

// 全局统一定义 speakText，支持学术播音轨与萌宠双轨分流
window.speakText = function(text, petType, isAcademic = false) {
    // 若明确为学术模式或当前非儿童模式，使用标准母语播音轨
    if (isAcademic || !isChildMode) {
        PetVoice.speakAcademic(text);
        return;
    }
    if (!petType && typeof getPetData === 'function') {
        const pet = getPetData();
        petType = (pet && pet.type) || 'fish';
    }
    PetVoice.speak(text, petType || 'fish');
};

// --- 海鲜宠物设定库 (五阶觉醒变身体系) ---
const SEAFOOD_PETS = {
    fish: {
        id: 'fish',
        name: '小泡鱼',
        speciesName: '泡泡灵鱼族',
        avatar: '🐟',
        favoriteFood: '海藻小饼干',
        foodIcon: '🍪',
        forms: [
            { stage: 1, title: '萌宝泡泡鱼', avatar: '🐟', aura: 'aura-bubble', desc: '刚出生的小可爱，最爱吐圆滚滚的彩虹气泡。', quote: '咕噜咕噜~ 做题像吐泡泡一样简单！', unlockLevel: 1 },
            { stage: 2, title: '彩纹热带鱼', avatar: '🐠', aura: 'aura-shimmer', desc: '披上绚丽彩衣，游动速度如离弦之箭。', quote: '游呀游~ 我发现正确答案藏在水草里啦！', unlockLevel: 3 },
            { stage: 3, title: '刺刺河豚霸', avatar: '🐡', aura: 'aura-shield', desc: '遇到难题立刻鼓成威武刺球，谁也难不倒它！', quote: '气鼓鼓！所有难关都被我的水刺弹开！', unlockLevel: 5 },
            { stage: 4, title: '幻光锦鲤仙', avatar: '🎏', aura: 'aura-rainbow', desc: '祥瑞金光护体，带来百分之百的答题福运。', quote: '锦鲤附体，逢考必过！小主人好运连连！', unlockLevel: 7 },
            { stage: 5, title: '九霄海龙神', avatar: '🐉', aura: 'aura-dragon-gold', desc: '真龙觉醒！呼风唤雨，执掌深海万千智慧。', quote: '雷霆万钧！神龙现世，没有什么难题能阻挡我们！', unlockLevel: 10 }
        ],
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
        speciesName: '霸王神蟹族',
        avatar: '🦀',
        favoriteFood: '香脆海苔',
        foodIcon: '🍘',
        forms: [
            { stage: 1, title: '豆丁小青蟹', avatar: '🦀', aura: 'aura-bubble', desc: '挥舞小钳子横冲直撞的小可爱。', quote: '咔嚓咔嚓！我横着走也能答对！', unlockLevel: 1 },
            { stage: 2, title: '铁甲重钳蟹', avatar: '🦞', aura: 'aura-iron', desc: '坚硬如铁的重甲，两只巨鳌能剪碎一切错题。', quote: '硬核剪刀手出击，错题通通剪碎！', unlockLevel: 3 },
            { stage: 3, title: '黄金帝王蟹', avatar: '👑🦀', aura: 'aura-golden', desc: '头顶尊贵王冠，深海里最神气的小霸主。', quote: '戴上皇冠，小主人今天也是答题之王！', unlockLevel: 5 },
            { stage: 4, title: '机甲泰坦蟹', avatar: '🤖🦀', aura: 'aura-cyber', desc: '能量矩阵充盈全身，挥舞等离子光刃双钳！', quote: '机甲变身启动！锁定正确答案，全弹发射！', unlockLevel: 7 },
            { stage: 5, title: '星河裂空巨鳌', avatar: '🌌🦀', aura: 'aura-cosmic', desc: '巨鳌挥动能撕裂宇宙星云，深海古神级守护者。', quote: '星河在我螯间流转，小主人的智慧耀眼夺目！', unlockLevel: 10 }
        ],
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
        speciesName: '赤炎神虾族',
        avatar: '🦐',
        favoriteFood: '浮游布丁',
        foodIcon: '🍮',
        forms: [
            { stage: 1, title: '软萌晶晶虾', avatar: '🦐', aura: 'aura-bubble', desc: '晶莹剔透，蹦蹦跳跳的小跟班。', quote: '蹦一蹦，长一寸，做做题，得满分！', unlockLevel: 1 },
            { stage: 2, title: '黄金香脆虾', avatar: '🍤', aura: 'aura-crisp', desc: '金黄香脆，弹射起飞动力十足。', quote: '香香脆脆，答题全对！', unlockLevel: 3 },
            { stage: 3, title: '炽热烈焰虾', avatar: '🦐🔥', aura: 'aura-fire', desc: '浑身包裹着热情似火的烈焰推进器。', quote: '热情燃烧！答题手速比海浪还要快！', unlockLevel: 5 },
            { stage: 4, title: '超光速雷霆虾', avatar: '⚡🦐', aura: 'aura-thunder', desc: '化身金色闪电，在题海中瞬息穿梭。', quote: '雷光一闪，答案立刻浮现在脑海！', unlockLevel: 7 },
            { stage: 5, title: '不死朱雀灵虾', avatar: '🪽🦐', aura: 'aura-phoenix', desc: '浴火涅槃，长出华美神羽，永远生机勃勃。', quote: '涅槃觉醒！每一次思考都是一次华丽蜕变！', unlockLevel: 10 }
        ],
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
        speciesName: '星穹墨章族',
        avatar: '🐙',
        favoriteFood: '深海小丸子',
        foodIcon: '🍡',
        forms: [
            { stage: 1, title: '八爪小墨章', avatar: '🐙', aura: 'aura-bubble', desc: '喜欢吐出心形墨汁的小调皮。', quote: '一手写答案，七手为你热烈鼓掌！', unlockLevel: 1 },
            { stage: 2, title: '深海大乌贼', avatar: '🦑', aura: 'aura-wave', desc: '在深海中神秘穿梭的探险家。', quote: '深海探秘，每一道题都是未知的宝藏！', unlockLevel: 3 },
            { stage: 3, title: '魔术礼帽章', avatar: '🎩🐙', aura: 'aura-magic', desc: '戴上大礼帽，随时变出惊喜小道具。', quote: '叮！见证奇迹的时刻，这道题选对啦！', unlockLevel: 5 },
            { stage: 4, title: '星象千面学者', avatar: '🔮🐙', aura: 'aura-arcane', desc: '奥术水晶球环绕，掌握古老海洋的知识秘卷。', quote: '星象告诉我，小主人今天有满分之兆！', unlockLevel: 7 },
            { stage: 5, title: '深海深渊帝皇', avatar: '🔱🐙', aura: 'aura-abyss', desc: '手握海皇三叉戟，统御万千海洋生灵的智慧之神。', quote: '深渊共鸣！浩瀚智慧如汪洋大海，唯你独尊！', unlockLevel: 10 }
        ],
        quotes: [
            '我有八只触手，一手写答案，七手为你鼓掌！',
            '咕嘟咕嘟，深海丸子真美味！',
            '墨汁喷走所有烦恼，正确答案就在眼前！',
            '智慧如海，小主人今天也是满分选手！'
        ]
    }
};

// 兼容旧版 evolveAvatars 字段
Object.values(SEAFOOD_PETS).forEach(p => {
    if (!p.evolveAvatars) {
        p.evolveAvatars = p.forms.map(f => f.avatar);
    }
});

// --- 抽牌堆管理体系 (FISHER-YATES DRAW-DECK & LRU EXCLUSION ENGINE) ---
const DrawDeckManager = {
    decks: {},
    lastDrawn: {},
    recentLimit: 50,
    storageKey: 'bingo_banter_lru_history',

    // 获取最近使用记录 (LRU 队列)
    getRecentHistory() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    // 记录消费项到 LRU 队列 (限制最近 recentLimit 条)
    recordUsed(text) {
        if (!text || typeof text !== 'string') return;
        try {
            const history = this.getRecentHistory();
            const clean = text.trim();
            const idx = history.indexOf(clean);
            if (idx > -1) history.splice(idx, 1);
            history.unshift(clean);
            if (history.length > this.recentLimit) {
                history.length = this.recentLimit;
            }
            localStorage.setItem(this.storageKey, JSON.stringify(history));
        } catch (e) {}
    },

    // Fisher-Yates 真正随机洗牌算法
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // 从指定分类卡池无放回抽一张 (保证全卡池耗尽前绝对不重复)
    draw(categoryKey, rawItems, getKeyFn = (it => (it && (it.text || it.q || it)) || '')) {
        if (!rawItems || rawItems.length === 0) return null;
        if (rawItems.length === 1) {
            const item = rawItems[0];
            this.recordUsed(getKeyFn(item));
            return item;
        }

        // 牌堆为空时自动重洗：过滤最近消费过的项目（防相邻重叠与防接龙）
        if (!this.decks[categoryKey] || this.decks[categoryKey].length === 0) {
            const history = this.getRecentHistory();
            let candidates = rawItems.filter(it => !history.includes(getKeyFn(it)));
            if (candidates.length < Math.min(3, Math.ceil(rawItems.length * 0.4))) {
                candidates = [...rawItems];
            }
            let shuffled = this.shuffle(candidates);

            // 防接龙约束：新牌堆首张绝不等于旧牌堆最后一张
            if (this.lastDrawn[categoryKey] && shuffled.length > 2) {
                if (getKeyFn(shuffled[shuffled.length - 1]) === this.lastDrawn[categoryKey]) {
                    const swapIdx = Math.floor(Math.random() * (shuffled.length - 1));
                    [shuffled[shuffled.length - 1], shuffled[swapIdx]] = [shuffled[swapIdx], shuffled[shuffled.length - 1]];
                }
            }
            this.decks[categoryKey] = shuffled;
        }

        const drawn = this.decks[categoryKey].pop();
        const key = getKeyFn(drawn);
        this.lastDrawn[categoryKey] = key;
        this.recordUsed(key);
        return drawn;
    }
};

// --- 插槽式动态微拼接语法生成器 (SLOT-BASED COMBINATORIAL SYNTHESIZER: 组合爆炸式无限台词) ---
const SlotSyntaxSynthesizer = {
    // 投喂赞扬插槽
    feedPraises: {
        prefixes: [
            '哇！', '啊呜一大口！', '嘎嘣脆！', '太香啦！', '吧唧吧唧~', 
            '太好吃了！', '嗷呜~', '一口吞下！', '咕噜咕噜！', '超级美味！',
            '香喷喷！', '满分口感！', '咔嚓一声！', '能量充盈！', '真顶饱！',
            '美味大爆发！', '大嚼大嚼！', '神仙味道！'
        ],
        speciesCores: {
            fish: [
                '吐出了一个闪闪发光的超大经验泡泡！',
                '海藻小饼干让小鱼游动速度提升200%！',
                '鱼鳞瞬间镀上一层耀眼的金色微光！',
                '鱼尾巴欢快地甩出了一道七彩小水浪！',
                '感觉做题像在清澈珊瑚海里畅游一样爽快！',
                '吐出的爱心泡泡把整个屏幕都点亮啦！',
                '小肚子吃得圆滚滚，智慧小天线立起来啦！'
            ],
            crab: [
                '大铁钳咔嚓一声把香脆海苔剪成爱心形状！',
                '重甲能量矩阵已充能完毕，硬核满分！',
                '这口脆海苔下肚，横着走也是第一名！',
                '钳子充满力量，所有难题被我一夹两半！',
                '机灵蟹保镖大队长向长官敬礼报道！',
                '铁钳举得高高为你欢呼，太威武啦！',
                '沙滩防御盾牌全面升温，百毒不侵！'
            ],
            shrimp: [
                '赤炎能量注入，一记超级大弹射直冲浪尖！',
                '虾须雷达哔哔作响：前方发现连续满分信号！',
                '这口草莓布丁甜到心坎里，元气瞬间爆棚！',
                '跳跳虾为你原地来了一个无敌后空翻！',
                '轻盈如羽毛，弹射爆发力突破天际！',
                '后背弓起满满劲道，下一题秒速飞升！',
                '头顶的小触角欢脱摆动，开心得停不下来！'
            ],
            octopus: [
                '八只触手同时竖起大拇指为你点赞！',
                '三颗心脏一起扑通扑通狂欢心跳！',
                '深渊奥术魔力+10，学者智慧之光闪烁！',
                '墨汁在水里绘出了一幅超级可爱的笑脸！',
                '章鱼秘典翻开新一页，小主人学霸光环拉满！',
                '八只吸盘紧紧抓住好运，万无一失！',
                '变色魔法发动，全身泛起祥瑞琉璃紫光！'
            ]
        },
        suffixes: [
            '小主人冲鸭！', '今天也是无敌学霸拍档！', '下一道题我们一网打尽！',
            '太厉害啦！', '为你骄傲！', '向星辰大海进发！',
            '智慧能量继续飙升！', '答题节奏棒极了！', '胜利就在眼前！',
            '稳准狠，满分非你莫属！', '再接再厉，神级战绩！'
        ]
    },

    // 生成不重复插槽投喂赞扬词
    generateFeedPraise(petType = 'fish') {
        const p = this.feedPraises;
        const prefix = DrawDeckManager.draw('slot_feed_prefix', p.prefixes);
        const cores = p.speciesCores[petType] || p.speciesCores.fish;
        const core = DrawDeckManager.draw('slot_feed_core_' + petType, cores);
        const suffix = DrawDeckManager.draw('slot_feed_suffix', p.suffixes);
        return `+10 EXP！${prefix}${core} ${suffix}`;
    },

    // 错题治愈安抚插槽
    wrongComforts: {
        prefixes: [
            '深呼吸~', '没关系呀！', '别灰心！', '摸摸头~', '问题不大！',
            '放轻松！', '慢一点点~', '稳住气！', '胜败兵家常事~'
        ],
        cores: [
            '科学巨匠爱因斯坦做实验也经常做错呢！',
            '错题是藏着珍珠的贝壳，打开它就能收获新智慧！',
            '刚才只是稍微调整了一下水流方向，下一发一定正中靶心！',
            '迷宫里的弯路也是风景，这道题难不倒我们！',
            '哪怕是神枪手也有校准准星的时候，仔细看题再来一次！',
            '所有的伟大发现都是从一个小小的失误开始的！',
            '小海鲜横着走也会踢到小贝壳呢，调整脚步继续前行！'
        ],
        suffixes: [
            '我一直在旁边陪着你呢！', '擦亮眼睛，正确答案就在眼前！', '小海鲜为你加油打气！',
            '换个角度看，立刻豁然开朗！', '相信自己，你绝对做得到！', '仔细读题，胜利属于细心的小探险家！'
        ]
    },

    generateWrongComfort(petType = 'fish') {
        const w = this.wrongComforts;
        const prefix = DrawDeckManager.draw('slot_wrong_prefix', w.prefixes);
        const core = DrawDeckManager.draw('slot_wrong_core', w.cores);
        const suffix = DrawDeckManager.draw('slot_wrong_suffix', w.suffixes);
        return `${prefix} ${core} ${suffix}`;
    },

    // 连胜激励插槽
    streakPraises: {
        streak3: [
            '🔥 3连胜达成！渐入佳境，状态超级火热！',
            '🔥 3连胜！手感滚烫，答题就像行云流水！',
            '🔥 连续3题答对！小海鲜为你点亮幸运金光！',
            '🔥 3连胜破浪前行！小脑瓜飞速运转起来啦！'
        ],
        streak5: [
            '⚡ 5连胜！超能爆发，深海答题大师降临！',
            '⚡ 5连胜大狂欢！势如破竹，谁也挡不住我们！',
            '⚡ 连续5题正确！学霸光环全开，太耀眼啦！',
            '⚡ 5连胜神勇出击！难度题目通通拿下！'
        ],
        streakHigh: [
            '🌟 连胜狂热！无敌超神！海底世界为你起立鼓掌！',
            '👑 霸气连胜！小主人今天简直是深海答题之神！',
            '🚀 极速连破！势不可挡，直冲宇宙星河之巅！',
            '🎆 神级连胜纪录！这道题简直被你拿捏得死死的！'
        ]
    },

    generateStreakCheer(streak, petType = 'fish') {
        if (streak < 3) return null;
        if (streak < 5) {
            return DrawDeckManager.draw('streak_3', this.streakPraises.streak3);
        } else if (streak < 8) {
            return DrawDeckManager.draw('streak_5', this.streakPraises.streak5);
        } else {
            const raw = DrawDeckManager.draw('streak_high', this.streakPraises.streakHigh);
            return raw.replace('连胜', `${streak}连胜`);
        }
    }
};

// --- 萌宠专属宽泛趣味语料库 (KID-SAFE BROAD TOPIC & HUMOR BANK: 300+ ITEMS) ---
const PET_HUMOR_BANK = {
    species: {
        fish: [
            '小主人，金鱼的记忆真只有7秒吗？……咦，我刚才想说什么来着？🤔',
            '你问我为什么天天吐泡泡？因为我是在给你比心心呀！🫧',
            '听说多吃鱼会变聪明，但你可千万别打我的主意哟！🙈',
            '咕噜咕噜~ 只要你对我笑一下，我就表演一次水中超级大回环！🏊',
            '我是一条没有烦恼的鱼，每天的工作就是看着你开开心心的！✨',
            '小鱼如果戴近视眼镜，在水里起雾了该怎么办？在线等，挺急的！👓',
            '水里的水草都在跳海草舞，我也在为你悄悄摇摆助威呢！🌿',
            '小主人，今天的你比昨天更耀眼，就像一条闪闪发光的黄金锦鲤！🎏',
            '咕嘟咕嘟，今天晚上我们要不要去吃香喷喷的小饼干庆祝一下？🍪',
            '如果知识是汪洋大海，那小主人你就是掌控风暴的超级大船长！⚓',
            '别看我眼睛圆圆的，我可是在用超声波雷达给你扫描快乐信号！📡',
            '吐个大泡泡装走你的小疲惫，换个小泡泡装满无限好心情！🫧',
            '小鱼也是有大志气的！今天我要陪小主人一起勇闯大世界！🏰',
            '趴在我身上休息一下下吧，我可是一条会水上漂的神奇小飞鱼！🛋️',
            '今天的水温刚刚好，小主人的笑容也是刚刚好，太完美啦！👌',
            '噗噗噗！水花四溅，本鱼为你亮起今日幸运大光环！💡',
            '小鱼甩甩尾，烦恼全倒退！小鱼摇摇头，快乐不用愁！💫',
            '嘘！别说话，用心听，海浪正在为你演奏好听的交响曲呢！🎵',
            '遇到不开心的事情？深呼吸，换口气，就像小鱼翻个跟头一样轻松！🌊',
            '本鱼今天胃口大开，想吞下一肚子的小星星和快乐因子！⭐',
            '海面上阳光灿烂，小主人的笑容也正在海底闪闪发亮！☀️',
            '游得慢不要紧，只要方向对，小鱼也能游进浩瀚星辰大海！🌌',
            '小泡鱼最喜欢你了！比喜欢世界上所有的小虾米还要多一百倍！💖',
            '你知道深海最深处有什么吗？除了大乌贼，还有一颗守护你的心！💙',
            '今天是一颗超级甜的泡泡糖味的晴天，你闻到了吗？🍬',
            '小鱼的尾巴轻轻摆一摆，把坏心情统统扫到九霄云外！🧹',
            '只要有梦想，哪怕是一条小咸鱼，也能逆流而上变成大锦鲤！🎏',
            '咕噜咕噜，我刚才和海龟老爷爷聊了天，他说小主人今天运气爆棚！🐢',
            '海洋世界大得很，等放假了，我带你去珊瑚群岛看七彩水母！🪸',
            '悄悄告诉你：其实鱼也是会打哈欠的，嗷呜~好舒服呀！🥱',
            '吐一个小泡泡代表一声谢谢，吐一万个泡泡代表最最喜欢你！🫧',
            '水底的小贝壳在悄悄咬耳朵，说今天的小主人简直是智慧化身！🐚',
            '彩虹如果掉进水里，一定会变成一条像我一样绚烂的七彩灵鱼！🌈',
            '遇到难题先深吸一口水草清香，小泡鱼为你保驾护航！🛡️',
            '做题累了就眨眨眼睛，看我给你表演一段水下圆舞曲！💃'
        ],
        crab: [
            '知道我为什么横着走吗？因为我有钳，任性呀！🦀',
            '来！我们玩剪刀石头布！我永远出剪刀，但我可从来没输过！✌️',
            '咔嚓咔嚓！大钳子一挥，把所有的烦恼都剪得碎碎的！✂️',
            '小主人，你看我两只眼睛长在头顶，就是为了随时帮你盯住好玩的！👀',
            '别看我长得硬邦邦，其实我的内心像豆腐一样软糯软萌呢！🦀',
            '今天天气真好，适合在沙滩上打滚，更适合享受美好时光！🏖️',
            '你问我的钳子为什么这么威风？因为这是世界上最酷的开罐器呀！🦾',
            '沙滩漫步虽然惬意，但看到你笑起来更让我手舞足蹈！🎉',
            '咔嚓！我刚才顺爪夹走了一颗小石头，小主人请阔步向前！🪨',
            '重甲护体，百毒不侵！机灵蟹永远是你最坚固的大盾牌！🤺',
            '沙滩上的小脚印一排排，都是我们一起走过的快乐时光！👣',
            '听说横着走容易迷路？不可能！我的大钳子就是天然指南针！🧭',
            '来，碰个大铁钳！不对，是碰个大拳头！今天元气满满！🤜',
            '小主人，你认真的样子，比金黄色的落日阳光还要耀眼迷人！👑',
            '报告长官！机灵蟹防线固若金汤，坏心情休想踏进半步！🏰',
            '咔嚓咔嚓，海苔脆脆，笑口常开！今天也要开开心心！🍘',
            '别看我个头不大，沙滩里埋着的大贝壳宝藏，我一挖一个准！💎',
            '沙子虽然细小，聚在一起就是金色海滩；慢慢积累就会成为超人！🏖️',
            '谁敢说横着走不讲道理？我横着走是为了全方位欣赏风景呀！🎫',
            '螃蟹一吐沫，烦恼都吓跑！螃蟹一扬爪，快乐到手了！🦀',
            '机灵蟹最骄傲的事情，就是成为小主人最硬核的保镖大队长！🛡️',
            '小主人，刚才有一只海鸥想叼走我的海苔，被我大螯给吓跑啦！🦅',
            '横看成岭侧成峰，换个角度看生活，到处都是意想不到的小惊喜！🏔️',
            '举起双螯给你点两个大大的赞！双倍点赞，双倍好运！👍👍',
            '小碎步嗒嗒嗒，快乐伴学笑哈哈！生活一点也不苦，有我陪你走天涯！🎶',
            '钳子开合，能量满格！小主人，今天也要精神抖擞呀！⚡',
            '不管是横着走还是大步走，只要迈开步子，一定能走向星辰大海！🏆',
            '听说煮熟的螃蟹会变红，那我害羞的时候会不会也变成大红蟹呀？😳',
            '我发现了一颗超漂亮的贝壳，偷偷放在你的小书包里啦！🐚',
            '大铁钳不仅能剪碎困难，还能用来给你剥开甜甜的橘子哦！🍊',
            '两只大螯随时就绪，只要小主人一声令下，错题通通剪成碎纸片！✂️',
            '沙滩上的寄居蟹想跟我换房子，本蟹的黄金甲才舍不得换呢！🏠',
            '硬壳底下藏着一颗暖暖的心，机灵蟹随时听候小主人差遣！🫡',
            '横着走也能冲线拿冠军，有实力就是这么自信！🏅',
            '咔嚓咔嚓，磨刀霍霍，今天的答题任务我们分分钟拿下！💪'
        ],
        shrimp: [
            '为什么我跳得比珠穆朗玛峰还高？因为珠穆朗玛峰根本不会跳呀！🦐',
            '油锅太热啦，一跳进去我就害羞得脸红了，所以变成了香香脆脆虾！🍤',
            '蹦蹦跳跳！只要多运动多笑笑，很快我就能长成超级大龙虾啦！🦞',
            '谁说小虾米成不了大气候？看我给你弹射起飞，直冲云霄！🚀',
            '遇到不顺心？像我一样倒退弹射两下，换个心情立刻海阔天空！💡',
            '报告小主人！我的虾须天线刚才接收到电波：今天有超棒的惊喜！📡',
            '晶晶亮，透心凉！小虾米今天也是你的头号元气啦啦队长！📣',
            '深呼吸，弹一下！所有的烦闷都被我弹到九霄云外去啦！💨',
            '虽然我个头小，但我的志气比整座深海大洋还要浩瀚呢！🌊',
            '小主人，等放学了，请我吃一口甜甜的草莓布丁好不好呀？🍮',
            '蹦跳是我的本能，而逗小主人开心是我的最高使命！⭐',
            '你见过会后空翻的虾米吗？只要你喊一二三，我就翻给你看！🤸',
            '小虾米弹跳一下，空气里快乐的火花就噼啪闪烁一下！✨',
            '退后一步不是认输，而是为了下一次更强劲的蓄力大弹射！🏹',
            '深海里虽然黑乎乎，但小主人明亮的眼睛比夜光水母还要璀璨！🌟',
            '扑哧！我刚才跳得太高，差点顶翻了一只在打瞌睡的小海龟！🐢',
            '别看我总是弯着腰，我弓背是为了爆发最惊人的弹射速度！🏃',
            '小虾米有一颗大大的心脏，每天都在为你扑通扑通疯狂打 Call！💓',
            '长长虾须探一探，前方道路平坦开阔，一路大顺风！🕵️',
            '每天蹦一蹦，长高五公分！每天笑一笑，烦恼都忘掉！📏',
            '香香甜甜的布丁吃完了，接下来轮到享受美好的生活啦！🍮',
            '虾小志气大，敢上九天揽月，敢下五洋摸鱼！🚀',
            '小主人别发呆啦，眨一眨眼，像我一样蹦跶两下立刻神清气爽！👀',
            '弹射起飞，冲上浪尖！属于我们的大冒险现在就出发！🌊',
            '跳跳虾为你欢呼雀跃，全世界最好的小主人非你莫属！👑',
            '小虾米最不怕挑战，风浪越大，我们的鱼虾跳跃就越欢腾！⛵',
            '深海里有珊瑚花园，做完事情我带你去看彩虹热带鱼！🪼',
            '轻盈如羽毛，爆发如弓弦！这就是赤炎神虾族的真正魅力！🔥',
            '小虾米做梦都在练习水上芭蕾，今天我给你表演一段旋转跳跃！💃',
            '你知道吗？有些荧光小虾在夜里会发出幽蓝色的光，像海底小星星！✨',
            '谁能比我更会原地起跳？一眨眼我就蹦上了云彩端！☁️',
            '虾须抖一抖，精神抖擞！小尾巴弹一弹，难题全靠边站！🦐',
            '我的外号叫深海闪电侠，随时准备陪小主人打破答题纪录！⚡',
            '吃饱草莓布丁，浑身都是草莓味的元气能量！🍓',
            '今天也是活力四射的一天，像小虾米一样勇往直前吧！💫'
        ],
        octopus: [
            '我有八只触手，一只拿冰淇淋，一只拿果汁，还能留六只手给你比心心！💖',
            '我从来不怕出丑，因为只要一喷墨，谁也看不见我尴尬的表情！🖤',
            '你问我打架为什么从来不输？因为我有八只手同时出石头剪刀布！✊',
            '八爪鱼的烦恼：每天早上八只鞋带系完，别人都已经吃完早饭啦！👟',
            '咕嘟咕嘟~ 墨汁喷出来是黑的，但我对小主人的心可是七彩斑斓的！🌈',
            '谁能有我忙呀？一只手撑伞，一只手拿水壶，还能留六只手为你鼓掌！👏',
            '悄悄告诉你一个秘密：章鱼有三颗心脏，三颗都在为你扑通扑通加油跳！💓',
            '深海迷航？不怕！本学者用水晶球算过了，小主人今日运势大吉！🔮',
            '吸盘吸得牢，好运跑不了！跟着皮皮章，生活永远不慌张！🧲',
            '小主人快看，我的触手可以同时摆成八个小爱心形状哟！🫶',
            '喷一团墨汁变成隐身衣，把所有的坏情绪统统藏起来！🥷',
            '世界上最柔软的生物，拥有深海里最聪慧的大脑，皮皮章向你敬礼！🫡',
            '八只爪爪齐开动，所有家务活一下子就全搞定啦！🚀',
            '你猜我戴这顶魔术礼帽干嘛？为了随时变出一朵大红花奖给你！🎩',
            '变色是我的看家本领，只要开心起来，我就全身变金黄为你闪光！🌟',
            '章鱼学者翻阅万卷深海秘典，发现小主人注定会成为最闪耀的星星！📜',
            '触手轻轻揉一揉，肩膀后背不酸痛！我是你的全天候小按摩师！💆',
            '小主人，深海章鱼小丸子分你一半，吃饱了浑身都有劲！🍡',
            '海水蓝蓝，墨汁黑黑，小主人的笑容光芒万丈！☀️',
            '深渊海皇三叉戟一指：所有的不开心，统统退散！🔱',
            '八手联弹，为你演奏一首最欢快欢腾的深海狂想曲！🎹',
            '没有骨头也能站得笔直，这就是深海神章的强大意志力！💪',
            '墨汁喷出来不是为了逃跑，而是为了在水幕上给你画个可爱的笑脸！😊',
            '咕噜咕噜，皮皮章为你吐出一串串七彩奥术梦幻之泡！🫧',
            '小主人，你的笑容真好看，连我这么爱动的章鱼都被你治愈啦！🤩',
            '八只手同时击掌：啪啪啪啪！太棒了，小主人今天简直无敌！🙌',
            '深海的夜空也有星星，就是小主人眼里闪烁的那一抹好奇之光！🌌',
            '皮皮章永远是你最忠诚的小军师，今天想去哪里冒险，我都陪着你！🧠',
            '如果我把八只手织成一张网，就能捞起一整片银河系的星星！🌌',
            '章鱼睡觉的时候也会变颜色做梦哦，我刚才梦见吃了一座布丁山！🍮',
            '学者礼帽扶一扶，智慧火花在深邃大眼里闪闪烁烁！🎓',
            '八只触手同时翻书，十行俱下一目了然，学霸本霸就是我！📖',
            '深海神殿里藏着的每一滴智慧，都将化作小主人通关的法宝！🗝️',
            '三颗心脏都在说：小主人，你是世界上最聪明最棒的搭档！❤️',
            '别看我走起路来像跳踢踏舞，深海八阵图我都胸有成竹！🗺️'
        ]
    },
    riddles: [
        { q: '冬瓜、黄瓜、西瓜、南瓜都能吃，什么瓜不能吃？🤔', a: '哈哈！答案是：傻瓜！🍉' },
        { q: '什么东西越洗越脏，不洗看着反而挺干净？🧼', a: '答案揭晓：是一盆洗脚水！' },
        { q: '什么样的猫从来不抓老鼠，老鼠看见它也不害怕？🐱', a: '答案是：招财猫和机器猫多啦A梦！' },
        { q: '什么东西越擦越湿？🛁', a: '答案是：洗完澡用的干毛巾！' },
        { q: '盆里有6个馒头，6个小朋友分，最后盆里还剩1个，为什么？🥖', a: '因为最后一个小朋友把盆子和馒头一起端走啦！😆' },
        { q: '小明的猫掉进了大水井里，小明是怎么把它救上来的？🐱', a: '答案是：湿漉漉地救上来的！喵呜~' },
        { q: '什么样的西瓜绝对不能买，也不能吃？🍉', a: '答案是：吹牛的王婆卖的西瓜！哈哈！' },
        { q: '什么样的路走不了人，也开不了汽车？🛣️', a: '答案是：套路和死路！嘻嘻~' },
        { q: '小鱼为什么天天泡在水里，从来不肯爬上岸？🐟', a: '因为岸上的太阳太晒，小鱼怕晒成鱼干呀！' },
        { q: '什么东西你明明看得见、摸得着，却永远也抓不住？🌈', a: '答案是：自己的影子！' },
        { q: '什么车需要你一边推一边走？🛒', a: '答案是：超市购物车和婴儿车！' },
        { q: '大象的左耳朵长得最像什么？🐘', a: '像大象的右耳朵呀！真好骗~嘻嘻！' },
        { q: '为什么两只树懒挂在树上，其中一只突然掉下去了？🦥', a: '因为那只树懒做了一个掉下树的噩梦！' },
        { q: '什么门永远也关不上，关上了大家反而要着急？⚽', a: '答案是：足球门！进了球大家才欢呼呢！' },
        { q: '为什么公鸡打鸣的时候总是要把脖子伸得长长的？🐓', a: '因为公鸡没有手，够不着话筒呀！🎤' },
        { q: '小明每次洗澡都要戴一副太阳墨镜，为什么？🕶️', a: '因为他用的泡泡沐浴露实在太耀眼啦！✨' },
        { q: '什么时候人会只有一只眼睛？👁️', a: '答案是：眨眼睛的时候！眨一下，就剩一只啦！' },
        { q: '什么书在书店里绝对买不到，有钱也买不来？📖', a: '答案是：秘书和遗书！哈哈~' },
        { q: '两只狗在赛跑，甲狗跑得快，乙狗跑得慢，哪只狗出汗多？🐕', a: '答案是：都不出汗！因为狗是用舌头散热的！' },
        { q: '为什么小偷从不偷警犬身上的东西？🐕‍🦺', a: '因为小偷也怕被警犬一口咬住裤子呀！' },
        { q: '什么样的桥下面从来没有一滴水流过？🌉', a: '答案是：城市立交桥和过街天桥！' },
        { q: '天上的星星为什么不会掉下来砸到小朋友？⭐', a: '因为星星都挂在天上，有月亮姐姐看着呢！' },
        { q: '什么东西每一秒都在上升，永远不会下降？🎈', a: '答案揭晓：是小主人的年龄和个头身高！' },
        { q: '小白兔吃胡萝卜，一口咬下去为什么发出咯嘣脆的声音？🥕', a: '因为胡萝卜在抗议：‘轻点咬，我怕痒！’' },
        { q: '谁的肚子最大，能装下一整个学校的书本和笔盒？🎒', a: '答案是：小主人的大书包！' },
        { q: '一只乌龟从十楼摔下来为什么没摔伤？🐢', a: '因为它摔在了一只大充气城堡上！' },
        { q: '哪个季节的树叶最喜欢跳舞？🍂', a: '答案是：秋天！因为秋风一来它们就跳起圆舞曲啦！' },
        { q: '为什么太阳每天早上都要从东方升起？☀️', a: '因为太阳从西边升起的话，大家就以为在做梦啦！' },
        { q: '什么样的水喝了不仅不解渴，还会让人哇哇大哭？🧅', a: '答案是：切洋葱流出来的眼水！' },
        { q: '什么伞无论下多大雨都遮不住水？🪂', a: '答案是：跳伞用的降落伞！' },
        { q: '有一头小牛朝南走3步，又朝西走3步，它的尾巴朝向哪边？🐄', a: '答案是：朝向地面呀！' },
        { q: '什么东西在倒立之后，会比原来多出整整一半？🤸', a: '答案是：数字6！倒过来就变成9啦！' },
        { q: '哪种树的叶子永远也不会在秋天变黄落下来？🌲', a: '答案是：塑料做的人造圣诞树！' },
        { q: '什么样的雨下得再大，人们出门也从来不打雨伞？🌧️', a: '答案是：夜空里的流星雨和春风细雨！' },
        { q: '小明有一只神奇的口袋，怎么装都装不满，为什么？👝', a: '因为口袋底部破了一个大窟窿！嘻嘻！' }
    ],
    cosmos_nature: [
        '你知道吗？在火星上看夕阳西下，太阳周围是一片梦幻的淡蓝色哟！🌅',
        '水獭在水里睡觉的时候会紧紧牵着小手，防止被海浪冲散，太有爱啦！🦦',
        '树懒一个星期才慢吞吞下一次树去上厕所，因为爬下树实在是太累啦！🦥',
        '企鹅向心仪的小企鹅求婚时，会叼来一颗海滩上最圆最漂亮的鹅卵石当彩礼！🐧',
        '蓝鲸的舌头比一头大象还要重！但是它一句话也不会说，只能由我来替它聊天啦！🐋',
        '如果把土星放进一个巨大的浴缸里，土星会像乒乓球一样漂在水面上呢！🪐',
        '变色龙变颜色不是为了伪装自己，而是根据心情和温度表达喜怒哀乐！🦎',
        '海马爸爸才是负责在育儿袋里生宝宝的超级奶爸！大自然是不是特别奇妙？🐴',
        '你知道吗？皮皮虾的弹射力量相当于一颗高速子弹，甚至能在水中瞬间产生火花！🦐',
        '比目鱼小时候两只眼睛长在两边，长大后眼睛会慢慢游到同一边，是不是特别搞笑？🐟',
        '海豚睡觉的时候是一半大脑睡、一半大脑醒着的，防止忘记呼吸！🐬',
        '有些深海发光鱼会自带小灯笼照路！我们也是在世界上互相照亮彼此的小伙伴！🏮',
        '珊瑚看起来像花朵石头，其实它是成千上万个可爱珊瑚虫宝宝建造的大城堡！🪸',
        '抹香鲸潜水能潜两千多米深，能在漆黑冰冷的深海里一口气憋两个小时！🤿',
        '海胆浑身都是硬刺，其实刺中间藏着一张嘴，每天都在沙滩上悄悄啃海藻呢！🌑',
        '鲨鱼一生可以换好几千颗新牙齿！要是人类换牙也这么快，就再也不怕蛀牙啦！🦈',
        '飞鱼遇到危险可以在水面上滑翔几百米！展开双翅，就像小飞机一样神奇！✈️',
        '章鱼有三颗心脏，血液是蓝色的！深海贵族的秘密是不是超乎你的想象？💙',
        '企鹅虽然穿着黑色燕尾服像个小绅士，其实在水下游起泳来比快艇还要敏捷！🐧',
        '世界上最小的鸟是蜂鸟，它的心跳一分钟能达到一千多次，扇翅膀快得看不清！🐦',
        '大熊猫每天花12个小时吃竹子，剩下的时间都在睡大觉，真是最幸福的滚滚！🐼',
        '长颈鹿的脖子虽然那么长，但它的颈椎骨头数量和我们人类一模一样，都是7块！🦒',
        '闪电的温度比太阳表面还要高出五倍！大自然的力量真是不可思议！⚡',
        '木星是太阳系里最大的行星，它的肚子里能装下一千三百多个地球！🌍',
        '在太空中没有声音传播，因为太空中是真空的，安安静静像童话里的梦境！🌌',
        '月亮其实不是完全圆的，它稍微有一点点像鸡蛋的形状呢！🥚',
        '金星的一天比金星的一年还要长！因为它自己自转一圈实在太慢啦。🚶‍♂️',
        '如果乘火箭以光速飞行，绕地球一圈只需要眨眼间的0.13秒！🚀',
        '土星的光环虽然看起来像一块坚硬的玉盘，其实全是由晶莹剔透的冰块组成的！🧊',
        '太空中有一片巨大的气体云，闻起来的味道居然像甜甜的草莓和覆盆子！🍓',
        '海豚在睡觉的时候会把一只眼睛闭上，另一只眼睛睁着放哨防鲨鱼！🐬',
        '蜗牛如果觉得天气太热或者太冷，可以一口气躲在壳里大睡三年呢！🐌',
        '小牛在牧场里也是有自己的好朋友的，如果分开了它会难过得哞哞叫！🐄',
        '北极熊的毛看起来是白色的，其实每一根都是中空的透明光纤管管！🐻‍❄️',
        '蝴蝶是用它细长的小脚丫来品尝花蜜的味道的，是不是很不可思议？🦋'
    ],
    food_fun: [
        '薯片袋里装的才不是空气呢，那是保护香脆薯片不被压碎的‘安全气囊’！🥔',
        '冰淇淋刚拿出来为什么会冒白烟？那不是热气，是空气里的小水滴被冻出小云雾啦！🍦',
        '我的肚子刚才咕噜噜响了一声，它在用摩斯密码告诉我：该吃小零食啦！🍪',
        '为什么西瓜要在夏天吃？因为冬天吃的话……会冻得浑身直打哆嗦！🍉',
        '如果把被子叠成豆腐块，那睡在里面算不算做一盘香喷喷的麻婆豆腐？🍲',
        '爆米花是玉米粒心里憋着的一团热情，温度一高就忍不住开心地‘啪’炸开啦！🍿',
        '巧克力最早在古代居然是一种苦苦辣辣的饮料，幸好后来加了甜甜的牛奶！🍫',
        '世界上最幸福的时刻，就是咬下第一口脆皮炸鸡翅时，发出咔嚓的那一声！🍗',
        '为什么甜甜圈中间总有一个洞？因为有这个洞，油炸的时候才熟得最均匀呀！🍩',
        '草莓表面的小芝麻粒，其实才是草莓真正的果实！我们吃的是膨大的花托呢！🍓',
        '热腾腾的烤红薯，是冬天大马路上最让人走不动路的甜蜜诱惑！🍠',
        '小泡鱼今天的愿望清单第一名：吃一碗盛满彩虹软糖的小海藻碗！🥣',
        '芝士拉丝拉得越长，说明你今天的好心情也跟着拉得越长越开心！🧀',
        '听说吃了薄荷糖之后喝冰水，舌头会以为自己瞬移到了南极洲！❄️',
        '饺子为什么长得像元宝？因为包饺子的人希望吃的人天天开心发大财呀！🥟',
        '棉花糖其实就是白糖在机器里被抽成一根根极细的糖丝，卷成的一朵甜云彩！☁️',
        '披萨本来是一张平平无奇的面饼，铺满香浓芝士和香肠后立刻变成了超级巨星！🍕',
        '吃饱喝足，伸个懒腰，生活里的所有小确幸都藏在一顿美味的饭菜里！😋',
        '如果世界上有一座巧克力喷泉，我一定要跳进去游个痛快！🍫',
        '西红柿到底是水果还是蔬菜？它说：管它呢，反正炒鸡蛋和凉拌我都超好吃！🍅',
        '煮面条的时候如果加个荷包蛋，整碗面的身价和美味度瞬间翻倍！🍜',
        '苹果咬开一会儿为什么会变黄？因为它太害羞，见到空气就悄悄氧化变脸啦！🍎',
        '香蕉弯弯的像小船，剥开皮就是一段甜甜的味觉奇妙漂流记！🍌',
        '蜂蜜是永远不会变坏的食物！三千年前金字塔里的蜂蜜现在还能吃呢！🍯',
        '小主人，今天想好吃什么好吃的了吗？光是想想口水都要流出来啦！🤤',
        '成熟的蔓越莓如果从桌上掉下去，会像高弹性小皮球一样砰砰往上蹦！🏀',
        '菠萝其实长在地里的灌木丛中央，而且一株菠萝树两三年才结出一个菠萝宝宝！🍍',
        '胡萝卜最早在世界上根本不是橙色的，而是高贵神秘的紫色和黄色！🥕',
        '为什么吃完辣椒喝冰水不管用？因为辣椒素是脂溶性的，喝一口纯牛奶才解辣哦！🥛',
        '甜筒冰淇淋底部的巧克力脆尖，是世界上最美妙的压轴惊喜！🍦',
        '烤面包片如果涂上一层厚厚的草莓果酱，连早晨的空气都变成粉红色的！🍞',
        '小海苔片虽然薄得像纸，但是入口即化的鲜脆滋味谁也挡不住！🍘',
        '煮玉米时飘出来的甜香，是夏天田野里最纯真的大自然味道！🌽',
        '大西瓜切开的第一勺最甜的芯，一定要留给最喜欢的小伙伴吃！🍉',
        '如果把七彩水果糖泡进汽水里，就会咕嘟咕嘟冒出幸福的彩虹泡泡！🥤'
    ],
    imagination: [
        '如果天上的白云是棉花糖，那阴天下雨会不会稀里哗啦下一地草莓雪糕？🍨',
        '要是橡皮擦有生命，它每次被擦掉一点点，会不会觉得自己正在慢慢减肥？✏️',
        '为什么镜子里的我总是那么英俊潇洒，手机自拍镜头却不懂我的美？😎',
        '如果猫咪能听懂人话，它不理你纯粹是因为……它觉得你太幼稚啦！🐱',
        '如果大森林里的树木能走动，每天晚上它们是不是要聚在一起开狂欢跳舞派对？🌲',
        '要是人的鞋子装上弹簧，我们是不是能一路蹦跶着跳到月亮上去？🌕',
        '我怀疑家里的遥控器长了腿，每次想看动画片的时候它就躲起来捉迷藏！📺',
        '如果夜晚的被窝是一个秘密太空舱，枕头就是最舒服的指挥官座椅！🚀',
        '要是风有颜色，春天的风一定是粉色的，夏天的风一定是冰蓝色的！🎨',
        '为什么闹钟总是响得那么讨厌？因为它是个没有童年的小可怜虫呀！⏰',
        '如果能听懂大树说话，它肯定在跟小鸟八卦今天谁在树下吃冰棍！🌳',
        '如果时间可以倒流五分钟，我一定要把刚才咬掉的那一口冰淇淋再吃一遍！🍦',
        '影子之所以每天跟着你，是因为它觉得你是世界上最有趣的小伙伴！👥',
        '下雨天的小水坑，其实是通往地下镜子王国的神秘传送门！🪞',
        '如果所有的落叶都是大自然寄来的明信片，秋天就是它最忙碌的邮递季！🍂',
        '有时候我想变成一只气球，飘在半空中看看小鸟每天在忙些什么！🎈',
        '彩虹一定是天空给大地的七彩发夹，只有下完大雨它才舍得戴出来！🌈',
        '如果星星是一盏盏小夜灯，那一定是宇宙怕我们走夜路摔跤悄悄点亮的！🌟',
        '要是字典是一座房子，里面住着成千上万个生字小精灵在叽叽喳喳开会呢！📚',
        '为什么周末的时间过得像猎豹在飞奔，周一的时间过得像蜗牛在散步？🐌',
        '我猜月亮圆圆的时候在吃月饼，月亮弯弯的时候是因为被贪吃的小狗咬了一口！🌙',
        '如果能发明一种不会融化的冰淇淋，我们就能把它装进口袋带去任何地方！🍦',
        '今天的天空蓝得像被清水洗过一样，真想拿一根大吸管吸一口云朵奶盖！🥤',
        '小狗摇尾巴是在给你发送无声的电报：‘我超喜欢你，快来摸摸我！’🐕',
        '不管世界多大多吵闹，只要和小主人在一起，这里就是最温暖的童话世界！🎠',
        '要是书本里的生字半夜会自己走出来开联欢会，那字典就是最热闹的大礼堂！📖',
        '要是把阳光装进玻璃罐子里密封起来，冬天停电的时候拿出来会不会照亮整个房间？💡',
        '我猜海浪每天不知疲倦地拍打沙滩，是在跟岸上的鹅卵石玩‘拍手手’游戏呢！🌊',
        '如果能有一双像小鸟一样的羽毛翅膀，飞到积雨云上打个滚一定会沾满彩虹光环！🕊️',
        '时钟的指针每天不停地转圈圈，它是不是也在追逐那个永远追不上的‘明天’呀？⌛',
        '要是铅笔屑能变成彩色的花瓣，写完作业就能收获一整座秘密小花园！🌸',
        '雨滴滴答答敲打窗户，是在用音符给小主人弹奏催眠摇篮曲呢！🌧️',
        '小背包像个神奇的四次元百宝箱，把知识和梦想通通装了进去！🎒',
        '天上的大雁排成‘人’字飞过，是在给地上认真学习的小朋友比大拇指呢！🦅',
        '如果所有的梦境都是一场奇幻电影，今晚我们一定会梦见星辰与大海！✨'
    ],
    wake_greetings: [
        '呼啊~ 揉揉眼睛，你来找我玩啦！👀',
        '伸个大懒腰，小主人你在看我吗？☀️',
        '被你轻轻碰醒啦，今天也超开心！✨',
        '打了个小盹，瞬间精神百倍，元气拉满！🚀',
        '唔~ 刚才做了一个吃满汉全席的美梦，醒来正好见到最棒的你！🍪',
        '小海鲜准时开机！电量100%，随时准备答题大作战！🔋',
        '水泡破灭的声音唤醒了我，小主人今天也是闪闪发光呢！🫧',
        '翻个小身子，抖抖精神，我们今天继续携手闯关！💪',
        '嘿嘿，我其实一直在半睁着眼偷偷看你认真做题呢！👀',
        '小憩片刻，大脑飞速升级，随时恭候长官指令！🫡',
        '海底世界阳光正好，小主人一来水温都变得暖融融的！🌊',
        '伸出小手碰碰你，愿今天的好运像浪花一样翻滚而来！🎉',
        '呼噜呼噜~ 刚才梦到小主人拿了满分大奖，果然醒来你就来啦！🏆',
        '小眼睛亮晶晶，伴学搭档向你报到！今天目标：错题全消灭！🎯',
        '一觉醒来浑身有劲，让我们开启今天的高能答题旅程！⚡',
        '轻轻触碰，快乐加倍！有你陪伴的每一分钟都超幸福！💖'
    ],
    feedback_titles: [
        '太棒了！', 'Bingo！', '真聪明！', '答对了！', '小海鲜为你鼓掌！',
        '火眼金睛！', '太神啦！', '稳稳拿下一题！', '智力大爆发！', '为你比心！',
        '答题小能手！', '太秀了！', '势如破竹！', '满分表现！', '一语中的！', '智慧光芒闪耀！'
    ]
};

// --- 拟真语言与智慧去重引擎 (PET LANGUAGE & DRAW-DECK ENGINE) ---
const PetLanguageEngine = {
    riddleTimer: null,
    riddleSafetyTimer: null,
    riddleActive: false,
    lastBanterTime: 0,
    lastTimeGreetingTime: 0,
    lastWrongComfortTime: 0,
    dynamicCache: [],
    wheelIndex: 0,
    // 类别轮转防扎堆轮盘 (保证同类话题绝不连续出现)
    categoryWheel: ['species', 'riddle', 'cosmos_nature', 'food_fun', 'species', 'imagination', 'dynamic'],

    init() {
        this.loadDynamicCache();
        this.syncCloudBanterFeed();
    },

    loadDynamicCache() {
        try {
            const raw = localStorage.getItem('bingo_dynamic_banter_cache');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.dynamicCache = parsed;
                }
            }
        } catch (e) {
            this.dynamicCache = [];
        }
    },

    async syncCloudBanterFeed(force = false) {
        try {
            const lastSync = parseInt(localStorage.getItem('bingo_banter_last_sync') || '0', 10);
            const now = Date.now();
            if (!force && now - lastSync < 86400000 && this.dynamicCache.length > 0) {
                return;
            }

            const res = await fetch('./data/dynamic_banter.json?t=' + now);
            if (!res.ok) return;
            const data = await res.json();
            if (data && Array.isArray(data.items)) {
                let addedCount = 0;
                const existingTexts = new Set([
                    ...this.dynamicCache.map(i => i.text || i.q),
                    ...PET_HUMOR_BANK.riddles.map(r => r.q),
                    ...PET_HUMOR_BANK.cosmos_nature,
                    ...PET_HUMOR_BANK.food_fun,
                    ...PET_HUMOR_BANK.imagination
                ]);

                data.items.forEach(item => {
                    const key = item.text || item.q;
                    if (key && !existingTexts.has(key)) {
                        if (item.q && item.a) {
                            if (this.isSafeForChildren(item.q) && this.isSafeForChildren(item.a)) {
                                this.dynamicCache.push({ type: 'riddle', q: item.q, a: item.a });
                                existingTexts.add(key);
                                addedCount++;
                            }
                        } else if (item.text) {
                            if (this.isSafeForChildren(item.text)) {
                                this.dynamicCache.push({ type: item.category || 'dynamic', text: item.text });
                                existingTexts.add(key);
                                addedCount++;
                            }
                        }
                    }
                });

                localStorage.setItem('bingo_dynamic_banter_cache', JSON.stringify(this.dynamicCache));
                localStorage.setItem('bingo_banter_last_sync', String(now));
                if (addedCount > 0) {
                    console.log(`[PetLanguageEngine] 云端动态语料同步成功，新增 ${addedCount} 条趣味话题！`);
                }
            }
        } catch (e) {}
    },

    isSafeForChildren(text) {
        if (!text || typeof text !== 'string') return false;
        if (text.length < 4 || text.length > 70) return false;
        const blackList = ['死', '杀', '枪', '劫', '偷', '婚', '恋', '情', '鬼', '穷', '赌', '酒', '烟', '暴'];
        for (const bad of blackList) {
            if (text.includes(bad)) return false;
        }
        return true;
    },

    // 时段关怀与作息感知 (早晨/午餐/午后防困/傍晚/晚安)
    checkTimeAwareGreeting(petType = 'fish') {
        const now = Date.now();
        // 至少间隔 45 分钟触发一次时段关怀，避免打扰
        if (now - this.lastTimeGreetingTime < 2700000) return null;

        const hour = new Date().getHours();
        let greeting = null;
        if (hour >= 6 && hour < 9) {
            greeting = '清晨好呀！金色的朝阳洒在海面上，一日之计在于晨，今天也要元气满满！☀️';
        } else if (hour >= 11 && hour <= 13) {
            greeting = '咕噜噜~ 肚子在提醒该吃美味午饭啦！好好吃饭补充能量，大脑才会飞速运转哦！🍲';
        } else if (hour >= 14 && hour < 17) {
            greeting = '午后有点小困意？跟我一起伸个大懒腰，喝口温水，立刻精神百倍！🛋️';
        } else if (hour >= 18 && hour < 21) {
            greeting = '晚上好！夕阳西下，今天的小主人又掌握了好多好多新知识，为你点赞！🌆';
        } else if (hour >= 21 || hour < 6) {
            greeting = '夜深啦，小海鲜也要准备入眠做美梦了，注意保护眼睛，早早休息身体棒！🌙';
        }

        if (greeting) {
            this.lastTimeGreetingTime = now;
            DrawDeckManager.recordUsed(greeting);
            return { type: 'time_greeting', text: greeting };
        }
        return null;
    },

    // 随机获取一条生活化宽泛语料 (无放回抽牌堆 + 类别轮转防扎堆 + LRU 排除)
    getRandomBanter(petType = 'fish') {
        // 1. 优先检查时段共情 (15% 几率尝试触发早/中/晚问候)
        if (Math.random() < 0.15) {
            const timeItem = this.checkTimeAwareGreeting(petType);
            if (timeItem) return timeItem;
        }

        // 2. 轮盘轮转类别选择，避免连续相同类型
        const targetCategory = this.categoryWheel[this.wheelIndex % this.categoryWheel.length];
        this.wheelIndex++;

        // 3. 动态云端池抽取
        if (targetCategory === 'dynamic' && this.dynamicCache.length > 0) {
            const dynItem = DrawDeckManager.draw('dynamic_cloud', this.dynamicCache);
            if (dynItem) return dynItem;
        }

        // 4. 物种专属生活趣事抽牌
        if (targetCategory === 'species') {
            const petQuotes = (PET_HUMOR_BANK.species[petType] || PET_HUMOR_BANK.species.fish);
            const item = DrawDeckManager.draw('species_' + petType, petQuotes);
            return { type: 'joke', text: item };
        }

        // 5. 趣味脑筋急转弯
        if (targetCategory === 'riddle') {
            const riddle = DrawDeckManager.draw('riddles', PET_HUMOR_BANK.riddles);
            return { type: 'riddle', q: riddle.q, a: riddle.a };
        }

        // 6. 奇趣宇宙自然科普
        if (targetCategory === 'cosmos_nature') {
            const nature = DrawDeckManager.draw('cosmos_nature', PET_HUMOR_BANK.cosmos_nature);
            return { type: 'cosmos_nature', text: nature };
        }

        // 7. 吃货天地搞笑生活
        if (targetCategory === 'food_fun') {
            const food = DrawDeckManager.draw('food_fun', PET_HUMOR_BANK.food_fun);
            return { type: 'food_fun', text: food };
        }

        // 8. 天马行空幻想
        const imag = DrawDeckManager.draw('imagination', PET_HUMOR_BANK.imagination);
        return { type: 'imagination', text: imag };
    },

    // 动态投喂赞扬获取 (插槽式无限组合，告别单调硬编码)
    getFeedPraise(petType = 'fish') {
        return SlotSyntaxSynthesizer.generateFeedPraise(petType);
    },

    // 连胜激励获取
    getStreakCheer(streak, petType = 'fish') {
        return SlotSyntaxSynthesizer.generateStreakCheer(streak, petType);
    },

    // 唤醒问候获取 (无放回洗牌抽牌堆)
    getWakeUpGreeting(petType = 'fish') {
        return DrawDeckManager.draw('wake_greetings', PET_HUMOR_BANK.wake_greetings);
    },

    // 答对反馈大标题获取
    getFeedbackTitle() {
        return DrawDeckManager.draw('feedback_titles', PET_HUMOR_BANK.feedback_titles);
    },

    // 错题暖心治愈安抚触发 (含防抖与温馨发声)
    triggerWrongComfort(petType = 'fish') {
        const now = Date.now();
        // 6秒冷却防抖，避免连点错误选项时频繁触发语音
        if (now - this.lastWrongComfortTime < 6000) return;
        this.lastWrongComfortTime = now;

        if (!window.roamingPet) return;
        const comfort = SlotSyntaxSynthesizer.generateWrongComfort(petType);
        window.roamingPet.say(comfort, 4200);
        if (typeof PetVoice !== 'undefined') {
            PetVoice.speak(comfort, petType, { pitch: 1.05, rate: 0.95 });
        }
    },

    // 点击宠物互动获取
    getPetInteractionQuote(petType, activeForm, petDef) {
        const customDeckKey = `pet_click_${petType}_${activeForm ? activeForm.stage : 1}`;
        const quotesPool = [
            (activeForm && activeForm.quote) ? activeForm.quote : null,
            ...(petDef && petDef.quotes ? petDef.quotes : []),
            ...(PET_HUMOR_BANK.species[petType] ? PET_HUMOR_BANK.species[petType].slice(0, 10) : [])
        ].filter(Boolean);

        return DrawDeckManager.draw(customDeckKey, quotesPool);
    },

    // 触发幽默伴学发声与气泡
    triggerBanter(petType = 'fish', isIdle = false) {
        if (!window.roamingPet) return;
        if (this.riddleActive) return;

        const banter = this.getRandomBanter(petType);
        if (!banter) return;
        this.lastBanterTime = Date.now();
        const cfg = (typeof PetVoice !== 'undefined' && PetVoice.SPECIES_CONFIG[petType]) || { personaPrefix: '' };

        if (banter.type === 'riddle' && banter.q && banter.a) {
            // 二段式脑筋急转弯：念完谜面 -> 悬念思考停顿 1.8s -> 揭晓答案
            this.riddleActive = true;
            if (this.riddleTimer) clearTimeout(this.riddleTimer);
            if (this.riddleSafetyTimer) clearTimeout(this.riddleSafetyTimer);

            const questionText = (cfg.personaPrefix && !banter.q.startsWith('【')) ? `${cfg.personaPrefix} ${banter.q}` : banter.q;
            const answerText = banter.a;

            const questionAudioDuration = Math.max(3800, questionText.length * 280 + 600);
            const questionBubbleDuration = questionAudioDuration + 2400;

            window.roamingPet.say(questionText, questionBubbleDuration);

            if (window.roamingPet.body) {
                window.roamingPet.body.classList.add('pet-bounce');
                setTimeout(() => {
                    if (window.roamingPet && window.roamingPet.body) {
                        window.roamingPet.body.classList.remove('pet-bounce');
                    }
                }, 600);
            }

            let answerRevealed = false;
            const revealAnswer = () => {
                if (answerRevealed || !this.riddleActive) return;
                answerRevealed = true;
                if (this.riddleTimer) clearTimeout(this.riddleTimer);
                if (this.riddleSafetyTimer) clearTimeout(this.riddleSafetyTimer);

                if (!window.roamingPet) {
                    this.riddleActive = false;
                    return;
                }

                const answerDuration = Math.max(4200, answerText.length * 260);
                window.roamingPet.say(answerText, answerDuration);
                PetVoice.speak(answerText, petType, { pitch: 1.05 });

                this.triggerSpeciesReaction(petType);

                setTimeout(() => {
                    this.riddleActive = false;
                }, answerDuration + 400);
            };

            PetVoice.speak(questionText, petType, { rate: 0.95 }, () => {
                this.riddleTimer = setTimeout(() => {
                    revealAnswer();
                }, 1800);
            });

            this.riddleSafetyTimer = setTimeout(() => {
                revealAnswer();
            }, questionAudioDuration + 2200);

        } else {
            const rawText = banter.text || banter.q || '';
            const taggedText = (cfg.personaPrefix && !rawText.startsWith('【')) 
                ? `${cfg.personaPrefix} ${rawText}` 
                : rawText;
            const duration = Math.max(4200, taggedText.length * 250);
            window.roamingPet.say(taggedText, duration);
            PetVoice.speak(taggedText, petType);
            this.triggerSpeciesReaction(petType);
        }
    },

    triggerSpeciesReaction(petType) {
        if (!window.roamingPet || !window.roamingPet.body) return;
        const body = window.roamingPet.body;
        if (petType === 'crab') {
            body.classList.add('crab-pinch');
            PetSound.crabSnip();
            setTimeout(() => { if (body) body.classList.remove('crab-pinch'); }, 450);
        } else if (petType === 'shrimp') {
            body.classList.add('shrimp-snap');
            PetSound.shrimpSnap();
            setTimeout(() => { if (body) body.classList.remove('shrimp-snap'); }, 500);
        } else if (petType === 'octopus') {
            body.classList.add('octopus-dash');
            PetSound.suctionPop();
            setTimeout(() => { if (body) body.classList.remove('octopus-dash'); }, 600);
        } else {
            body.classList.add('pet-bounce');
            PetSound.bubble();
            setTimeout(() => { if (body) body.classList.remove('pet-bounce'); }, 400);
        }
    }
};

// 兼容别名保持旧调用兼容
const PetBanterEngine = PetLanguageEngine;

// --- 宠物状态与存储 ---
function getPetData() {
    if (window.PetEngine && PetEngine.Life) {
        return PetEngine.Life.getData();
    }
    try {
        const saved = localStorage.getItem('bingo_child_pet');
        if (saved) {
            const data = JSON.parse(saved);
            if (data && SEAFOOD_PETS[data.type]) {
                if (data.equippedStage === undefined) data.equippedStage = null;
                return data;
            }
        }
    } catch (e) {
        console.error('读取宠物数据失败:', e);
    }
    return {
        type: 'fish',
        customName: '小泡鱼',
        exp: 0,
        feedCount: 0,
        level: 1,
        equippedStage: null
    };
}

function savePetData(pet) {
    if (window.PetEngine && PetEngine.Life) {
        PetEngine.Life.saveData(pet);
        return;
    }
    try {
        localStorage.setItem('bingo_child_pet', JSON.stringify(pet));
    } catch (e) {
        console.error('保存宠物数据失败:', e);
    }
}

// 五阶成长经验映射算法
function getPetLevelInfo(exp) {
    exp = Math.max(0, exp || 0);
    if (exp >= 350) {
        const extra = Math.floor((exp - 350) / 80);
        return {
            stage: 5,
            stageIndex: 4,
            level: 10 + extra,
            title: '究极真神',
            minExp: 350,
            nextExp: 350 + (extra + 1) * 80
        };
    } else if (exp >= 200) {
        const sub = Math.floor((exp - 200) / 50); // 200~249: lv7, 250~299: lv8, 300~349: lv9
        return {
            stage: 4,
            stageIndex: 3,
            level: 7 + Math.min(2, sub),
            title: '觉醒变身',
            minExp: 200,
            nextExp: 350
        };
    } else if (exp >= 100) {
        const sub = Math.floor((exp - 100) / 50); // 100~149: lv5, 150~199: lv6
        return {
            stage: 3,
            stageIndex: 2,
            level: 5 + Math.min(1, sub),
            title: '深海巨擘',
            minExp: 100,
            nextExp: 200
        };
    } else if (exp >= 30) {
        const sub = Math.floor((exp - 30) / 35); // 30~64: lv3, 65~99: lv4
        return {
            stage: 2,
            stageIndex: 1,
            level: 3 + Math.min(1, sub),
            title: '敏捷先锋',
            minExp: 30,
            nextExp: 100
        };
    } else {
        const sub = Math.floor(exp / 15); // 0~14: lv1, 15~29: lv2
        return {
            stage: 1,
            stageIndex: 0,
            level: 1 + Math.min(1, sub),
            title: '初生萌宝',
            minExp: 0,
            nextExp: 30
        };
    }
}

// 获取宠物当前生效形态（支持随心穿戴变身）
function getPetActiveForm(pet) {
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const lvlInfo = getPetLevelInfo(pet.exp || 0);
    const maxUnlockedStage = lvlInfo.stageIndex;
    
    // 如果指定了穿戴形态且已解锁，则优先使用
    if (pet.equippedStage !== null && pet.equippedStage !== undefined && pet.equippedStage <= maxUnlockedStage) {
        return petDef.forms[pet.equippedStage] || petDef.forms[0];
    }
    // 默认穿戴最高已解锁形态
    return petDef.forms[maxUnlockedStage] || petDef.forms[0];
}

function getPetCurrentAvatar(pet) {
    return getPetActiveForm(pet).avatar;
}

// --- 答对即时投喂与升级变身检测 ---
let lastFeedingInfo = null;
function feedPetOnCorrectAnswer() {
    const pet = getPetData();
    const oldLvlInfo = getPetLevelInfo(pet.exp || 0);
    
    // 检查疾风弹射倍率与饱腹度加成
    let expGain = 10;
    if (window.PetEngine && PetEngine.Skills && PetEngine.Skills.activeEffects.hyperBoostRemaining > 0) {
        expGain *= 2;
        PetEngine.Skills.activeEffects.hyperBoostRemaining -= 1;
    }
    if ((pet.satiety ?? 85) >= 60) {
        expGain = Math.round(expGain * 1.2);
    }

    pet.exp = (pet.exp || 0) + expGain;
    pet.feedCount = (pet.feedCount || 0) + 1;
    childStreak += 1; // 累积连胜

    if (window.PetEngine && PetEngine.Life) {
        PetEngine.Life.feed(15);
    }
    if (window.PetEngine && PetEngine.Emotion) {
        PetEngine.Emotion.setEmotion(childStreak >= 3 ? 'celebrate' : 'happy');
        setTimeout(() => {
            if (PetEngine.Emotion.currentEmotion === 'celebrate' || PetEngine.Emotion.currentEmotion === 'happy') {
                PetEngine.Emotion.setEmotion('normal');
            }
        }, 3200);
    }
    
    const newLvlInfo = getPetLevelInfo(pet.exp);
    pet.level = newLvlInfo.level;
    
    // 检测是否达成了阶段性变身觉醒 (Evolve)
    const evolved = newLvlInfo.stageIndex > oldLvlInfo.stageIndex;
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const newForm = petDef.forms[newLvlInfo.stageIndex];
    
    if (evolved) {
        // 自动穿戴最新解锁的霸气变身形态
        pet.equippedStage = newLvlInfo.stageIndex;
    }
    
    savePetData(pet);

    // 播放音效
    PetSound.eat();
    if (childStreak >= 3) {
        setTimeout(() => PetSound.cheer(), 200);
    }

    lastFeedingInfo = {
        pet: pet,
        leveledUp: newLvlInfo.level > oldLvlInfo.level,
        evolved: evolved,
        oldLevel: oldLvlInfo.level,
        newLevel: newLvlInfo.level,
        oldStage: oldLvlInfo.stageIndex,
        newStage: newLvlInfo.stageIndex,
        levelTitle: newLvlInfo.title,
        form: newForm
    };

    // 漫游伴学精灵触发冲刺吞食动画
    if (window.roamingPet) {
        window.roamingPet.feedRush(petDef.foodIcon);
    }

    updatePetWidgets();

    // 如果突破形态变身，触发全屏变身盛典！
    if (evolved) {
        setTimeout(() => {
            triggerEvolutionModal(pet, newForm);
        }, 600);
    }

    return lastFeedingInfo;
}

// 答错打断连胜，并触发治愈系暖心安抚
function recordQuizWrong() {
    childStreak = 0;
    if (window.PetEngine && PetEngine.Emotion) {
        PetEngine.Emotion.setEmotion('comfort');
        setTimeout(() => {
            if (PetEngine.Emotion.currentEmotion === 'comfort') {
                PetEngine.Emotion.setEmotion('normal');
            }
        }, 3800);
    }
    if (window.roamingPet) {
        window.roamingPet.updateStreak(0);
        if (typeof PetLanguageEngine !== 'undefined') {
            const pet = getPetData();
            PetLanguageEngine.triggerWrongComfort(pet.type);
        }
    }
}

// --- 自由漫游伴学精灵引擎 (ROAMING COMPANION ENGINE) ---
class RoamingPetEngine {
    constructor() {
        this.container = null;
        this.body = null;
        this.speechEl = null;
        this.heartEl = null;
        this.auraEl = null;
        this.avatarEl = null;
        this.tagEl = null;
        this.sleepEl = null;
        
        this.x = 0;
        this.y = 0;
        this.isDragging = false;
        this.isSleeping = false;
        this.isDocked = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.initialX = 0;
        this.initialY = 0;
        this.hasMoved = false;

        this.wanderTimer = null;
        this.sleepTimer = null;
        this.autoWakeTimer = null;
        this.speechTimer = null;
        this.bubbleTimer = null;
        this.autonomousBanterTimer = null;
        this.lastIdleBanterCheck = Date.now();
    }

    init() {
        this.container = document.getElementById('roaming-pet-companion');
        if (!this.container) return;

        this.body = document.getElementById('roaming-pet-body');
        this.speechEl = document.getElementById('roaming-pet-speech');
        this.heartEl = document.getElementById('roaming-pet-heart');
        this.auraEl = document.getElementById('roaming-pet-aura');
        this.avatarEl = document.getElementById('roaming-pet-avatar');
        this.tagEl = document.getElementById('roaming-pet-tag');
        this.sleepEl = document.getElementById('roaming-pet-sleep-badge');

        // 默认初始位置：根据生物习性决定初始水层
        const w = window.innerWidth;
        const h = window.innerHeight;
        const pet = getPetData();
        this.x = Math.max(20, w - 90);
        if (pet.type === 'crab') {
            this.y = h - 85; // 螃蟹底栖沙滩层
        } else {
            this.y = Math.max(120, h - 180);
        }
        this.applyPosition();

        this.bindEvents();
        this.startWanderLoop();
        this.resetSleepTimer();
        this.startBubbleParticles();
        if (typeof PetBanterEngine !== 'undefined') {
            PetBanterEngine.init();
        }
        // 首次入场预热首聊 (12~16秒快速开启第一句趣味陪伴台词)
        this.scheduleAutonomousBanter(12000 + Math.random() * 4000);
    }

    bindEvents() {
        if (!this.body) return;

        // 指针拖拽与点击交互 (统一支持 Touch 与 Mouse)
        const onPointerDown = (e) => {
            if (e.target.closest('#roaming-pet-dock-btn')) return;
            this.isDragging = true;
            this.hasMoved = false;
            this.dragStartX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            this.dragStartY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            this.initialX = this.x;
            this.initialY = this.y;
            this.container.classList.add('dragging');
            this.wakeUp();

            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            window.addEventListener('pointercancel', onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!this.isDragging) return;
            const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
            const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            const dx = curX - this.dragStartX;
            const dy = curY - this.dragStartY;

            if (Math.hypot(dx, dy) > 8) {
                this.hasMoved = true;
            }

            this.x = Math.max(10, Math.min(window.innerWidth - 76, this.initialX + dx));
            this.y = Math.max(60, Math.min(window.innerHeight - 80, this.initialY + dy));
            this.applyPosition();
        };

        const onPointerUp = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.container.classList.remove('dragging');
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);

            // 若轻触无明显位移，触发戳戳抚摸互动！
            if (!this.hasMoved) {
                this.poke();
            } else {
                const pet = getPetData();
                const h = window.innerHeight;
                // 若靠近边缘，执行平滑贴边吸附
                this.snapToEdgeIfNeeded();
                // 真实重力沉底系统：若是机灵蟹且悬在高空且未吸附停泊，则受海洋重力自由落体沉回海底沙滩！
                if (pet.type === 'crab' && !this.isDocked && this.y < h - 110) {
                    this.container.classList.add('gravity-falling');
                    this.y = h - 85;
                    this.applyPosition();
                    setTimeout(() => {
                        if (this.container) this.container.classList.remove('gravity-falling');
                        if (this.body) {
                            this.body.classList.remove('pet-bounce');
                            void this.body.offsetWidth;
                            this.body.classList.add('pet-bounce');
                            setTimeout(() => { if (this.body) this.body.classList.remove('pet-bounce'); }, 400);
                        }
                        PetSound.crabThud();
                        setTimeout(() => PetSound.crabSnip(), 120);
                    }, 720);
                }
            }
            this.resetSleepTimer();
            this.stepAutonomousRoutine();
        };

        this.body.addEventListener('pointerdown', onPointerDown);

        // 鼠标悬停即刻唤醒 (Hover Wake-up)
        const onPointerEnter = () => {
            if (!isChildMode || this.isDragging) return;
            if (this.isSleeping) {
                this.wakeUp(true); // true = 由鼠标悬停轻柔唤醒
            }
        };

        if (this.body) {
            this.body.addEventListener('pointerenter', onPointerEnter);
            this.body.addEventListener('mouseenter', onPointerEnter);
        }
        if (this.container) {
            this.container.addEventListener('pointerenter', onPointerEnter);
            this.container.addEventListener('mouseenter', onPointerEnter);
        }

        // 答题界面近距离智能仿生避让 (Proximity Dodge)
        const onPassivePointerMove = (e) => {
            if (!isChildMode || this.isDragging || !this.isQuizViewActive()) return;
            const px = e.clientX || (e.touches && e.touches[0].clientX);
            const py = e.clientY || (e.touches && e.touches[0].clientY);
            if (px === undefined || py === undefined) return;
            const petCenterX = this.x + 34;
            const petCenterY = this.y + 34;
            if (Math.hypot(px - petCenterX, py - petCenterY) < 70) {
                this.fleeFromPointer(px, py);
            }
        };

        window.addEventListener('pointermove', onPassivePointerMove, { passive: true });
        window.addEventListener('touchmove', onPassivePointerMove, { passive: true });

        // 全局答题/点击活跃感应 (Active Learning Keep-alive)
        // 孩子在页面上答题或点击卡片时，轻量刷新睡眠倒计时，避免做题中途强制入眠
        let lastActivityReport = 0;
        const onPageUserActivity = () => {
            if (!isChildMode || this.isSleeping || this.isDragging) return;
            const now = Date.now();
            if (now - lastActivityReport > 5000) {
                lastActivityReport = now;
                this.resetSleepTimer();
            }
        };
        window.addEventListener('pointerdown', onPageUserActivity, { passive: true });
        window.addEventListener('keydown', onPageUserActivity, { passive: true });

        // 视口调整防出界
        window.addEventListener('resize', () => {
            this.x = Math.max(10, Math.min(window.innerWidth - 76, this.x));
            this.y = Math.max(60, Math.min(window.innerHeight - 80, this.y));
            this.applyPosition();
        });
    }

    isQuizViewActive() {
        const quizView = document.getElementById('view-quiz');
        return !!(quizView && quizView.style.display !== 'none');
    }

    fleeFromPointer(px, py) {
        if (this.isFleeing) return;
        this.isFleeing = true;
        PetSound.petFlee();
        const w = window.innerWidth;
        const h = window.innerHeight;

        const distLeft = this.x;
        const distRight = w - 75 - this.x;
        const distTop = this.y - 70;
        const distBottom = h - 75 - this.y;

        const minDist = Math.min(distLeft, distRight, distTop, distBottom);
        let targetX = this.x;
        let targetY = this.y;

        if (minDist === distLeft) {
            targetX = 15;
        } else if (minDist === distRight) {
            targetX = w - 75;
        } else if (minDist === distTop) {
            targetY = 70;
        } else {
            targetY = h - 75;
        }

        if (this.body) {
            this.body.classList.toggle('flip-left', targetX < this.x);
            this.body.classList.remove('pet-bounce');
            void this.body.offsetWidth;
            this.body.classList.add('pet-bounce');
            setTimeout(() => { if (this.body) this.body.classList.remove('pet-bounce'); }, 400);
        }

        if (this.container) {
            this.container.style.transition = 'left 0.4s ease-out, top 0.4s ease-out';
        }
        this.x = targetX;
        this.y = targetY;
        this.applyPosition();

        setTimeout(() => {
            if (this.container) this.container.style.transition = '';
            this.isFleeing = false;
        }, 1100);
    }

    applyPosition() {
        if (!this.container) return;
        this.container.style.left = `${this.x}px`;
        this.container.style.top = `${this.y}px`;
    }

    snapToEdgeIfNeeded() {
        const w = window.innerWidth;
        if (this.x < 40) {
            this.x = 10;
            this.isDocked = true;
        } else if (this.x > w - 110) {
            this.x = w - 78;
            this.isDocked = true;
        } else {
            this.isDocked = false;
        }
        if (this.container) {
            this.container.classList.toggle('docked', this.isDocked);
        }
        this.applyPosition();
    }

    // 启动四大物种仿生自主活动调度引擎 (Autonomous Marine Routine)
    startWanderLoop() {
        if (this.wanderTimer) clearTimeout(this.wanderTimer);
        this.stepAutonomousRoutine();
    }

    stepAutonomousRoutine() {
        if (this.wanderTimer) clearTimeout(this.wanderTimer);

        // 若处于休眠、拖拽、侧边停泊或非儿童模式，稍后重试检测
        if (!isChildMode || this.isDragging || this.isSleeping || this.isDocked) {
            this.wanderTimer = setTimeout(() => this.stepAutonomousRoutine(), 1200);
            return;
        }

        const w = window.innerWidth;
        const h = window.innerHeight;
        const pet = getPetData();
        const inQuiz = this.isQuizViewActive();

        if (this.container) {
            this.container.classList.toggle('in-quiz-mode', inQuiz);
        }

        let nextDelay = 3000;

        if (inQuiz) {
            // === 答题界面：外围安全环带巡游模式 (Perimeter Safety Ring Cruise) ===
            // 绝不侵入做题核心区与选项按钮，在四周环带自然游曳
            const zones = (pet.type === 'crab') 
                ? ['bottom', 'left', 'right'] // 螃蟹不爬在顶部答题栏，沿底边或贴左右边框
                : ['top', 'bottom', 'left', 'right'];
            const chosenZone = zones[Math.floor(Math.random() * zones.length)];

            let targetX = this.x;
            let targetY = this.y;

            if (chosenZone === 'top') {
                targetX = 20 + Math.random() * (w - 105);
                targetY = 70 + Math.random() * 25;
            } else if (chosenZone === 'bottom') {
                targetX = 20 + Math.random() * (w - 105);
                targetY = h - (75 + Math.random() * 15);
            } else if (chosenZone === 'left') {
                targetX = 15;
                targetY = 85 + Math.random() * (h - 180);
            } else {
                targetX = w - 75;
                targetY = 85 + Math.random() * (h - 180);
            }

            const isLeft = targetX < this.x;
            if (this.body) {
                this.body.classList.toggle('flip-left', isLeft);
            }

            if (pet.type === 'crab') {
                const isWall = (chosenZone === 'left' || chosenZone === 'right');
                if (this.container) {
                    this.container.classList.add(isWall ? 'motion-crab-climb' : 'motion-crab-step');
                }
                if (this.body) {
                    this.body.classList.add(isWall ? 'crab-climbing' : 'crab-stepping');
                }
                if (isWall) {
                    PetSound.crabClimb();
                } else {
                    PetSound.crabScuttle();
                }
                this.x = targetX;
                this.y = targetY;
                this.applyPosition();

                setTimeout(() => {
                    if (this.container) this.container.classList.remove('motion-crab-climb', 'motion-crab-step');
                    if (this.body) this.body.classList.remove('crab-climbing', 'crab-stepping');
                }, isWall ? 3400 : 1350);
                nextDelay = 8000 + Math.random() * 4000;

            } else if (pet.type === 'shrimp') {
                if (this.container) this.container.classList.add('motion-shrimp-pop');
                if (this.body) {
                    this.body.classList.remove('shrimp-snap');
                    void this.body.offsetWidth;
                    this.body.classList.add('shrimp-snap');
                }
                PetSound.shrimpSnap();
                this.x = targetX;
                this.y = targetY;
                this.applyPosition();

                setTimeout(() => {
                    if (this.container) this.container.classList.remove('motion-shrimp-pop');
                    if (this.body) this.body.classList.remove('shrimp-snap');
                }, 450);
                nextDelay = 8000 + Math.random() * 4000;

            } else if (pet.type === 'octopus') {
                if (this.container) this.container.classList.add('motion-octopus-glide');
                if (this.body) {
                    this.body.classList.remove('octopus-dash');
                    void this.body.offsetWidth;
                    this.body.classList.add('octopus-dash');
                }
                PetSound.octopusJet();
                this.x = targetX;
                this.y = targetY;
                this.applyPosition();

                setTimeout(() => {
                    if (this.container) this.container.classList.remove('motion-octopus-glide');
                    if (this.body) this.body.classList.remove('octopus-dash');
                }, 3600);
                nextDelay = 8000 + Math.random() * 4000;

            } else {
                // fish
                if (this.container) this.container.classList.add('motion-fish-swim');
                if (this.body) this.body.classList.add('fish-cruising');
                PetSound.fishGlide();
                this.x = targetX;
                this.y = targetY;
                this.applyPosition();

                setTimeout(() => {
                    if (this.container) this.container.classList.remove('motion-fish-swim');
                    if (this.body) this.body.classList.remove('fish-cruising');
                }, 4000);
                nextDelay = 8000 + Math.random() * 4000;
            }

        } else {
            // === 首页/仪表盘：真实全屏生态拟真活动 (Full-screen Authentic Habitat) ===
            const minX = 18;
            const maxX = w - 85;
            const minY = 68;
            const maxY = h - 80;

            if (pet.type === 'crab') {
                // 🦀 1. 机灵蟹：海底沙滩横行小碎步 + 侧壁垂直攀爬 (Floor Scuttle & Side-Wall Climb)
                const isNearLeftWall = this.x <= 35;
                const isNearRightWall = this.x >= w - 90;
                const isNearFloor = this.y >= h - 110;

                // 遇到侧壁且在底端时，有 55% 几率沿玻璃侧壁垂直向上攀爬！
                if ((isNearLeftWall || isNearRightWall) && isNearFloor && Math.random() < 0.55) {
                    const climbY = minY + Math.random() * (h * 0.45);
                    const wallX = isNearLeftWall ? 16 : (w - 76);

                    if (this.container) this.container.classList.add('motion-crab-climb');
                    if (this.body) this.body.classList.add('crab-climbing');
                    PetSound.crabClimb();

                    this.x = wallX;
                    this.y = climbY;
                    this.applyPosition();

                    setTimeout(() => {
                        if (this.container) this.container.classList.remove('motion-crab-climb');
                        if (this.body) this.body.classList.remove('crab-climbing');
                    }, 3400);
                    nextDelay = 5500 + Math.random() * 3000;

                } else if (!isNearFloor && (isNearLeftWall || isNearRightWall)) {
                    // 若在高处壁面，顺着墙壁爬下海底沙滩
                    const descendY = h - (78 + Math.random() * 12);
                    if (this.container) this.container.classList.add('motion-crab-climb');
                    if (this.body) this.body.classList.add('crab-climbing');
                    PetSound.crabClimb();

                    this.y = descendY;
                    this.applyPosition();

                    setTimeout(() => {
                        if (this.container) this.container.classList.remove('motion-crab-climb');
                        if (this.body) this.body.classList.remove('crab-climbing');
                    }, 3400);
                    nextDelay = 5500 + Math.random() * 3000;

                } else {
                    // 底栖沙滩层正常横行小碎步
                    if (!this.crabDirection) this.crabDirection = (Math.random() > 0.5 ? 1 : -1);
                    let stepDist = (22 + Math.random() * 26) * this.crabDirection;
                    let targetX = this.x + stepDist;

                    if (targetX < minX) {
                        targetX = 18;
                        this.crabDirection = 1;
                    } else if (targetX > maxX) {
                        targetX = maxX;
                        this.crabDirection = -1;
                    } else if (Math.random() < 0.3) {
                        this.crabDirection = -this.crabDirection;
                    }

                    const targetY = h - (78 + Math.random() * 12);

                    if (this.body) {
                        this.body.classList.toggle('flip-left', targetX < this.x);
                        this.body.classList.add('crab-stepping');
                    }
                    if (this.container) {
                        this.container.classList.add('motion-crab-step');
                    }
                    PetSound.crabScuttle();

                    this.x = targetX;
                    this.y = targetY;
                    this.applyPosition();

                    setTimeout(() => {
                        if (this.container) this.container.classList.remove('motion-crab-step');
                        if (this.body) {
                            this.body.classList.remove('crab-stepping');
                            if (Math.random() < 0.25) {
                                this.body.classList.add('crab-pinch');
                                PetSound.crabSnip();
                                setTimeout(() => { if (this.body) this.body.classList.remove('crab-pinch'); }, 450);
                            }
                        }
                    }, 1350);

                    nextDelay = 5500 + Math.random() * 3000;
                }

            } else if (pet.type === 'shrimp') {
                // 🦐 2. 跳跳虾：全水层冲顶爆发弹射 + 慢速羽毛飘沉 (Full-column Surface Pop & Feather Drift)
                const direction = (this.x > w - 100) ? -1 : (this.x < 45 ? 1 : (Math.random() > 0.5 ? 1 : -1));
                const leapX = Math.max(minX, Math.min(maxX, this.x + direction * (40 + Math.random() * 55)));
                
                // 若在中下层，有概率冲顶弹跃至上水层
                let leapY;
                if (this.y > h * 0.45 && Math.random() < 0.55) {
                    leapY = minY + Math.random() * (h * 0.28);
                } else {
                    leapY = Math.max(minY, this.y - (35 + Math.random() * 45));
                }

                if (this.body) {
                    this.body.classList.toggle('flip-left', leapX < this.x);
                    this.body.classList.remove('shrimp-snap');
                    void this.body.offsetWidth;
                    this.body.classList.add('shrimp-snap');
                    setTimeout(() => { if (this.body) this.body.classList.remove('shrimp-snap'); }, 600);
                }

                if (this.container) {
                    this.container.classList.add('motion-shrimp-pop');
                }
                PetSound.shrimpSnap();

                this.x = leapX;
                this.y = leapY;
                this.applyPosition();

                // 0.45s 后如羽毛般慢速随水流飘沉
                setTimeout(() => {
                    if (this.container) {
                        this.container.classList.remove('motion-shrimp-pop');
                        this.container.classList.add('motion-shrimp-float');
                    }
                    PetSound.shrimpFloat();
                    this.y = Math.min(maxY, this.y + 35 + Math.random() * 40);
                    this.applyPosition();

                    setTimeout(() => {
                        if (this.container) this.container.classList.remove('motion-shrimp-float');
                    }, 3000);
                }, 450);

                nextDelay = 6000 + Math.random() * 3500;

            } else if (pet.type === 'octopus') {
                // 🐙 3. 皮皮章：全屏斜向漏斗喷流 + 触手舒展滑翔 (Full-screen Pulse Jet & Glide)
                const targetX = minX + Math.random() * (maxX - minX);
                const targetY = minY + Math.random() * (maxY - minY);

                if (this.body) {
                    this.body.classList.toggle('flip-left', targetX < this.x);
                    this.body.classList.remove('octopus-dash');
                    void this.body.offsetWidth;
                    this.body.classList.add('octopus-dash');
                    setTimeout(() => { if (this.body) this.body.classList.remove('octopus-dash'); }, 600);
                }

                if (this.container) {
                    this.container.classList.add('motion-octopus-jet');
                }
                PetSound.octopusJet();

                this.x = (this.x + targetX) / 2;
                this.y = (this.y + targetY) / 2;
                this.applyPosition();

                setTimeout(() => {
                    if (this.container) {
                        this.container.classList.remove('motion-octopus-jet');
                        this.container.classList.add('motion-octopus-glide');
                    }
                    if (targetX < 40 || targetX > w - 100) {
                        PetSound.suctionPop();
                    }
                    this.x = targetX;
                    this.y = targetY;
                    this.applyPosition();

                    setTimeout(() => {
                        if (this.container) this.container.classList.remove('motion-octopus-glide');
                    }, 3800);
                }, 550);

                nextDelay = 6500 + Math.random() * 4000;

            } else {
                // 🐟 4. 小泡鱼：全屏流线正弦游弋与动态俯仰 (Full-screen Streamlined Cruising)
                const targetX = minX + Math.random() * (maxX - minX);
                const targetY = minY + Math.random() * (maxY - minY);

                const isMovingLeft = targetX < this.x;
                if (this.body) {
                    this.body.classList.toggle('flip-left', isMovingLeft);
                    this.body.classList.add('fish-cruising');
                    const dy = targetY - this.y;
                    const pitchDeg = Math.max(-14, Math.min(14, Math.round(dy / 10)));
                    if (this.avatarEl) {
                        this.avatarEl.style.transform = (isMovingLeft ? 'scaleX(-1) ' : '') + `rotate(${pitchDeg}deg)`;
                    }
                }

                if (this.container) {
                    this.container.classList.add('motion-fish-swim');
                }
                PetSound.fishGlide();

                this.x = targetX;
                this.y = targetY;
                this.applyPosition();

                setTimeout(() => {
                    if (this.container) this.container.classList.remove('motion-fish-swim');
                    if (this.avatarEl) {
                        this.avatarEl.style.transform = isMovingLeft ? 'scaleX(-1)' : 'none';
                    }
                }, 4100);

                nextDelay = 5500 + Math.random() * 3500;
            }
        }

        // 根据活跃度偏好动态调节巡游间隔 (文静/适中/活泼)
        const activity = (typeof getPetActivity === 'function') ? getPetActivity() : 'normal';
        let activityMultiplier = 1.0;
        if (activity === 'low') {
            activityMultiplier = 1.85; // 文静：游动间隔长，平稳少打扰 (约 12~18s)
        } else if (activity === 'high') {
            activityMultiplier = 0.52; // 活泼：游动巡游频率高，欢快好动 (约 3~5s)
        }
        const finalDelay = Math.max(2000, Math.round(nextDelay * activityMultiplier));

        this.wanderTimer = setTimeout(() => this.stepAutonomousRoutine(), finalDelay);
    }

    // 吐出水泡粒子 (小泡鱼连珠泡，其他物种单泡)
    startBubbleParticles() {
        if (this.bubbleTimer) clearInterval(this.bubbleTimer);
        this.bubbleTimer = setInterval(() => {
            if (!isChildMode || this.isSleeping || !this.container || this.container.style.display === 'none') return;
            const pet = getPetData();

            // 小泡鱼吐连珠升腾泡 (2个依次升起)，其他海鲜吐单泡
            const bubbleCount = pet.type === 'fish' ? 2 : 1;
            if (pet.type === 'fish') {
                PetSound.multiBubble();
            } else if (Math.random() < 0.35) {
                PetSound.bubble();
            }

            for (let i = 0; i < bubbleCount; i++) {
                setTimeout(() => {
                    if (!this.container) return;
                    const bubble = document.createElement('div');
                    bubble.innerText = '🫧';
                    bubble.style.position = 'absolute';
                    bubble.style.left = `${45 + (Math.random() - 0.5) * 16}%`;
                    bubble.style.top = '10px';
                    bubble.style.fontSize = `${12 + Math.random() * 10}px`;
                    bubble.style.pointerEvents = 'none';
                    bubble.style.zIndex = '5';
                    bubble.style.transition = 'all 1.4s ease-out';
                    bubble.style.opacity = '0.85';
                    this.container.appendChild(bubble);

                    setTimeout(() => {
                        bubble.style.transform = `translate(${(Math.random() - 0.5) * 35}px, -${35 + Math.random() * 30}px) scale(1.3)`;
                        bubble.style.opacity = '0';
                    }, 30);

                    setTimeout(() => {
                        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
                    }, 1500);
                }, i * 220);
            }
        }, 4200);
    }

    // 戳戳与抚摸互动 (按海洋生物真实防卫本能应激)
    poke() {
        this.wakeUp();
        const pet = getPetData();
        const activeForm = getPetActiveForm(pet);
        const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;

        // 根据生物学特性触发专属应激防御动作与音效
        if (pet.type === 'crab') {
            // 机灵蟹：双螯双剪！咔嚓！咔嚓！
            PetSound.crabSnip();
            if (this.body) {
                this.body.classList.remove('crab-pinch', 'pet-somersault', 'pet-bounce');
                void this.body.offsetWidth;
                this.body.classList.add('crab-pinch');
                setTimeout(() => { if (this.body) this.body.classList.remove('crab-pinch'); }, 650);
            }
            // 快速横移逃跑一段
            const w = window.innerWidth;
            const escapeDx = (this.x > w / 2 ? -45 : 45);
            this.x = Math.max(20, Math.min(w - 85, this.x + escapeDx));
            this.applyPosition();

        } else if (pet.type === 'shrimp') {
            // 跳跳虾：弓背反向暴弹起飞！
            PetSound.shrimpSnap();
            if (this.body) {
                this.body.classList.remove('shrimp-snap', 'pet-somersault', 'pet-bounce');
                void this.body.offsetWidth;
                this.body.classList.add('shrimp-snap');
                setTimeout(() => { if (this.body) this.body.classList.remove('shrimp-snap'); }, 750);
            }
            // 向上暴跃
            this.y = Math.max(120, this.y - 40);
            this.applyPosition();

        } else if (pet.type === 'octopus') {
            // 皮皮章：喷射黑紫色墨汁烟雾逃生！
            PetSound.octopusJet();
            PetSound.inkDiffuse();
            if (this.body) {
                this.body.classList.remove('octopus-dash', 'pet-somersault', 'pet-bounce');
                void this.body.offsetWidth;
                this.body.classList.add('octopus-dash');
                setTimeout(() => { if (this.body) this.body.classList.remove('octopus-dash'); }, 700);
            }

            // 产生真实墨汁烟雾
            const ink = document.createElement('div');
            ink.className = 'roaming-ink-cloud';
            ink.style.left = `${this.x + 34}px`;
            ink.style.top = `${this.y + 34}px`;
            document.body.appendChild(ink);
            setTimeout(() => {
                if (ink.parentNode) ink.parentNode.removeChild(ink);
            }, 1600);

            // 借墨雾后撤
            this.y = Math.min(window.innerHeight - 90, this.y + 35);
            this.applyPosition();

        } else {
            // 小泡鱼：摆尾急速游窜 + 连珠水泡
            PetSound.fishDart();
            PetSound.multiBubble();
            if (this.body) {
                this.body.classList.remove('fish-dash', 'pet-somersault', 'pet-bounce');
                void this.body.offsetWidth;
                this.body.classList.add('fish-dash');
                setTimeout(() => { if (this.body) this.body.classList.remove('fish-dash'); }, 650);
            }
            // 吐一串惊扰气泡
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (!this.container) return;
                    const b = document.createElement('div');
                    b.innerText = '🫧';
                    b.style.position = 'absolute';
                    b.style.left = `${40 + i * 8}%`;
                    b.style.top = '10px';
                    b.style.fontSize = `${10 + i * 4}px`;
                    b.style.pointerEvents = 'none';
                    b.style.transition = 'all 0.9s ease-out';
                    this.container.appendChild(b);
                    setTimeout(() => {
                        b.style.transform = `translate(${(Math.random() - 0.5) * 40}px, -45px) scale(1.4)`;
                        b.style.opacity = '0';
                    }, 20);
                    setTimeout(() => { if (b.parentNode) b.parentNode.removeChild(b); }, 900);
                }, i * 100);
            }
        }

        // 爱心粒子飘出
        if (this.heartEl) {
            this.heartEl.style.display = 'block';
            setTimeout(() => {
                if (this.heartEl) this.heartEl.style.display = 'none';
            }, 800);
        }

        // 随机专属台词与语音朗读 (65% 概率触发幽默金句/脑筋急转弯，35% 触发形态称号与深度互动台词)
        if (typeof PetLanguageEngine !== 'undefined' && Math.random() < 0.65) {
            PetLanguageEngine.triggerBanter(pet.type, false);
        } else {
            const cfg = (typeof PetVoice !== 'undefined' && PetVoice.SPECIES_CONFIG[pet.type]) || { personaPrefix: '' };
            const rawQuote = (typeof PetLanguageEngine !== 'undefined')
                ? PetLanguageEngine.getPetInteractionQuote(pet.type, activeForm, petDef)
                : activeForm.quote;
            const quote = (cfg.personaPrefix && !rawQuote.startsWith('【')) ? `${cfg.personaPrefix} ${rawQuote}` : rawQuote;
            this.say(quote);
            PetVoice.speak(quote, pet.type);
        }

        // 用户主动互动后，将下次自主闲聊顺延至 25~35 秒后
        this.scheduleAutonomousBanter(25000 + Math.random() * 10000);
    }

    // 显示气泡台词 (支持自适应阅读时长)
    say(text, customDuration) {
        if (!this.speechEl) return;
        const textSpan = document.getElementById('roaming-pet-speech-text');
        if (textSpan) textSpan.innerText = text;

        this.speechEl.style.display = 'block';
        if (this.speechTimer) clearTimeout(this.speechTimer);
        const duration = customDuration || Math.max(3800, (text || '').length * 240);
        this.speechTimer = setTimeout(() => {
            if (this.speechEl) this.speechEl.style.display = 'none';
        }, duration);
    }

    // 答对冲刺进食动画
    feedRush(foodIcon) {
        this.wakeUp();
        PetSound.eat();
        const pet = getPetData();
        const foodEl = document.getElementById('roaming-pet-food-flying');
        if (foodEl) {
            foodEl.innerText = foodIcon || '🍪';
            foodEl.style.display = 'block';
            foodEl.style.left = `${Math.max(20, this.x - 50)}px`;
            foodEl.style.top = `${Math.max(60, this.y - 40)}px`;
            foodEl.style.transform = 'scale(1.2)';

            setTimeout(() => {
                foodEl.style.left = `${this.x + 15}px`;
                foodEl.style.top = `${this.y + 15}px`;
                foodEl.style.transform = 'scale(0.2)';
                foodEl.style.opacity = '0';
            }, 40);

            setTimeout(() => {
                foodEl.style.display = 'none';
                foodEl.style.opacity = '1';
                foodEl.style.transform = 'scale(1)';
            }, 650);
        }

        // 宠物开心迎食
        if (this.body) {
            this.body.classList.remove('pet-bounce');
            void this.body.offsetWidth;
            this.body.classList.add('pet-bounce');
            setTimeout(() => {
                if (this.body) this.body.classList.remove('pet-bounce');
            }, 650);
        }

        const praise = (typeof PetLanguageEngine !== 'undefined')
            ? PetLanguageEngine.getFeedPraise(pet.type)
            : `+10 EXP！真香呀！😋`;
        this.say(praise);
        PetVoice.speak(praise, pet.type);
    }

    // 怠速打盹检测 (45秒未操作入眠)
    resetSleepTimer() {
        if (this.sleepTimer) clearTimeout(this.sleepTimer);
        if (this.autoWakeTimer) clearTimeout(this.autoWakeTimer);
        this.sleepTimer = setTimeout(() => {
            if (isChildMode && !this.isDragging && !this.isSleeping) {
                this.goToSleep();
            }
        }, 45000);
    }

    goToSleep() {
        this.isSleeping = true;
        if (window.PetEngine && PetEngine.Emotion) {
            PetEngine.Emotion.setEmotion('sleep');
        }
        if (this.autonomousBanterTimer) {
            clearTimeout(this.autonomousBanterTimer);
            this.autonomousBanterTimer = null;
        }
        if (this.sleepEl) this.sleepEl.style.display = 'block';
        if (this.body) this.body.style.filter = 'brightness(0.9)';
        PetSound.petSnore();

        // 自动小憩苏醒定时器 (打盹 12~20 秒后自然伸懒腰醒来)
        if (this.autoWakeTimer) clearTimeout(this.autoWakeTimer);
        const napDuration = 12000 + Math.random() * 8000;
        this.autoWakeTimer = setTimeout(() => {
            if (this.isSleeping && isChildMode && !this.isDragging) {
                this.wakeUp(false, true); // false=非悬浮, true=自动自然苏醒
            }
        }, napDuration);
    }

    wakeUp(byHover = false, isAuto = false) {
        if (this.autoWakeTimer) clearTimeout(this.autoWakeTimer);
        if (this.isSleeping) {
            this.isSleeping = false;
            if (window.PetEngine && PetEngine.Emotion) {
                PetEngine.Emotion.setEmotion('normal');
            }
            if (this.sleepEl) this.sleepEl.style.display = 'none';
            if (this.body) {
                this.body.style.filter = 'none';
                this.body.classList.remove('pet-bounce');
                void this.body.offsetWidth;
                this.body.classList.add('pet-bounce');
                setTimeout(() => { if (this.body) this.body.classList.remove('pet-bounce'); }, 500);
            }
            PetSound.petWake();

            const pet = getPetData();
            if (byHover) {
                // 鼠标悬停唤醒台词互动 (无放回洗牌抽牌堆)
                const cfg = (typeof PetVoice !== 'undefined' && PetVoice.SPECIES_CONFIG[pet.type]) || { personaPrefix: '' };
                const rawGreet = (typeof PetLanguageEngine !== 'undefined')
                    ? PetLanguageEngine.getWakeUpGreeting(pet.type)
                    : '呼啊~ 揉揉眼睛，你来找我玩啦！👀';
                const greet = (cfg.personaPrefix && !rawGreet.startsWith('【')) ? `${cfg.personaPrefix} ${rawGreet}` : rawGreet;
                this.say(greet, 3800);
                PetVoice.speak(greet, pet.type);
                // 悬停唤醒后，下一次闲聊顺延至 20~28 秒后
                this.scheduleAutonomousBanter(20000 + Math.random() * 8000);
            } else if (isAuto) {
                // 自动自然醒来，吐个小泡泡，并在 12~18 秒后开启新趣味闲聊
                PetSound.bubble();
                this.scheduleAutonomousBanter(12000 + Math.random() * 6000);
            }

            this.stepAutonomousRoutine();
        }
        this.resetSleepTimer();
    }

    toggleDock() {
        const w = window.innerWidth;
        if (this.isDocked) {
            this.isDocked = false;
            const pet = getPetData();
            this.x = w / 2 - 34;
            this.y = (pet.type === 'crab') ? (window.innerHeight - 85) : (window.innerHeight - 150);
            this.stepAutonomousRoutine();
        } else {
            this.isDocked = true;
            this.x = this.x > w / 2 ? w - 78 : 10;
        }
        if (this.container) {
            this.container.classList.toggle('docked', this.isDocked);
        }
        this.applyPosition();
    }

    updateStreak(streak) {
        if (!this.body) return;
        if (streak >= 3) {
            this.body.classList.add('streak-active');
            const cheer = (typeof PetLanguageEngine !== 'undefined')
                ? PetLanguageEngine.getStreakCheer(streak)
                : `🔥 ${streak}连胜！狂热变身形态！冲呀！`;
            this.say(cheer);
            if (streak === 3 || streak === 5 || streak === 8 || streak === 10) {
                const pet = getPetData();
                PetVoice.speak(cheer, pet.type);
            }
        } else {
            this.body.classList.remove('streak-active');
        }
    }

    // 同步渲染外观与光环
    render() {
        if (!this.container) return;
        const pet = getPetData();
        const activeForm = getPetActiveForm(pet);
        const lvlInfo = getPetLevelInfo(pet.exp || 0);

        if (this.avatarEl) {
            if (window.PetEngine && PetEngine.Vector) {
                this.avatarEl.innerHTML = PetEngine.Vector.renderSvg(pet.type, lvlInfo.stageIndex, {
                    emotion: (window.PetEngine && PetEngine.Emotion) ? PetEngine.Emotion.currentEmotion : 'normal',
                    width: 68,
                    height: 68
                });
            } else {
                this.avatarEl.innerText = activeForm.avatar;
            }
        }
        if (this.tagEl) this.tagEl.innerText = `Lv.${lvlInfo.level}`;

        // 清理旧光环类名并应用新光环
        if (this.auraEl) {
            this.auraEl.className = `roaming-pet-aura ${activeForm.aura || 'aura-bubble'}`;
        }

        // 设置四大物种生物步态动画 (gait-fish / gait-crab / gait-shrimp / gait-octopus)
        if (this.body) {
            this.body.classList.remove('gait-fish', 'gait-crab', 'gait-shrimp', 'gait-octopus');
            this.body.classList.add(`gait-${pet.type || 'fish'}`);
        }

        // 螃蟹底栖校准：若当前是螃蟹且悬在高处且未吸附停泊，自动归位到底部沙滩海床
        const h = window.innerHeight;
        if (pet.type === 'crab' && !this.isDragging && !this.isDocked && this.y < h - 110) {
            this.y = h - 85;
            this.applyPosition();
        }

        this.updateStreak(childStreak);
    }

    // 调度下一次自主幽默伴学闲聊 (受话痨度配置动态影响)
    scheduleAutonomousBanter(delayMs) {
        if (this.autonomousBanterTimer) {
            clearTimeout(this.autonomousBanterTimer);
            this.autonomousBanterTimer = null;
        }

        const chattiness = (typeof getPetChattiness === 'function') ? getPetChattiness() : 'normal';
        if (chattiness === 'quiet') {
            // 乖巧模式：彻底禁用自主闲聊，只在用户主动点击/做题/连胜时互动发声
            return;
        }

        let baseDelay = 32000;
        let randomSpan = 18000;
        if (chattiness === 'talkative') {
            // 话痨模式：高频 12~20 秒爆笑闲聊
            baseDelay = 12000;
            randomSpan = 8000;
        }

        let delay = (delayMs !== undefined) ? delayMs : (baseDelay + Math.random() * randomSpan);
        if (chattiness === 'talkative' && delayMs !== undefined && delayMs > 20000) {
            delay = 14000 + Math.random() * 6000;
        }

        this.autonomousBanterTimer = setTimeout(() => {
            this.triggerAutonomousBanter();
        }, delay);
    }

    // 即时应用习性调校 (活跃度 & 话痨度)
    applyHabitSettings() {
        const chattiness = (typeof getPetChattiness === 'function') ? getPetChattiness() : 'normal';
        if (chattiness === 'quiet') {
            if (this.autonomousBanterTimer) {
                clearTimeout(this.autonomousBanterTimer);
                this.autonomousBanterTimer = null;
            }
        } else {
            this.scheduleAutonomousBanter(chattiness === 'talkative' ? 5000 : 16000);
        }

        // 立即根据新活跃度重新规划巡游计时器
        if (this.wanderTimer) {
            clearTimeout(this.wanderTimer);
            this.wanderTimer = null;
        }
        if (!this.isSleeping && !this.isDragging && !this.isDocked) {
            this.stepAutonomousRoutine();
        }
    }

    // 触发自主幽默伴学闲聊
    triggerAutonomousBanter() {
        if (this.autonomousBanterTimer) {
            clearTimeout(this.autonomousBanterTimer);
            this.autonomousBanterTimer = null;
        }

        // 如果非儿童模式、处于睡眠、拖拽或侧边停靠，稍后避让重试
        if (!isChildMode || this.isSleeping || this.isDragging || this.isDocked) {
            this.scheduleAutonomousBanter(8000 + Math.random() * 4000);
            return;
        }

        // 如果当前正在朗读题目语音或脑筋急转弯二段式未完成，礼貌避让
        if ((typeof PetVoice !== 'undefined' && PetVoice.speaking) ||
            (typeof PetBanterEngine !== 'undefined' && PetBanterEngine.riddleActive)) {
            this.scheduleAutonomousBanter(6000 + Math.random() * 3000);
            return;
        }

        // 正常触发幽默闲聊
        const pet = getPetData();
        if (typeof PetBanterEngine !== 'undefined') {
            PetBanterEngine.triggerBanter(pet.type, true);
        }

        // 调度下一轮自主闲聊 (22~35秒周期)
        this.scheduleAutonomousBanter();
    }

    // 开发者/测试快捷手动触发接口
    triggerBanterNow() {
        this.triggerAutonomousBanter();
    }

    show() {
        if (!this.container) this.init();
        if (this.container) {
            this.container.style.display = 'block';
            this.render();
            if (!this.isSleeping && !this.autonomousBanterTimer) {
                this.scheduleAutonomousBanter(12000 + Math.random() * 4000);
            }
        }
    }

    hide() {
        if (this.autonomousBanterTimer) {
            clearTimeout(this.autonomousBanterTimer);
            this.autonomousBanterTimer = null;
        }
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}

// 伴学精灵单例
window.roamingPet = new RoamingPetEngine();
if (typeof PetBanterEngine !== 'undefined') {
    PetBanterEngine.init();
}

function togglePetDock(e) {
    if (e) e.stopPropagation();
    if (window.roamingPet) {
        window.roamingPet.toggleDock();
    }
}

// 宠物点击语音互动 (供固定挂件或卡片点击使用)
function speakPetQuote() {
    if (window.roamingPet) {
        window.roamingPet.poke();
    } else {
        const pet = getPetData();
        const activeForm = getPetActiveForm(pet);
        PetSound.bubble();
        if (typeof window.speakText === 'function') {
            window.speakText(activeForm.quote, pet.type);
        }
    }
}

// 更新界面上的所有宠物挂件
function updatePetWidgets() {
    if (!isChildMode) return;
    const pet = getPetData();
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const lvlInfo = getPetLevelInfo(pet.exp || 0);
    const activeForm = getPetActiveForm(pet);

    // 1. 首页宠物状态卡片
    const homeBadge = document.getElementById('child-pet-home-badge');
    if (homeBadge) {
        const vectorAvatar = (window.PetEngine && PetEngine.Vector)
            ? PetEngine.Vector.renderSvg(pet.type, lvlInfo.stageIndex, { width: 44, height: 44 })
            : `<span style="font-size:32px;">${activeForm.avatar}</span>`;

        homeBadge.innerHTML = `
            <div class="pet-avatar-circle" onclick="speakPetQuote()" title="点击与我互动！">
                ${vectorAvatar}
            </div>
            <div class="pet-badge-info" onclick="openPetModal()">
                <div style="font-weight:bold; font-size:15px; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                    <span>${pet.customName || petDef.name}</span>
                    <span class="pet-level-tag">Lv.${lvlInfo.level} · ${activeForm.title}</span>
                </div>
                <div style="font-size:12px; color:var(--text-sub); margin-top:2px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span>EXP: ${pet.exp}/${lvlInfo.nextExp}</span>
                    <span class="pet-satiety-pill" title="饱腹度 (做题投喂保持饱满)">🍗 ${pet.satiety ?? 85}%</span>
                    <span class="pet-shells-pill" title="深海贝壳币">🐚 ${pet.shells ?? 20}</span>
                </div>
                <div class="pet-exp-bar"><div class="pet-exp-fill" style="width:${Math.min(100, Math.round(((pet.exp - lvlInfo.minExp) / (lvlInfo.nextExp - lvlInfo.minExp)) * 100))}%;"></div></div>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                <button class="btn btn-ghost btn-sound-toggle" onclick="togglePetSound(event)" title="声音开关" style="width:34px; height:34px; padding:0; border-radius:50%; font-size:15px; display:inline-flex; align-items:center; justify-content:center; border:1.5px solid rgba(255,112,166,0.4); cursor:pointer;">
                    ${PetSound.isEnabled() ? '🔊' : '🔇'}
                </button>
                <button class="btn btn-ghost btn-aquarium-entry" onclick="openPetModal()">水族馆 🐠</button>
            </div>
        `;
        homeBadge.style.display = 'flex';
    }

    // 2. 答题界面伴学胶囊挂件 (内置于标题栏居中)
    const quizWidget = document.getElementById('child-pet-quiz-widget');
    if (quizWidget) {
        const compactSvg = (window.PetEngine && PetEngine.Vector)
            ? PetEngine.Vector.renderSvg(pet.type, lvlInfo.stageIndex, { width: 24, height: 24 })
            : activeForm.avatar;
        const skillDef = (window.PetEngine && PetEngine.Skills) ? PetEngine.Skills.getSkillDef(pet.type) : null;
        const skillHtml = skillDef ? `
            <button type="button" class="btn-pet-skill-trigger ${PetEngine.Skills.canUseSkill(pet.type) ? 'skill-ready' : 'skill-exhausted'}" 
                    id="pet-quiz-skill-btn"
                    onclick="triggerCompanionSkill(event)" 
                    title="${skillDef.name}: ${skillDef.desc}">
                <span>${skillDef.icon}</span>
                <span class="skill-name-text">${skillDef.name}</span>
            </button>
        ` : '';

        quizWidget.innerHTML = `
            <div class="pet-quiz-avatar" onclick="speakPetQuote()" title="轻触听我说说话！">${compactSvg}</div>
            <div class="pet-quiz-name" title="${activeForm.title} (Lv.${lvlInfo.level})">${activeForm.title}</div>
            ${skillHtml}
            <button class="btn btn-ghost pet-quiz-sound-btn" onclick="togglePetSound(event)" title="声音开关">${PetSound.isEnabled() ? '🔊' : '🔇'}</button>
        `;
        quizWidget.style.display = 'inline-flex';
    }

    // 3. 漫游伴学精灵同步
    if (window.roamingPet) {
        window.roamingPet.render();
    }
}

// --- 全屏变身进化盛典 (FULLSCREEN EVOLUTION CEREMONY) ---
let currentEvolvingPet = null;
let currentEvolvingForm = null;

function triggerEvolutionModal(pet, newForm) {
    const modal = document.getElementById('modal-pet-evolution');
    if (!modal) return;

    currentEvolvingPet = pet;
    currentEvolvingForm = newForm;

    const preAvatarEl = document.getElementById('evo-pre-avatar');
    const newAvatarContainer = document.getElementById('evo-avatar-container');
    const newAvatarEl = document.getElementById('evo-new-avatar');
    const titleBanner = document.getElementById('evo-banner');
    const formTitle = document.getElementById('evo-form-title');
    const descEl = document.getElementById('evo-desc');
    const quoteEl = document.getElementById('evo-quote');

    // 填入数据
    const petDef = SEAFOOD_PETS[pet.type] || SEAFOOD_PETS.fish;
    const oldStage = Math.max(0, newForm.stage - 2);
    const preForm = petDef.forms[oldStage] || petDef.forms[0];

    if (preAvatarEl) {
        if (window.PetEngine && PetEngine.Vector) {
            preAvatarEl.innerHTML = PetEngine.Vector.renderSvg(pet.type, oldStage, { width: 100, height: 100 });
        } else {
            preAvatarEl.innerText = preForm.avatar;
        }
        preAvatarEl.style.opacity = '1';
        preAvatarEl.style.transform = 'scale(1)';
    }

    if (newAvatarContainer) {
        newAvatarContainer.classList.remove('active');
    }

    if (newAvatarEl) {
        if (window.PetEngine && PetEngine.Vector) {
            newAvatarEl.innerHTML = PetEngine.Vector.renderSvg(pet.type, newForm.stage - 1, { width: 120, height: 120, emotion: 'celebrate' });
        } else {
            newAvatarEl.innerText = newForm.avatar;
        }
    }
    if (titleBanner) titleBanner.innerText = `🎉 恭喜！觉醒五阶变身！ 🎉`;
    if (formTitle) formTitle.innerText = `【${newForm.title}】`;
    if (descEl) descEl.innerText = newForm.desc;
    if (quoteEl) quoteEl.innerText = `“${newForm.quote}”`;

    // 播放变身华丽和弦音
    PetSound.evolution();

    modal.style.display = 'flex';

    // 产生变身动画节奏：蓄能 -> 闪耀爆发
    setTimeout(() => {
        if (preAvatarEl) {
            preAvatarEl.style.opacity = '0';
            preAvatarEl.style.transform = 'scale(0.1)';
        }
        if (newAvatarContainer) {
            newAvatarContainer.classList.add('active');
        }
        spawnEvolutionConfetti();

        // 激动人心的语音宣读
        if (typeof window.speakText === 'function') {
            window.speakText(`太棒啦！${pet.customName || petDef.name}觉醒变身为${newForm.title}啦！${newForm.quote}`);
        }
    }, 900);
}

function spawnEvolutionConfetti() {
    const container = document.getElementById('evolution-confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#FF70A6', '#FFD166', '#06D6A0', '#118AB2', '#FF9F1C', '#E0AAFF', '#FFF'];

    for (let i = 0; i < 40; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = `${6 + Math.random() * 8}px`;
        piece.style.height = `${10 + Math.random() * 12}px`;
        piece.style.animationDelay = `${Math.random() * 0.6}s`;
        piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
        container.appendChild(piece);
    }
}

function confirmEvolution() {
    const modal = document.getElementById('modal-pet-evolution');
    if (modal) modal.style.display = 'none';

    if (window.roamingPet) {
        window.roamingPet.render();
        window.roamingPet.poke();
    }
    updatePetWidgets();
}

// --- 水族馆与五阶变身展厅 (AQUARIUM & TRANSFORMATION CODEX) ---
let aquariumSelectedFamily = 'fish';

function openPetModal() {
    const modal = document.getElementById('modal-pet-selection');
    if (!modal) return;
    const currentPet = getPetData();
    aquariumSelectedFamily = currentPet.type || 'fish';
    renderAquariumModal();
    modal.style.display = 'flex';
}

function closePetModal() {
    const modal = document.getElementById('modal-pet-selection');
    if (modal) modal.style.display = 'none';
}

function renderAquariumModal() {
    const currentPet = getPetData();
    const activeType = currentPet.type || 'fish';
    aquariumSelectedFamily = activeType;
    const petDef = SEAFOOD_PETS[activeType] || SEAFOOD_PETS.fish;
    const lvlInfo = getPetLevelInfo(currentPet.exp || 0);

    // 1. 顶部 4 大海鲜物种卡片 (一键切换伴学伙伴)
    const gridContainer = document.getElementById('pet-selector-grid');
    if (gridContainer) {
        gridContainer.innerHTML = '';
        Object.values(SEAFOOD_PETS).forEach(p => {
            const isActive = (activeType === p.id);
            const card = document.createElement('div');
            card.className = `pet-selector-card ${isActive ? 'active' : ''}`;
            card.onclick = () => switchCompanionPet(p.id);
            const cardSvg = (window.PetEngine && PetEngine.Vector)
                ? PetEngine.Vector.renderSvg(p.id, 0, { width: 34, height: 34 })
                : p.avatar;
            card.innerHTML = `
                <div class="pet-card-icon" style="display:flex; align-items:center; justify-content:center; width:34px; height:34px;">${cardSvg}</div>
                <div class="pet-card-name">${p.name}</div>
                <div class="pet-card-status">${isActive ? '伴学中 ⭐' : '选我 🐾'}</div>
            `;
            gridContainer.appendChild(card);
        });
    }

    // 兼容老版本 tabs (如有)
    const tabsContainer = document.getElementById('aquarium-tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = '';
    }

    // 2. 渲染头部物种简介卡
    const headerEl = document.getElementById('aquarium-header-card');
    if (headerEl) {
        const headerSvg = (window.PetEngine && PetEngine.Vector)
            ? PetEngine.Vector.renderSvg(activeType, lvlInfo.stageIndex, { width: 54, height: 54 })
            : `<div style="font-size:38px;">${petDef.avatar}</div>`;
        headerEl.innerHTML = `
            <div style="width:54px; height:54px; flex-shrink:0;">${headerSvg}</div>
            <div style="flex-grow:1; text-align:left;">
                <div style="font-weight:bold; font-size:15px; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                    <span>${petDef.name}</span>
                    <span style="font-size:12px; color:var(--text-sub); font-weight:normal;">(${petDef.speciesName})</span>
                </div>
                <div style="font-size:12px; color:var(--text-sub); margin-top:3px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span>喜好：${petDef.foodIcon} ${petDef.favoriteFood}</span>
                    <span class="pet-satiety-pill">🍗 ${currentPet.satiety ?? 85}%</span>
                    <span class="pet-shells-pill">🐚 ${currentPet.shells ?? 20}</span>
                    <span style="color:#FF70A6; font-weight:bold;">💖 羁绊 Lv.${currentPet.bondLevel ?? 1}</span>
                </div>
            </div>
        `;
    }

    // 2.5 同步精灵习性调节控制状态 (活跃度 & 话痨度)
    if (typeof syncHabitControlsUI === 'function') {
        syncHabitControlsUI();
    }

    // 3. 渲染五阶变身进化图鉴树 (用户经验全物种通用解锁)
    const treeContainer = document.getElementById('aquarium-evolution-tree');
    if (treeContainer) {
        treeContainer.innerHTML = '';
        const maxUnlockedStage = lvlInfo.stageIndex;
        const equippedStage = (currentPet.equippedStage !== null && currentPet.equippedStage !== undefined)
            ? currentPet.equippedStage
            : maxUnlockedStage;

        petDef.forms.forEach((form, idx) => {
            const isUnlocked = idx <= maxUnlockedStage;
            const isEquipped = (idx === equippedStage);

            const card = document.createElement('div');
            card.className = `evo-stage-card ${isUnlocked ? 'unlocked' : 'locked'} ${isEquipped ? 'equipped' : ''}`;

            let actionHtml = '';
            if (isEquipped) {
                actionHtml = `<span style="font-size:12px; font-weight:bold; color:#FF70A6;">变身中 ⭐</span>`;
            } else if (isUnlocked) {
                actionHtml = `<button class="btn btn-ghost" style="padding:4px 10px; font-size:12px; border-radius:10px;" onclick="equipPetForm(${idx})">变身此形态</button>`;
            } else {
                actionHtml = `<span style="font-size:11px; color:var(--text-sub);">🔒 Lv.${form.unlockLevel} 解锁</span>`;
            }

            const stageSvg = (window.PetEngine && PetEngine.Vector)
                ? PetEngine.Vector.renderSvg(activeType, idx, { width: 44, height: 44 })
                : `<span>${form.avatar}</span>`;
            card.innerHTML = `
                <div class="evo-stage-avatar-box" style="display:flex; align-items:center; justify-content:center;">
                    ${stageSvg}
                </div>
                <div class="evo-stage-info">
                    <div class="evo-stage-title">
                        ${form.title}
                        <span style="font-size:11px; font-weight:normal; color:var(--text-sub);">(第${form.stage}阶)</span>
                    </div>
                    <div class="evo-stage-desc">${isUnlocked ? form.desc : '提升答题等级即可觉醒此形态！'}</div>
                </div>
                <div class="evo-stage-action">
                    ${actionHtml}
                </div>
            `;
            treeContainer.appendChild(card);
        });
    }

    // 4. 底部确定按钮文本 (若有旧按钮则兼容)
    const chooseBtn = document.getElementById('btn-aquarium-choose-pet');
    if (chooseBtn) {
        chooseBtn.innerText = '完成 🐾';
    }
}

// 一键切换伴学宠物
function switchCompanionPet(petId) {
    if (!SEAFOOD_PETS[petId]) return;
    const pet = getPetData();
    if (pet.type !== petId) {
        pet.type = petId;
        pet.customName = SEAFOOD_PETS[petId].name;
        pet.equippedStage = null; // 重置为当前最高解锁形态
        savePetData(pet);
        PetSound.cheer();

        if (window.roamingPet) {
            window.roamingPet.render();
            window.roamingPet.startWanderLoop();
            // 切换物种后，将下一次自主闲聊重置为 12~18 秒（让新宠物尽快开口展示自己的语言系统）
            window.roamingPet.scheduleAutonomousBanter(12000 + Math.random() * 4000);
        }
        updatePetWidgets();

        // 四大伴学宠物专属报到入场台词与专属声线
        const welcomeQuotes = {
            crab: '太棒啦！机灵蟹前来报到！横着走谁也难不倒我们！🦀',
            shrimp: '太棒啦！跳跳虾小火箭发射！嗖的一下，做题全对！🚀',
            octopus: '太棒啦！皮皮章智多星在此！八只手帮你抓牢所有的正确答案！🐙',
            fish: '太棒啦！小泡鱼好搭档来啦！今天也要开开心心！🫧'
        };
        const welcomeText = welcomeQuotes[petId] || `太棒啦！从现在开始，${SEAFOOD_PETS[petId].name}就是你的伴学好搭档啦！`;

        if (window.roamingPet) {
            window.roamingPet.say(welcomeText, 4500);
        }
        PetVoice.speak(welcomeText, petId);
    }
    aquariumSelectedFamily = petId;
    renderAquariumModal();
}

// 随心切换穿戴形态
function equipPetForm(stageIndex) {
    const pet = getPetData();
    const lvlInfo = getPetLevelInfo(pet.exp || 0);
    if (stageIndex > lvlInfo.stageIndex) return; // 未解锁不能穿戴

    pet.equippedStage = stageIndex;
    savePetData(pet);
    PetSound.bubble();

    const activeForm = getPetActiveForm(pet);
    if (window.roamingPet) {
        window.roamingPet.render();
        window.roamingPet.poke();
    }
    updatePetWidgets();
    renderAquariumModal();

    if (typeof window.speakText === 'function') {
        window.speakText(`变身完毕！现在我是${activeForm.title}啦！`, pet.type);
    }
}

// 确定选为陪伴萌宠 (兼顾老调用)
function applyAquariumSelection() {
    switchCompanionPet(aquariumSelectedFamily);
    closePetModal();
}

// 兼容老版本 selectPet
function selectPet(petId) {
    aquariumSelectedFamily = petId;
    applyAquariumSelection();
}

// --- 初始化与儿童模式开关 ---
function initChildMode() {
    const mode = localStorage.getItem('app_mode');
    if (mode === 'child') {
        enableChildMode(true);
    }
}

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
        if (typeof syncHabitControlsUI === 'function') {
            syncHabitControlsUI();
        }
        if (window.roamingPet) {
            window.roamingPet.show();
        }
    } else {
        html.removeAttribute('data-mode');
        localStorage.setItem('app_mode', 'normal');
        if (icon) icon.innerText = '👶';
        if (homeBadge) homeBadge.style.display = 'none';
        if (quizWidget) quizWidget.style.display = 'none';
        if (window.roamingPet) {
            window.roamingPet.hide();
        }
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
    const activeForm = getPetActiveForm(pet);

    const feedbackPetEl = document.getElementById('feedback-pet-container');
    if (feedbackPetEl) {
        let levelUpBanner = '';
        if (lastFeedingInfo && lastFeedingInfo.leveledUp) {
            levelUpBanner = `<div class="pet-levelup-banner">🎉 哇！升级啦！变成【${lastFeedingInfo.levelTitle}】！</div>`;
        }

        const feedbackSvg = (window.PetEngine && PetEngine.Vector)
            ? PetEngine.Vector.renderSvg(pet.type, lvlInfo.stageIndex, { width: 52, height: 52, emotion: 'celebrate' })
            : activeForm.avatar;

        feedbackPetEl.innerHTML = `
            <div class="feedback-pet-animation" style="display:flex; align-items:center; justify-content:center; gap:8px;">
                <span class="eating-food" style="font-size:32px;">${petDef.foodIcon}</span>
                <div class="eating-pet" style="width:52px; height:52px;">${feedbackSvg}</div>
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

    const feedbackTitle = document.getElementById('feedback-title');
    if (feedbackTitle) {
        feedbackTitle.innerText = (typeof PetLanguageEngine !== 'undefined')
            ? PetLanguageEngine.getFeedbackTitle()
            : '太棒了！';
    }

    feedback.style.display = 'flex';

    if (childFeedbackTimeout) clearTimeout(childFeedbackTimeout);
    childFeedbackTimeout = setTimeout(nextChildQuestion, 2000);
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

window.addEventListener('DOMContentLoaded', () => {
    if (isChildMode && window.roamingPet) {
        window.roamingPet.init();
        window.roamingPet.show();
    }
});
