let isChildMode = false;
let childStreak = 0; // 儿童模式连胜计数

// --- 全局声音总控与音量管理 (SOUND MASTER CONTROLLER) ---
function togglePetSound(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    PetSound.toggleSound();
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
                gain.gain.setValueAtTime(0.08, now + delay);
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
            gain.gain.setValueAtTime(0.09, now);
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
            gain.gain.setValueAtTime(0.09, now);
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
            gain.gain.setValueAtTime(0.07, now);
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

    // 20. 萌宠开口对话提示音 (按生物属性专属水滴音阶)
    voiceChime(petType = 'fish') {
        if (!this.isEnabled()) return;
        const ctx = this.getCtx();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            let freqs = [659.25, 880.00]; // 默认鱼：水滴双音
            let waveType = 'sine';
            if (petType === 'crab') {
                freqs = [987.77, 1318.51];
                waveType = 'triangle';
            } else if (petType === 'shrimp') {
                freqs = [783.99, 1174.66];
                waveType = 'sawtooth';
            } else if (petType === 'octopus') {
                freqs = [440.00, 587.33];
                waveType = 'sine';
            }

            freqs.forEach((f, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = waveType;
                osc.frequency.setValueAtTime(f, now + idx * 0.06);
                gain.gain.setValueAtTime(0.14, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.005, now + idx * 0.06 + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.13);
            });
        } catch (e) {}
    }
};

// --- 拟真萌宠语音系统 (PET VOICE SYSTEM: DUAL ENGINE) ---
const PetVoice = {
    speaking: false,
    currentUtterance: null,

    // 获取最佳中文童声/亲和女声
    getBestChineseVoice() {
        if (!('speechSynthesis' in window)) return null;
        const voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) return null;

        // 优先级：微软晓晓(童声/元气)、云希(童声)、晓伊、谷歌普通话、苹果婷婷
        const preferred = [
            'Xiaoxiao',
            'Yunxi',
            'Xiaoyi',
            'Google 普通话',
            'Ting-Ting',
            'Yaoyao',
            'Kangkang',
            'Chinese',
            'zh-CN',
            'zh'
        ];

        for (const name of preferred) {
            const found = voices.find(v => (v.lang.startsWith('zh') || v.lang.includes('CN')) && v.name.includes(name));
            if (found) return found;
        }

        return voices.find(v => v.lang === 'zh-CN' || v.lang.startsWith('zh')) || voices[0];
    },

    // 任天堂“动森式”程序化拟声语 (Animalese Procedural Babble: 0KB 纯前端音阶生成)
    playAnimalese(text, petType = 'fish') {
        if (!PetSound.isEnabled()) return;
        const ctx = PetSound.getCtx();
        if (!ctx || !text) return;

        let baseFreq = 520;
        let waveType = 'sine';
        if (petType === 'fish') { baseFreq = 540; waveType = 'sine'; }
        else if (petType === 'crab') { baseFreq = 420; waveType = 'triangle'; }
        else if (petType === 'shrimp') { baseFreq = 620; waveType = 'sawtooth'; }
        else if (petType === 'octopus') { baseFreq = 380; waveType = 'sine'; }

        const now = ctx.currentTime;
        const len = Math.min(10, Math.max(3, text.length));
        const stepTime = 0.065;
        const scaleOffsets = [0, 2, 4, 7, 9, 12, 14, 16];

        for (let i = 0; i < len; i++) {
            const code = text.charCodeAt(i % text.length);
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

    // 核心统一发声入口
    speak(text, petType = 'fish', options = {}) {
        if (!PetSound.isEnabled() || !text) return;

        // 1. 播放专属生物开口水滴提示音
        PetSound.voiceChime(petType);

        // 2. 调校版萌童声发音
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            // 稚嫩童声参数调校：音调 pitch 提升至 1.40，语速 1.05 轻快活泼
            utterance.pitch = (options.pitch !== undefined) ? options.pitch : 1.40;
            utterance.rate = (options.rate !== undefined) ? options.rate : 1.05;
            utterance.volume = (options.volume !== undefined) ? options.volume : 0.95;

            const bestVoice = this.getBestChineseVoice();
            if (bestVoice) {
                utterance.voice = bestVoice;
            }

            this.currentUtterance = utterance;
            this.speaking = true;

            utterance.onend = () => {
                this.speaking = false;
                this.currentUtterance = null;
            };

            utterance.onerror = () => {
                this.speaking = false;
                this.currentUtterance = null;
                // TTS 发声异常时平滑回退至动森拟声
                this.playAnimalese(text, petType);
            };

            // 留出 100ms 间隔使开口音先清晰入耳
            setTimeout(() => {
                window.speechSynthesis.speak(utterance);
            }, 100);
        } else {
            this.playAnimalese(text, petType);
        }
    }
};

// 预热浏览器语音列表
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        PetVoice.getBestChineseVoice();
    };
}

// 全局统一定义 speakText，兼容旧调用
window.speakText = function(text, petType) {
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

// --- 宠物状态与存储 ---
function getPetData() {
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
        equippedStage: null // null 表示跟随当前最高解锁形态
    };
}

function savePetData(pet) {
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
    
    pet.exp = (pet.exp || 0) + 10;
    pet.feedCount = (pet.feedCount || 0) + 1;
    childStreak += 1; // 累积连胜
    
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

// 答错打断连胜
function recordQuizWrong() {
    childStreak = 0;
    if (window.roamingPet) {
        window.roamingPet.updateStreak(0);
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
        this.speechTimer = null;
        this.bubbleTimer = null;
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
                }, isWall ? 1500 : 900);
                nextDelay = 2200 + Math.random() * 800;

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
                }, 400);
                nextDelay = 3200 + Math.random() * 800;

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
                }, 2100);
                nextDelay = 3500 + Math.random() * 800;

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
                }, 2400);
                nextDelay = 2800 + Math.random() * 600;
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
                    }, 1500);
                    nextDelay = 2400 + Math.random() * 600;

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
                    }, 1500);
                    nextDelay = 2200 + Math.random() * 600;

                } else {
                    // 底栖沙滩层正常横行小碎步
                    if (!this.crabDirection) this.crabDirection = (Math.random() > 0.5 ? 1 : -1);
                    let stepDist = (38 + Math.random() * 48) * this.crabDirection;
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
                    }, 850);

                    nextDelay = 1650 + Math.random() * 550;
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

                // 0.38s 后如羽毛般慢速随水流飘沉
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
                    }, 1700);
                }, 380);

                nextDelay = 2900 + Math.random() * 700;

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
                    }, 2100);
                }, 420);

                nextDelay = 3400 + Math.random() * 800;

            } else {
                // 🐟 4. 小泡鱼：全屏流线正弦游弋与动态俯仰 (Full-screen Streamlined Cruising)
                const targetX = minX + Math.random() * (maxX - minX);
                const targetY = minY + Math.random() * (maxY - minY);

                const isMovingLeft = targetX < this.x;
                if (this.body) {
                    this.body.classList.toggle('flip-left', isMovingLeft);
                    this.body.classList.add('fish-cruising');
                    const dy = targetY - this.y;
                    const pitchDeg = Math.max(-16, Math.min(16, Math.round(dy / 7)));
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
                }, 2500);

                nextDelay = 2700 + Math.random() * 600;
            }
        }

        this.wanderTimer = setTimeout(() => this.stepAutonomousRoutine(), nextDelay);
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

        // 随机专属台词与语音朗读
        const quotesPool = [activeForm.quote, ...(petDef.quotes || [])];
        const quote = quotesPool[Math.floor(Math.random() * quotesPool.length)];

        this.say(quote);
        PetVoice.speak(quote, pet.type);
    }

    // 显示气泡台词
    say(text) {
        if (!this.speechEl) return;
        const textSpan = document.getElementById('roaming-pet-speech-text');
        if (textSpan) textSpan.innerText = text;

        this.speechEl.style.display = 'block';
        if (this.speechTimer) clearTimeout(this.speechTimer);
        this.speechTimer = setTimeout(() => {
            if (this.speechEl) this.speechEl.style.display = 'none';
        }, 3600);
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

        this.say(`+10 EXP！真香呀！😋`);
        PetVoice.speak('+10 EXP！真香呀！', pet.type);
    }

    // 怠速打盹检测 (45秒未操作入眠)
    resetSleepTimer() {
        if (this.sleepTimer) clearTimeout(this.sleepTimer);
        this.sleepTimer = setTimeout(() => {
            if (isChildMode && !this.isDragging) {
                this.goToSleep();
            }
        }, 45000);
    }

    goToSleep() {
        this.isSleeping = true;
        if (this.sleepEl) this.sleepEl.style.display = 'block';
        if (this.body) this.body.style.filter = 'brightness(0.9)';
        PetSound.petSnore();
    }

    wakeUp() {
        if (this.isSleeping) {
            this.isSleeping = false;
            if (this.sleepEl) this.sleepEl.style.display = 'none';
            if (this.body) this.body.style.filter = 'none';
            PetSound.petWake();
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
            this.say(`🔥 ${streak}连胜！狂热变身形态！冲呀！`);
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

        if (this.avatarEl) this.avatarEl.innerText = activeForm.avatar;
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

    show() {
        if (!this.container) this.init();
        if (this.container) {
            this.container.style.display = 'block';
            this.render();
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}

// 伴学精灵单例
window.roamingPet = new RoamingPetEngine();

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
            window.speakText(activeForm.quote);
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
        homeBadge.innerHTML = `
            <div class="pet-avatar-circle" onclick="speakPetQuote()" title="点击与我互动！">
                <span style="font-size:32px;">${activeForm.avatar}</span>
            </div>
            <div class="pet-badge-info" onclick="openPetModal()">
                <div style="font-weight:bold; font-size:15px; color:var(--text-main); display:flex; align-items:center; gap:6px;">
                    <span>${pet.customName || petDef.name}</span>
                    <span class="pet-level-tag">Lv.${lvlInfo.level} · ${activeForm.title}</span>
                </div>
                <div style="font-size:12px; color:var(--text-sub); margin-top:2px;">
                    已投喂 ${pet.feedCount || 0} 次 · EXP: ${pet.exp}/${lvlInfo.nextExp}
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

    // 2. 答题界面伴学挂件
    const quizWidget = document.getElementById('child-pet-quiz-widget');
    if (quizWidget) {
        quizWidget.innerHTML = `
            <div class="pet-quiz-avatar" onclick="speakPetQuote()" title="轻触听我说说话！">${activeForm.avatar}</div>
            <div class="pet-quiz-name">${activeForm.title} (Lv.${lvlInfo.level})</div>
            <button class="btn btn-ghost" onclick="togglePetSound(event)" title="声音开关" style="font-size:13px; padding:2px 4px; border:none; background:transparent; cursor:pointer; opacity:0.8;">${PetSound.isEnabled() ? '🔊' : '🔇'}</button>
        `;
        quizWidget.style.display = 'flex';
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
        preAvatarEl.innerText = preForm.avatar;
        preAvatarEl.style.opacity = '1';
        preAvatarEl.style.transform = 'scale(1)';
    }

    if (newAvatarContainer) {
        newAvatarContainer.classList.remove('active');
    }

    if (newAvatarEl) newAvatarEl.innerText = newForm.avatar;
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
            card.innerHTML = `
                <div class="pet-card-icon">${p.avatar}</div>
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
        headerEl.innerHTML = `
            <div style="font-size:38px;">${petDef.avatar}</div>
            <div style="flex-grow:1; text-align:left;">
                <div style="font-weight:bold; font-size:15px; color:var(--text-main);">
                    ${petDef.name} <span style="font-size:12px; color:var(--text-sub); font-weight:normal;">(${petDef.speciesName})</span>
                </div>
                <div style="font-size:12px; color:var(--text-sub); margin-top:2px;">
                    喜好：${petDef.foodIcon} ${petDef.favoriteFood} · 当前成长：Lv.${lvlInfo.level} (${lvlInfo.stageName})
                </div>
            </div>
        `;
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

            card.innerHTML = `
                <div class="evo-stage-avatar-box">
                    <span>${form.avatar}</span>
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
        }
        updatePetWidgets();

        if (typeof window.speakText === 'function') {
            window.speakText(`太棒啦！从现在开始，${SEAFOOD_PETS[petId].name}就是你的伴学好搭档啦！`);
        }
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
        window.speakText(`变身完毕！现在我是${activeForm.title}啦！`);
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

        feedbackPetEl.innerHTML = `
            <div class="feedback-pet-animation">
                <span class="eating-food">${petDef.foodIcon}</span>
                <span class="eating-pet">${activeForm.avatar}</span>
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
