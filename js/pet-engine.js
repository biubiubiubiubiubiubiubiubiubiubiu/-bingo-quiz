/**
 * ============================================================================
 * Bingo Quiz - 高阶伴学萌宠生态引擎 (PET COMPANION ADVANCED SYSTEM)
 * 1. 纯矢量程序化 SVG 萌宠渲染器 (PetVectorRenderer - 眼神跟踪/自主眨眼/嘴型张合)
 * 2. 虚拟生命体与养成状态机 (PetLifeSystem - 饱腹度/亲密度羁绊/贝壳币)
 * 3. 伴学战术神技系统 (PetSkillSystem - 剪刀破题/锦鲤结界/疾风倍率/荧光题眼)
 * 4. 情绪与情景感知微动引擎 (PetEmotionSystem - 思考/狂欢/安慰/小憩)
 * ============================================================================
 */

const PetEngine = (function() {
    'use strict';

    // --- 1. 纯矢量程序化 SVG 渲染库 (PET VECTOR RENDERER) ---
    const PetVector = {
        // 全局实例计数器，保证各 SVG 渐变与滤镜 ID 绝对唯一，彻底杜绝隐藏视图造成的 ID 遮蔽
        uidCounter: 0,

        // 当前全局光标视线方向 (归一化 -1 到 1)
        gaze: { x: 0, y: 0 },
        isBlinking: false,
        blinkTimer: null,
        speakingPhase: 0,
        speakingInterval: null,

        // 各物种五阶实体底色表 (Solid Base Color Palette - 保证极端渲染下绝对不镂空)
        BASE_COLORS: {
            fish: ['#00B4D8', '#0077B6', '#E76F51', '#D62828', '#03045E'],
            crab: ['#FF4D6D', '#C92A2A', '#D4A373', '#0D1B2A', '#5A189A'],
            shrimp: ['#FF85A1', '#FB8500', '#C1121F', '#0077B6', '#9D0208'],
            octopus: ['#7B2CBF', '#007200', '#3C096C', '#03045E', '#3D0066']
        },

        // 各物种五阶高光渐变色表
        GRAD_STOPS: {
            fish: {
                start: ['#72EFDD', '#48CAE4', '#FFD166', '#FF9F1C', '#00F5D4'],
                end: ['#00B4D8', '#0077B6', '#E76F51', '#D62828', '#03045E']
            },
            crab: {
                start: ['#FF85A1', '#FF6B6B', '#FFD166', '#00F5D4', '#E0AAFF'],
                end: ['#FF4D6D', '#C92A2A', '#D4A373', '#0D1B2A', '#5A189A']
            },
            shrimp: {
                start: ['#FFB4A2', '#FFB703', '#FF4D6D', '#FFEA00', '#FF758F'],
                end: ['#E5989B', '#FB8500', '#C1121F', '#0077B6', '#9D0208']
            },
            octopus: {
                start: ['#C77DFF', '#70E000', '#9D4EDD', '#48CAE4', '#FFD166'],
                end: ['#7B2CBF', '#007200', '#3C096C', '#03045E', '#3D0066']
            }
        },

        init() {
            // 监听全局指针移动，用于眼睛平滑视线跟随
            window.addEventListener('pointermove', (e) => {
                const w = window.innerWidth || 800;
                const h = window.innerHeight || 600;
                this.gaze.x = Math.max(-1, Math.min(1, ((e.clientX / w) - 0.5) * 2.2));
                this.gaze.y = Math.max(-1, Math.min(1, ((e.clientY / h) - 0.5) * 2.2));
                this.schedulePupilUpdate();
            }, { passive: true });

            // 启动自主随机眨眼循环 (每 3.2~5.5 秒眨一次眼)
            this.startBlinkLoop();
        },

        startBlinkLoop() {
            if (this.blinkTimer) clearTimeout(this.blinkTimer);
            const nextBlink = 3000 + Math.random() * 2500;
            this.blinkTimer = setTimeout(() => {
                this.isBlinking = true;
                this.updateLiveSvgEyes();
                setTimeout(() => {
                    this.isBlinking = false;
                    this.updateLiveSvgEyes();
                    this.startBlinkLoop();
                }, 160);
            }, nextBlink);
        },

        // 当播放语音时触发嘴巴动态开合
        setSpeaking(isSpeaking) {
            if (this.speakingInterval) {
                clearInterval(this.speakingInterval);
                this.speakingInterval = null;
            }
            if (isSpeaking) {
                this.speakingInterval = setInterval(() => {
                    this.speakingPhase = (this.speakingPhase + 1) % 3;
                    this.updateLiveSvgMouth();
                }, 130);
            } else {
                this.speakingPhase = 0;
                this.updateLiveSvgMouth();
            }
        },

        schedulePupilUpdate() {
            if (this._raf) return;
            this._raf = requestAnimationFrame(() => {
                this._raf = null;
                this.updateLiveSvgEyes();
            });
        },

        updateLiveSvgEyes() {
            const pupils = document.querySelectorAll('.pet-vector-pupil');
            const blinkCovers = document.querySelectorAll('.pet-vector-eyelid');
            const eyeX = this.gaze.x * 2.5;
            const eyeY = this.gaze.y * 2.2;

            pupils.forEach(p => {
                const baseCx = parseFloat(p.getAttribute('data-cx') || 0);
                const baseCy = parseFloat(p.getAttribute('data-cy') || 0);
                p.setAttribute('cx', (baseCx + eyeX).toFixed(1));
                p.setAttribute('cy', (baseCy + eyeY).toFixed(1));
            });

            blinkCovers.forEach(lid => {
                lid.style.opacity = this.isBlinking ? '1' : '0';
            });
        },

        updateLiveSvgMouth() {
            const mouths = document.querySelectorAll('.pet-vector-mouth');
            mouths.forEach(m => {
                const openD = m.getAttribute('data-open-d') || '';
                const closeD = m.getAttribute('data-close-d') || '';
                if (this.speakingPhase > 0 && openD) {
                    m.setAttribute('d', openD);
                } else if (closeD) {
                    m.setAttribute('d', closeD);
                }
            });
        },

        /**
         * 生成各物种在当前阶位与情绪下的纯矢量 SVG
         * @param {string} species 'fish' | 'crab' | 'shrimp' | 'octopus'
         * @param {number} stageIndex 0 ~ 4 (对应五阶觉醒)
         * @param {object} opts { emotion: 'normal'|'thinking'|'comfort'|'sleep'|'celebrate', width: 64, height: 64 }
         */
        renderSvg(species, stageIndex = 0, opts = {}) {
            const s = Math.max(0, Math.min(4, stageIndex));
            const emotion = opts.emotion || PetEmotionSystem.currentEmotion || 'normal';
            const w = opts.width || 68;
            const h = opts.height || 68;

            // 分配本实例专属唯一自增 UID，彻底规避跨组件 ID 冲突
            const uid = ++this.uidCounter;
            const gradId = `pet-grad-${species}-${s}-${uid}`;
            const filterId = `pet-glow-${species}-${uid}`;
            const baseColor = (this.BASE_COLORS[species] && this.BASE_COLORS[species][s]) || '#00B4D8';
            const gradConfig = (this.GRAD_STOPS[species]) || this.GRAD_STOPS.fish;

            let content = '';
            switch (species) {
                case 'crab':
                    content = this.buildCrabSvg(s, emotion, gradId, filterId, baseColor);
                    break;
                case 'shrimp':
                    content = this.buildShrimpSvg(s, emotion, gradId, filterId, baseColor);
                    break;
                case 'octopus':
                    content = this.buildOctopusSvg(s, emotion, gradId, filterId, baseColor);
                    break;
                case 'fish':
                default:
                    content = this.buildFishSvg(s, emotion, gradId, filterId, baseColor);
                    break;
            }

            return `
            <svg class="pet-vector-svg pet-vector-${species} stage-${s} emotion-${emotion}" 
                 viewBox="0 0 100 100" width="${w}" height="${h}" 
                 xmlns="http://www.w3.org/2000/svg" style="display:block; overflow:visible;">
                <defs>
                    <!-- 实例私有发光滤镜 -->
                    <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <!-- 实例私有光泽径向渐变 -->
                    <radialGradient id="${gradId}" cx="40%" cy="35%" r="65%">
                        <stop offset="0%" stop-color="${gradConfig.start[s]}" />
                        <stop offset="100%" stop-color="${gradConfig.end[s]}" />
                    </radialGradient>
                </defs>
                ${content}
            </svg>`.trim();
        },

        // --- 1.1 小泡鱼矢量组件 (FISH) ---
        buildFishSvg(stage, emotion, gradId, filterId, baseColor) {
            const isSleeping = emotion === 'sleep';
            const isThinking = emotion === 'thinking';
            const isComfort = emotion === 'comfort';
            const isCelebrate = emotion === 'celebrate';

            let extraDecor = '';
            if (stage === 1) { // 彩纹
                extraDecor = `<path d="M46 32 C54 44 54 58 46 70" stroke="#FFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.75" />
                              <path d="M56 34 C63 45 63 55 56 66" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6" />`;
            } else if (stage === 2) { // 刺刺河豚刺
                extraDecor = `
                    <polygon points="50,15 47,24 53,24" fill="#FFD166" />
                    <polygon points="28,26 36,31 33,37" fill="#FFD166" />
                    <polygon points="24,68 32,63 35,69" fill="#FFD166" />
                    <polygon points="50,85 47,76 53,76" fill="#FFD166" />
                `;
            } else if (stage === 3) { // 锦鲤龙须与金光
                extraDecor = `
                    <path d="M72 58 C78 62 82 56 86 52" stroke="#FFD166" stroke-width="2" fill="none" stroke-linecap="round" />
                    <circle cx="50" cy="50" r="44" stroke="#FFD166" stroke-width="1.5" stroke-dasharray="4 6" fill="none" opacity="0.6" class="pet-spin" />
                `;
            } else if (stage === 4) { // 九霄海龙神龙角与灵珠
                extraDecor = `
                    <path d="M40 25 C36 12 28 8 20 6 C24 16 32 20 38 27 Z" fill="#FFD166" />
                    <path d="M52 23 C56 10 64 6 72 4 C68 14 60 18 54 25 Z" fill="#FFD166" />
                    <path d="M74 56 C84 62 88 52 94 48" stroke="#FFD166" stroke-width="2.5" fill="none" stroke-linecap="round" />
                    <circle cx="86" cy="30" r="6" fill="#00F5D4" filter="url(#${filterId})" />
                `;
            }

            // 尾巴摆动 (双层：底层纯色基色 + 顶层独立渐变)
            const tail = `
                <g class="pet-fin-wag">
                    <path d="M25 50 C12 34 2 38 6 50 C2 62 12 66 25 50 Z" fill="${baseColor}" opacity="0.9" />
                    <path d="M25 50 C12 34 2 38 6 50 C2 62 12 66 25 50 Z" fill="url(#${gradId})" opacity="0.9" />
                    <path d="M45 24 C55 12 68 18 64 26 Z" fill="${baseColor}" opacity="0.8" />
                    <path d="M45 24 C55 12 68 18 64 26 Z" fill="url(#${gradId})" opacity="0.8" />
                </g>
            `;

            // 鱼身主体 (双层：底层纯色基色 + 顶层独立渐变)
            const rx = stage === 2 ? 34 : 32;
            const ry = stage === 2 ? 34 : 27;
            const body = `
                <ellipse cx="50" cy="50" rx="${rx}" ry="${ry}" fill="${baseColor}" />
                <ellipse cx="50" cy="50" rx="${rx}" ry="${ry}" fill="url(#${gradId})" />
                <path d="M35 34 C44 30 58 30 65 35" stroke="#FFF" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.45" />
            `;

            // 腮红
            const blush = `<circle cx="62" cy="56" r="4.5" fill="#FF70A6" opacity="${isComfort ? '0.85' : '0.5'}" />`;

            // 眼睛与眼珠
            const eyeHtml = isSleeping ? `
                <path d="M60 44 Q 67 49 74 44" stroke="#FFF" stroke-width="3" fill="none" stroke-linecap="round" />
                <text x="76" y="32" font-size="12" fill="#FFD166" font-family="sans-serif">💤</text>
            ` : `
                <circle cx="67" cy="42" r="9" fill="#FFF" />
                <circle cx="68" cy="42" r="5" fill="#1D3557" class="pet-vector-pupil" data-cx="68" data-cy="42" />
                <circle cx="70" cy="40" r="2" fill="#FFF" />
                <path d="M58 42 Q 67 47 76 42" stroke="#1D3557" stroke-width="3" fill="none" stroke-linecap="round" class="pet-vector-eyelid" style="opacity:0; transition:opacity 0.08s;" />
            `;

            // 嘴巴
            let mouthPath = 'M 78 52 Q 81 53 78 55';
            let openPath = 'M 76 50 Q 82 53 76 56 Z';
            if (isThinking) {
                mouthPath = 'M 76 53 Q 80 50 82 54';
            } else if (isCelebrate) {
                mouthPath = 'M 76 49 Q 82 53 76 57 Z';
            }

            const mouthHtml = `
                <path d="${mouthPath}" stroke="#1D3557" stroke-width="2.5" fill="${isCelebrate ? '#FF70A6' : 'none'}" 
                      stroke-linecap="round" class="pet-vector-mouth" data-species="fish"
                      data-close-d="${mouthPath}" data-open-d="${openPath}" />
            `;

            let emotionExtras = '';
            if (isThinking) {
                emotionExtras = `<circle cx="82" cy="30" r="3.5" fill="#FFF" opacity="0.8" />
                                 <circle cx="89" cy="22" r="5" fill="#FFF" opacity="0.9" />
                                 <text x="86" y="24" font-size="7" fill="#0077B6" font-weight="bold">?</text>`;
            } else if (isCelebrate) {
                emotionExtras = `<text x="42" y="20" font-size="14">✨</text>`;
            }

            return `<g class="pet-body-group">${tail}${body}${extraDecor}${blush}${eyeHtml}${mouthHtml}${emotionExtras}</g>`;
        },

        // --- 1.2 机灵蟹矢量组件 (CRAB) ---
        buildCrabSvg(stage, emotion, gradId, filterId, baseColor) {
            const isSleeping = emotion === 'sleep';
            const isCelebrate = emotion === 'celebrate';

            // 蟹腿 (双层实体底色 + 渐变笔触)
            const legs = `
                <g class="pet-crab-legs" stroke="${baseColor}" stroke-width="4.5" stroke-linecap="round" fill="none">
                    <path d="M30 60 C18 64 12 76 8 82" />
                    <path d="M34 66 C24 72 20 82 16 88" />
                    <path d="M70 60 C82 64 88 76 92 82" />
                    <path d="M66 66 C76 72 80 82 84 88" />
                </g>
                <g class="pet-crab-legs" stroke="url(#${gradId})" stroke-width="4.5" stroke-linecap="round" fill="none">
                    <path d="M30 60 C18 64 12 76 8 82" />
                    <path d="M34 66 C24 72 20 82 16 88" />
                    <path d="M70 60 C82 64 88 76 92 82" />
                    <path d="M66 66 C76 72 80 82 84 88" />
                </g>
            `;

            // 双螯剪刀 (双层实体底色 + 渐变)
            let claws = `
                <g class="pet-crab-claws">
                    <g transform="translate(14, 25)">
                        <path d="M12 25 C6 14 4 6 12 2 C16 10 18 16 14 25 Z" fill="${baseColor}" />
                        <path d="M12 25 C6 14 4 6 12 2 C16 10 18 16 14 25 Z" fill="url(#${gradId})" />
                        <path d="M14 25 C20 16 26 12 26 4 C18 6 14 12 14 25 Z" fill="${baseColor}" />
                        <path d="M14 25 C20 16 26 12 26 4 C18 6 14 12 14 25 Z" fill="url(#${gradId})" />
                        <circle cx="13" cy="25" r="4" fill="${baseColor}" />
                        <circle cx="13" cy="25" r="4" fill="url(#${gradId})" />
                    </g>
                    <g transform="translate(62, 25)">
                        <path d="M12 25 C6 16 2 12 2 4 C10 6 14 12 12 25 Z" fill="${baseColor}" />
                        <path d="M12 25 C6 16 2 12 2 4 C10 6 14 12 12 25 Z" fill="url(#${gradId})" />
                        <path d="M14 25 C20 14 22 6 14 2 C10 10 8 16 14 2 Z" fill="${baseColor}" />
                        <path d="M14 25 C20 14 22 6 14 2 C10 10 8 16 14 2 Z" fill="url(#${gradId})" />
                        <circle cx="13" cy="25" r="4" fill="${baseColor}" />
                        <circle cx="13" cy="25" r="4" fill="url(#${gradId})" />
                    </g>
                </g>
            `;

            let stageDecor = '';
            if (stage === 2) {
                stageDecor = `<path d="M38 28 L43 38 L50 30 L57 38 L62 28 L60 42 L40 42 Z" fill="#FFD700" stroke="#B8860B" stroke-width="1.5" />
                              <circle cx="50" cy="30" r="2" fill="#E63946" />`;
            } else if (stage === 3) {
                stageDecor = `<rect x="36" y="44" width="28" height="6" rx="3" fill="#00F5D4" filter="url(#${filterId})" opacity="0.85" />
                              <line x1="50" y1="52" x2="50" y2="68" stroke="#00F5D4" stroke-width="2" />`;
            } else if (stage === 4) {
                stageDecor = `<circle cx="50" cy="54" r="26" stroke="#E0AAFF" stroke-width="1.5" stroke-dasharray="3 5" fill="none" class="pet-spin" />
                              <text x="46" y="58" font-size="10">🌌</text>`;
            }

            // 蟹壳身体
            const body = `
                <ellipse cx="50" cy="56" rx="27" ry="20" fill="${baseColor}" />
                <ellipse cx="50" cy="56" rx="27" ry="20" fill="url(#${gradId})" />
                <path d="M36 50 C44 46 56 46 64 50" stroke="#FFF" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.4" />
            `;

            // 凸出眼柄与眼球
            const eyes = isSleeping ? `
                <circle cx="41" cy="38" r="7" fill="${baseColor}" />
                <circle cx="41" cy="38" r="7" fill="url(#${gradId})" />
                <circle cx="59" cy="38" r="7" fill="${baseColor}" />
                <circle cx="59" cy="38" r="7" fill="url(#${gradId})" />
                <path d="M37 38 Q 41 42 45 38" stroke="#FFF" stroke-width="2.5" fill="none" />
                <path d="M55 38 Q 59 42 63 38" stroke="#FFF" stroke-width="2.5" fill="none" />
                <text x="68" y="28" font-size="11">💤</text>
            ` : `
                <rect x="38" y="34" width="6" height="8" rx="3" fill="${baseColor}" />
                <rect x="38" y="34" width="6" height="8" rx="3" fill="url(#${gradId})" />
                <rect x="56" y="34" width="6" height="8" rx="3" fill="${baseColor}" />
                <rect x="56" y="34" width="6" height="8" rx="3" fill="url(#${gradId})" />
                <circle cx="41" cy="34" r="7.5" fill="#FFF" />
                <circle cx="59" cy="34" r="7.5" fill="#FFF" />
                <circle cx="41" cy="34" r="4.2" fill="#1D3557" class="pet-vector-pupil" data-cx="41" data-cy="34" />
                <circle cx="59" cy="34" r="4.2" fill="#1D3557" class="pet-vector-pupil" data-cx="59" data-cy="34" />
                <circle cx="43" cy="32" r="1.6" fill="#FFF" />
                <circle cx="61" cy="32" r="1.6" fill="#FFF" />
                <path d="M34 34 Q 41 38 48 34" stroke="#1D3557" stroke-width="2.5" fill="none" class="pet-vector-eyelid" style="opacity:0;" />
                <path d="M52 34 Q 59 38 66 34" stroke="#1D3557" stroke-width="2.5" fill="none" class="pet-vector-eyelid" style="opacity:0;" />
            `;

            const mouthPath = isCelebrate ? 'M 44 60 Q 50 67 56 60 Z' : 'M 45 61 Q 50 65 55 61';
            const openPath = 'M 44 59 Q 50 68 56 59 Z';
            const mouth = `
                <path d="${mouthPath}" stroke="#1D3557" stroke-width="2" fill="${isCelebrate ? '#FF70A6' : 'none'}" 
                      stroke-linecap="round" class="pet-vector-mouth" data-species="crab"
                      data-close-d="${mouthPath}" data-open-d="${openPath}" />
            `;

            return `<g class="pet-body-group">${legs}${claws}${body}${stageDecor}${eyes}${mouth}</g>`;
        },

        // --- 1.3 跳跳虾矢量组件 (SHRIMP) ---
        buildShrimpSvg(stage, emotion, gradId, filterId, baseColor) {
            const isSleeping = emotion === 'sleep';
            const isCelebrate = emotion === 'celebrate';

            // 触须
            const antennae = `
                <g class="pet-shrimp-antennae" stroke="${baseColor}" stroke-width="2" stroke-linecap="round" fill="none">
                    <path d="M56 30 C64 16 76 10 88 8" />
                    <path d="M54 26 C68 18 82 18 92 20" />
                </g>
                <g class="pet-shrimp-antennae" stroke="url(#${gradId})" stroke-width="2" stroke-linecap="round" fill="none">
                    <path d="M56 30 C64 16 76 10 88 8" />
                    <path d="M54 26 C68 18 82 18 92 20" />
                </g>
            `;

            // 弯曲虾节身段 (双层实体底色 + 渐变)
            const bodySegments = `
                <g class="pet-shrimp-body">
                    <path d="M22 66 C14 74 12 84 14 88 C20 86 28 80 30 72 Z" fill="${baseColor}" />
                    <path d="M22 66 C14 74 12 84 14 88 C20 86 28 80 30 72 Z" fill="url(#${gradId})" />
                    <path d="M20 74 C10 80 8 90 12 94 C18 90 24 84 26 76 Z" fill="${baseColor}" opacity="0.8" />
                    <path d="M20 74 C10 80 8 90 12 94 C18 90 24 84 26 76 Z" fill="url(#${gradId})" opacity="0.8" />
                    
                    <ellipse cx="32" cy="62" rx="14" ry="12" fill="${baseColor}" />
                    <ellipse cx="32" cy="62" rx="14" ry="12" fill="url(#${gradId})" />
                    <ellipse cx="40" cy="52" rx="15" ry="13" fill="${baseColor}" />
                    <ellipse cx="40" cy="52" rx="15" ry="13" fill="url(#${gradId})" />
                    <ellipse cx="48" cy="42" rx="16" ry="14" fill="${baseColor}" />
                    <ellipse cx="48" cy="42" rx="16" ry="14" fill="url(#${gradId})" />
                    
                    <circle cx="56" cy="34" r="14" fill="${baseColor}" />
                    <circle cx="56" cy="34" r="14" fill="url(#${gradId})" />
                </g>
            `;

            let stageDecor = '';
            if (stage === 1) {
                stageDecor = `<path d="M48 24 L64 24 L60 28 L46 28 Z" fill="#FFF" opacity="0.9" />`;
            } else if (stage === 2) {
                stageDecor = `<path d="M14 82 C6 86 2 96 6 100 C12 98 16 92 18 86 Z" fill="#FF4D6D" filter="url(#${filterId})" />`;
            } else if (stage === 3) {
                stageDecor = `<polygon points="52,18 46,26 52,26 48,34 58,24 52,24" fill="#FFEA00" />`;
            } else if (stage === 4) {
                stageDecor = `
                    <path d="M38 38 C28 24 16 20 8 22 C14 30 24 38 34 44 Z" fill="#FF758F" />
                    <path d="M44 48 C34 38 22 36 14 40 C20 46 28 52 38 56 Z" fill="#FFB703" />
                `;
            }

            const eye = isSleeping ? `
                <path d="M56 32 Q 62 36 66 32" stroke="#FFF" stroke-width="2.5" fill="none" />
                <text x="70" y="24" font-size="11">💤</text>
            ` : `
                <circle cx="60" cy="30" r="6.5" fill="#FFF" />
                <circle cx="61" cy="30" r="3.6" fill="#1D3557" class="pet-vector-pupil" data-cx="61" data-cy="30" />
                <circle cx="63" cy="28" r="1.4" fill="#FFF" />
                <path d="M54 30 Q 60 34 66 30" stroke="#1D3557" stroke-width="2.2" fill="none" class="pet-vector-eyelid" style="opacity:0;" />
            `;

            const mouthPath = isCelebrate ? 'M 64 38 Q 68 42 72 38 Z' : 'M 64 38 Q 68 41 71 38';
            const openPath = 'M 63 37 Q 68 43 72 37 Z';
            const mouth = `
                <path d="${mouthPath}" stroke="#1D3557" stroke-width="2" fill="${isCelebrate ? '#FF70A6' : 'none'}" 
                      stroke-linecap="round" class="pet-vector-mouth" data-species="shrimp"
                      data-close-d="${mouthPath}" data-open-d="${openPath}" />
            `;

            return `<g class="pet-body-group">${antennae}${bodySegments}${stageDecor}${eye}${mouth}</g>`;
        },

        // --- 1.4 皮皮章矢量组件 (OCTOPUS) ---
        buildOctopusSvg(stage, emotion, gradId, filterId, baseColor) {
            const isSleeping = emotion === 'sleep';
            const isCelebrate = emotion === 'celebrate';

            // 触手 (双层实体底色 + 渐变)
            const tentacles = `
                <g class="pet-octo-tentacles" stroke="${baseColor}" stroke-width="6.5" stroke-linecap="round" fill="none">
                    <path d="M30 62 C22 72 16 78 12 74 C8 70 14 62 20 62" />
                    <path d="M38 66 C32 80 26 88 22 84 C18 80 24 72 28 68" />
                    <path d="M46 68 C42 84 38 94 34 90 C30 86 36 78 40 72" />
                    <path d="M54 68 C58 84 62 94 66 90 C70 86 64 78 60 72" />
                    <path d="M62 66 C68 80 74 88 78 84 C82 80 76 72 72 68" />
                    <path d="M70 62 C78 72 84 78 88 74 C92 70 86 62 80 62" />
                </g>
                <g class="pet-octo-tentacles" stroke="url(#${gradId})" stroke-width="6.5" stroke-linecap="round" fill="none">
                    <path d="M30 62 C22 72 16 78 12 74 C8 70 14 62 20 62" />
                    <path d="M38 66 C32 80 26 88 22 84 C18 80 24 72 28 68" />
                    <path d="M46 68 C42 84 38 94 34 90 C30 86 36 78 40 72" />
                    <path d="M54 68 C58 84 62 94 66 90 C70 86 64 78 60 72" />
                    <path d="M62 66 C68 80 74 88 78 84 C82 80 76 72 72 68" />
                    <path d="M70 62 C78 72 84 78 88 74 C92 70 86 62 80 62" />
                </g>
            `;

            // 大圆脑袋 (双层实体底色 + 渐变)
            const head = `
                <ellipse cx="50" cy="46" rx="28" ry="24" fill="${baseColor}" />
                <ellipse cx="50" cy="46" rx="28" ry="24" fill="url(#${gradId})" />
                <path d="M36 34 C44 28 56 28 64 34" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.4" />
            `;

            let stageDecor = '';
            if (stage === 1) {
                stageDecor = `<rect x="30" y="38" width="40" height="14" rx="7" fill="none" stroke="#FFD166" stroke-width="3" />
                              <line x1="48" y1="45" x2="52" y2="45" stroke="#FFD166" stroke-width="3" />`;
            } else if (stage === 2) {
                stageDecor = `
                    <ellipse cx="50" cy="24" rx="22" ry="5" fill="#212529" />
                    <rect x="36" y="8" width="28" height="16" fill="#212529" />
                    <rect x="36" y="20" width="28" height="4" fill="#E63946" />
                `;
            } else if (stage === 3) {
                stageDecor = `
                    <circle cx="82" cy="56" r="10" fill="#48CAE4" filter="url(#${filterId})" opacity="0.85" />
                    <text x="78" y="60" font-size="9" fill="#FFF">🔮</text>
                `;
            } else if (stage === 4) {
                stageDecor = `
                    <polygon points="38,24 43,14 50,20 57,14 62,24" fill="#FFD700" stroke="#B8860B" stroke-width="1.2" />
                    <g transform="translate(80, 20)">
                        <line x1="0" y1="0" x2="0" y2="50" stroke="#FFD700" stroke-width="2.5" />
                        <path d="M-6 4 L-6 -6 L0 0 L6 -6 L6 4" stroke="#FFD700" stroke-width="2" fill="none" />
                    </g>
                `;
            }

            const eyes = isSleeping ? `
                <path d="M38 46 Q 44 51 50 46" stroke="#FFF" stroke-width="2.5" fill="none" />
                <path d="M52 46 Q 58 51 64 46" stroke="#FFF" stroke-width="2.5" fill="none" />
                <text x="68" y="34" font-size="11">💤</text>
            ` : `
                <circle cx="43" cy="46" r="8" fill="#FFF" />
                <circle cx="57" cy="46" r="8" fill="#FFF" />
                <circle cx="43" cy="46" r="4.2" fill="#1D3557" class="pet-vector-pupil" data-cx="43" data-cy="46" />
                <circle cx="57" cy="46" r="4.2" fill="#1D3557" class="pet-vector-pupil" data-cx="57" data-cy="46" />
                <circle cx="45" cy="44" r="1.6" fill="#FFF" />
                <circle cx="59" cy="44" r="1.6" fill="#FFF" />
                <path d="M36 46 Q 43 51 50 46" stroke="#1D3557" stroke-width="2.5" fill="none" class="pet-vector-eyelid" style="opacity:0;" />
                <path d="M50 46 Q 57 51 64 46" stroke="#1D3557" stroke-width="2.5" fill="none" class="pet-vector-eyelid" style="opacity:0;" />
            `;

            const mouthPath = isCelebrate ? 'M 46 54 Q 50 60 54 54 Z' : 'M 47 55 Q 50 58 53 55';
            const openPath = 'M 46 53 Q 50 61 54 53 Z';
            const mouth = `
                <path d="${mouthPath}" stroke="#1D3557" stroke-width="2" fill="${isCelebrate ? '#FF70A6' : 'none'}" 
                      stroke-linecap="round" class="pet-vector-mouth" data-species="octopus"
                      data-close-d="${mouthPath}" data-open-d="${openPath}" />
            `;

            return `<g class="pet-body-group">${tentacles}${head}${stageDecor}${eyes}${mouth}</g>`;
        }
    };
    // --- 2. 虚拟生命体与深度养成系统 (PET LIFE SYSTEM - MULTI-PET EDITION) ---
    const PetLifeSystem = {
        STORAGE_KEY: 'bingo_child_pet_v2',

        DEFAULT_PETS: {
            fish: { type: 'fish', customName: '纸灵锦', exp: 0, feedCount: 0, level: 1, equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(), bondExp: 0, bondLevel: 1, rebirthCount: 0, isNamed: false },
            crab: { type: 'crab', customName: '纸灵蟹', exp: 0, feedCount: 0, level: 1, equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(), bondExp: 0, bondLevel: 1, rebirthCount: 0, isNamed: false },
            shrimp: { type: 'shrimp', customName: '纸灵虾', exp: 0, feedCount: 0, level: 1, equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(), bondExp: 0, bondLevel: 1, rebirthCount: 0, isNamed: false },
            octopus: { type: 'octopus', customName: '纸灵章', exp: 0, feedCount: 0, level: 1, equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(), bondExp: 0, bondLevel: 1, rebirthCount: 0, isNamed: false },
            turtle: { type: 'turtle', customName: '纸灵龟', exp: 0, feedCount: 0, level: 1, equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(), bondExp: 0, bondLevel: 1, rebirthCount: 0, isNamed: false },
            jellyfish: { type: 'jellyfish', customName: '纸灵水母', exp: 0, feedCount: 0, level: 1, equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(), bondExp: 0, bondLevel: 1, rebirthCount: 0, isNamed: false },
            whale: { type: 'whale', customName: '纸灵鲸', exp: 0, feedCount: 0, level: 1, equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(), bondExp: 0, bondLevel: 1, rebirthCount: 0, isNamed: false }
        },

        init() {
            this.checkSatietyDecay();
            setInterval(() => this.checkSatietyDecay(), 60000); // 每一分钟自检一次
        },

        // 获取底层全部状态记录（含多宠物独立字典）
        _getFullStorage() {
            try {
                let parsed = null;
                const v2 = localStorage.getItem(this.STORAGE_KEY);
                if (v2) {
                    parsed = JSON.parse(v2);
                } else {
                    const v1 = localStorage.getItem('bingo_child_pet');
                    if (v1) parsed = JSON.parse(v1);
                }

                if (!parsed || typeof parsed !== 'object') {
                    parsed = {};
                }

                const activeType = parsed.activeType || parsed.type || 'fish';
                const shells = Math.max(0, parsed.shells ?? 20);

                let pets = {};
                if (parsed.pets && typeof parsed.pets === 'object') {
                    // 已是多宠物结构
                    pets = { ...parsed.pets };
                } else {
                    // 自动无损升级旧单体数据：将原有成长赋值给原出战宠物，其余宠物初始为萌宝
                    const oldType = parsed.type || 'fish';
                    pets[oldType] = {
                        type: oldType,
                        customName: parsed.customName || (oldType === 'crab' ? '纸灵蟹' : oldType === 'shrimp' ? '纸灵虾' : oldType === 'octopus' ? '纸灵章' : '纸灵锦'),
                        exp: parsed.exp || 0,
                        feedCount: parsed.feedCount || 0,
                        level: parsed.level || 1,
                        equippedStage: parsed.equippedStage ?? null,
                        satiety: Math.max(0, Math.min(100, parsed.satiety ?? 85)),
                        lastSatietyDecay: parsed.lastSatietyDecay || Date.now(),
                        bondExp: parsed.bondExp || 0,
                        bondLevel: parsed.bondLevel || 1,
                        rebirthCount: parsed.rebirthCount || 0,
                        isNamed: parsed.isNamed || Boolean(parsed.customName && parsed.customName !== this.DEFAULT_PETS[oldType].customName)
                    };
                }

                // 补齐四大海鲜灵兽槽位
                Object.keys(this.DEFAULT_PETS).forEach(key => {
                    if (!pets[key]) {
                        pets[key] = { ...this.DEFAULT_PETS[key], lastSatietyDecay: Date.now() };
                    } else {
                        const def = this.DEFAULT_PETS[key];
                        pets[key] = {
                            ...def,
                            ...pets[key],
                            type: key,
                            satiety: Math.max(0, Math.min(100, pets[key].satiety ?? 85)),
                            rebirthCount: Math.max(0, pets[key].rebirthCount || 0),
                            isNamed: pets[key].isNamed || Boolean(pets[key].customName && pets[key].customName !== def.customName)
                        };
                    }
                });

                return { activeType, shells, pets, skillsUsedInQuiz: parsed.skillsUsedInQuiz || 0 };
            } catch (e) {
                console.error('读取宠物生命体数据失败:', e);
                return {
                    activeType: 'fish',
                    shells: 20,
                    pets: { ...this.DEFAULT_PETS },
                    skillsUsedInQuiz: 0
                };
            }
        },

        // 获取出战宠物或指定宠物的独立数据
        getData(targetPetType) {
            const full = this._getFullStorage();
            const type = targetPetType || full.activeType || 'fish';
            const petRecord = full.pets[type] || { ...this.DEFAULT_PETS[type] };

            return {
                ...petRecord,
                activeType: full.activeType,
                shells: full.shells,
                skillsUsedInQuiz: full.skillsUsedInQuiz
            };
        },

        // 获取全部宠物的独立数据清单（供水族馆总览展厅使用）
        getAllPets() {
            const full = this._getFullStorage();
            return full.pets;
        },

        // 保存单个宠物的成长（自动同步回多宠存储体系）
        saveData(data) {
            try {
                if (!data || !data.type) return;
                const full = this._getFullStorage();
                const petType = data.type;

                full.activeType = petType;
                if (data._overrideShells !== undefined) full.shells = data._overrideShells;

                const existing = full.pets[petType];
                const def = this.DEFAULT_PETS[petType] || { customName: '纸灵伴学' };
                full.pets[petType] = {
                    type: petType,
                    customName: data.customName || (existing && existing.customName) || def.customName,
                    exp: data.exp || 0,
                    feedCount: data.feedCount || 0,
                    level: data.level || 1,
                    equippedStage: data.equippedStage ?? null,
                    satiety: Math.max(0, Math.min(100, data.satiety ?? 85)),
                    lastSatietyDecay: data.lastSatietyDecay || Date.now(),
                    bondExp: data.bondExp || 0,
                    bondLevel: data.bondLevel || 1,
                    rebirthCount: data.rebirthCount ?? (existing && existing.rebirthCount) ?? 0,
                    isNamed: data.isNamed ?? (existing && existing.isNamed) ?? false
                };

                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(full));

                // 同时同步一份当前出战宠物给兼容层
                localStorage.setItem('bingo_child_pet', JSON.stringify({
                    type: petType,
                    customName: full.pets[petType].customName,
                    exp: full.pets[petType].exp,
                    feedCount: full.pets[petType].feedCount,
                    level: full.pets[petType].level,
                    equippedStage: full.pets[petType].equippedStage,
                    rebirthCount: full.pets[petType].rebirthCount,
                    isNamed: full.pets[petType].isNamed
                }));
            } catch (e) {
                console.error('保存宠物生命体数据失败:', e);
            }
        },

        // 切换出战领航宠物
        switchActivePet(petId) {
            const full = this._getFullStorage();
            if (!this.DEFAULT_PETS[petId]) return;
            full.activeType = petId;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(full));
            this.saveData(full.pets[petId]);
        },

        // 灵兽涅槃重生（重新开始升级，累加转生印记，归零等级经验，保留贝壳币）
        rebirthPet(targetPetType, newName) {
            try {
                const full = this._getFullStorage();
                const petType = targetPetType || full.activeType || 'fish';
                if (!this.DEFAULT_PETS[petType]) return null;

                const defaultDef = this.DEFAULT_PETS[petType];
                const currentPet = full.pets[petType] || { ...defaultDef };
                const currentRebirthCount = currentPet.rebirthCount || 0;
                const finalName = (newName && newName.trim()) ? newName.trim() : defaultDef.customName;

                full.pets[petType] = {
                    ...defaultDef,
                    type: petType,
                    customName: finalName,
                    exp: 0,
                    feedCount: 0,
                    level: 1,
                    equippedStage: null,
                    satiety: 85,
                    lastSatietyDecay: Date.now(),
                    bondExp: currentPet.bondExp || 0,
                    bondLevel: currentPet.bondLevel || 1,
                    rebirthCount: currentRebirthCount + 1,
                    isNamed: true
                };

                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(full));
                this.saveData(full.pets[petType]);
                return full.pets[petType];
            } catch (e) {
                console.error('宠物重生失败:', e);
                return null;
            }
        },

        // 灵兽命名/改名
        renamePet(targetPetType, newName) {
            try {
                const full = this._getFullStorage();
                const petType = targetPetType || full.activeType || 'fish';
                if (!this.DEFAULT_PETS[petType]) return null;

                const defaultDef = this.DEFAULT_PETS[petType];
                const finalName = (newName && newName.trim()) ? newName.trim() : defaultDef.customName;

                if (!full.pets[petType]) {
                    full.pets[petType] = { ...defaultDef };
                }
                full.pets[petType].customName = finalName;
                full.pets[petType].isNamed = true;

                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(full));
                this.saveData(full.pets[petType]);
                return full.pets[petType];
            } catch (e) {
                console.error('宠物命名失败:', e);
                return null;
            }
        },

        // 检查学长照料经验加速光环 (Mentorship Bonus)
        getMentorshipBonus(currentPetType) {
            const full = this._getFullStorage();
            const curType = currentPetType || full.activeType;
            const currentPet = full.pets[curType];
            let maxOtherLevel = 0;
            let mentorPetName = '';

            Object.keys(full.pets).forEach(key => {
                if (key !== curType) {
                    const p = full.pets[key];
                    if ((p.level || 1) > maxOtherLevel) {
                        maxOtherLevel = p.level || 1;
                        mentorPetName = p.customName;
                    }
                }
            });

            // 若有其他灵兽达到 Lv.5 (深海巨擘) 以上，且当前灵兽等级落后，激活 +30% 学长经验加成
            if (maxOtherLevel >= 5 && (currentPet.level || 1) < maxOtherLevel) {
                return { active: true, bonusRate: 0.3, maxOtherLevel, mentorPetName };
            }
            return { active: false, bonusRate: 0, maxOtherLevel, mentorPetName: '' };
        },

        // 自然衰减机制：每在应用中活跃 15 分钟衰减 1 点饱腹度
        checkSatietyDecay() {
            const full = this._getFullStorage();
            const now = Date.now();
            let changed = false;

            Object.keys(full.pets).forEach(k => {
                const p = full.pets[k];
                const minutes = (now - (p.lastSatietyDecay || now)) / (1000 * 60);
                if (minutes >= 15) {
                    const drop = Math.floor(minutes / 15);
                    p.satiety = Math.max(10, p.satiety - drop);
                    p.lastSatietyDecay = now;
                    changed = true;
                }
            });

            if (changed) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(full));
                if (typeof updatePetWidgets === 'function') updatePetWidgets();
            }
        },

        // 答对投喂美食 (仅投喂当前出战灵兽)
        feed(foodBonus = 15) {
            const data = this.getData();
            const oldSatiety = data.satiety;
            data.satiety = Math.min(100, data.satiety + foodBonus);
            data.feedCount += 1;
            data.bondExp += 6;
            this.addShells(2); // 每做对一题获得 2 个贝壳币 (共享资产)

            // 亲密度等级算法
            const nextBondExp = data.bondLevel * 45;
            if (data.bondExp >= nextBondExp && data.bondLevel < 10) {
                data.bondLevel += 1;
                if (typeof PetSound !== 'undefined') PetSound.cheer();
                if (window.roamingPet) {
                    window.roamingPet.say(`💖 羁绊提升！${data.customName}与你达成 Lv.${data.bondLevel} 亲密搭档！`, 4200);
                }
            }

            this.saveData(data);
            return {
                satiety: data.satiety,
                satietyGained: data.satiety - oldSatiety,
                bondLevel: data.bondLevel,
                shells: this.getShells()
            };
        },

        // 获取当前共享贝壳币
        getShells() {
            const full = this._getFullStorage();
            return full.shells || 0;
        },

        // 增加共享贝壳币
        addShells(amount) {
            const full = this._getFullStorage();
            full.shells = Math.max(0, (full.shells || 0) + (amount || 0));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(full));
            return full.shells;
        },

        // 消耗贝壳币 (共享资产)
        spendShells(amount) {
            const full = this._getFullStorage();
            if (full.shells >= amount) {
                full.shells -= amount;
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(full));
                return true;
            }
            return false;
        }
    };

    // --- 3. 伴学战术神技系统 (PET QUIZ SKILLS) ---
    const PetSkillSystem = {
        SKILLS: {
            crab: {
                id: 'claw_snip',
                name: '双鳌破题',
                icon: '✂️',
                desc: '挥舞巨鳌，瞬间剪碎排除 1 个错误选项 (50/50 排除法)',
                maxUses: 2
            },
            fish: {
                id: 'koi_shield',
                name: '锦鲤结界',
                icon: '🫧',
                desc: '召唤水泡护盾，抵挡本次答错惩罚，并保住连胜！',
                maxUses: 1
            },
            shrimp: {
                id: 'hyper_boost',
                name: '疾风弹射',
                icon: '🚀',
                desc: '点燃火箭尾焰！接下来的 3 道题经验与贝壳收益翻倍！',
                maxUses: 1
            },
            octopus: {
                id: 'ink_scanner',
                name: '荧光题眼',
                icon: '💡',
                desc: '喷洒夜光墨水，智能圈出题干中的关键核心词',
                maxUses: 2
            },
            origami_koi: {
                id: 'origami_fold',
                name: '千纸开慧',
                icon: '🎋',
                desc: '翻折智慧纸笺，立刻点亮 1 个正确线索并为全场带来祥瑞纸花！',
                maxUses: 2
            },
            turtle: {
                id: 'shield_guard',
                name: '玄甲庇护',
                icon: '🛡️',
                desc: '召唤玄武晶盾，沉稳守护当前题目，若答错自动免除连胜中断！',
                maxUses: 2
            },
            jellyfish: {
                id: 'prism_glow',
                name: '幻光聚焦',
                icon: '🪼',
                desc: '释放柔和水母荧光，温柔照亮排除 1 个干扰选项！',
                maxUses: 2
            },
            whale: {
                id: 'wave_splash',
                name: '巨浪翻涌',
                icon: '🌊',
                desc: '引动渊海波涛，为小主人洗净思维浮躁，接下来的答题获得双倍收益！',
                maxUses: 1
            }
        },

        // 运行时状态
        activeEffects: {
            koiShieldActive: false,
            hyperBoostRemaining: 0
        },
        quizUsedCount: 0,

        resetQuizSkills() {
            this.activeEffects.koiShieldActive = false;
            this.activeEffects.hyperBoostRemaining = 0;
            this.quizUsedCount = 0;
            this.updateQuizSkillBtn();
        },

        getSkillDef(petType) {
            return this.SKILLS[petType] || this.SKILLS.fish;
        },

        canUseSkill(petType) {
            const def = this.getSkillDef(petType);
            return this.quizUsedCount < def.maxUses;
        },

        // 触发神技释放
        triggerSkill(petType) {
            if (!this.canUseSkill(petType)) {
                if (window.roamingPet) {
                    window.roamingPet.say('本局伴学技能次数已用完啦，小主人加油冲刺！💪', 3000);
                }
                return false;
            }

            const def = this.getSkillDef(petType);
            const activeCard = this.findActiveQuestionCard();
            if (!activeCard) {
                if (window.roamingPet) window.roamingPet.say('在答题界面才能使用伴学神技哟！🐾', 3000);
                return false;
            }

            this.quizUsedCount += 1;
            if (typeof PetSound !== 'undefined') PetSound.cheer();

            switch (petType) {
                case 'crab':
                    this.executeCrabSnip(activeCard);
                    break;
                case 'fish':
                    this.executeFishShield(activeCard);
                    break;
                case 'shrimp':
                    this.executeShrimpBoost();
                    break;
                case 'octopus':
                    this.executeOctoScanner(activeCard);
                    break;
                case 'origami_koi':
                    this.executeOrigamiFold(activeCard);
                    break;
                case 'turtle':
                    this.executeFishShield(activeCard);
                    if (window.roamingPet) {
                        window.roamingPet.say('🛡️ 玄武晶甲庇护已激活！心平气和，认真答题！🐢', 3800);
                    }
                    break;
                case 'jellyfish':
                    this.executeCrabSnip(activeCard);
                    if (window.roamingPet) {
                        window.roamingPet.say('🪼 幻光聚焦！柔美水母荧光照耀，排除一个干扰项！', 3800);
                    }
                    break;
                case 'whale':
                    this.executeShrimpBoost();
                    if (window.roamingPet) {
                        window.roamingPet.say('🌊 巨浪翻涌！乘风破浪，接下来收获双倍智慧与贝壳！🐳', 3800);
                    }
                    break;
            }

            this.updateQuizSkillBtn();
            return true;
        },

        findActiveQuestionCard() {
            const quizView = document.getElementById('view-quiz');
            if (!quizView || quizView.style.display === 'none') return null;
            // 找到当前视口内的题目卡片
            const cards = quizView.querySelectorAll('.ios-card');
            for (let c of cards) {
                const rect = c.getBoundingClientRect();
                if (rect.top >= -50 && rect.bottom <= window.innerHeight + 150) {
                    return c;
                }
            }
            return cards[0] || null;
        },

        // 🦀 机灵蟹技能：剪掉一个错误选项
        executeCrabSnip(card) {
            const qIdx = parseInt(card.id.replace('q-', ''), 10);
            if (isNaN(qIdx) || !window.currentQuiz || !window.currentQuiz[qIdx]) return;
            const qData = window.currentQuiz[qIdx];
            const correctAns = qData.a || '';

            // 查找未被剪掉且不是正确答案的选项行
            const rows = card.querySelectorAll('.option-row:not(.child-snipped):not(.child-correct)');
            const wrongRows = [];
            rows.forEach(r => {
                const optKey = r.querySelector('.m3-icon-badge')?.innerText?.trim() || '';
                if (optKey && !correctAns.includes(optKey)) {
                    wrongRows.push(r);
                }
            });

            if (wrongRows.length > 0) {
                const targetRow = wrongRows[Math.floor(Math.random() * wrongRows.length)];
                targetRow.classList.add('child-snipped');
                targetRow.style.transition = 'all 0.4s ease';
                targetRow.style.opacity = '0.35';
                targetRow.style.filter = 'grayscale(1)';
                targetRow.style.pointerEvents = 'none';

                // 播放剪刀音效与动画
                if (typeof PetSound !== 'undefined') PetSound.crabSnip();
                if (window.roamingPet) {
                    window.roamingPet.say('✂️ 咔嚓！机灵蟹巨鳌出击，排除一个干扰项！', 3800);
                    if (typeof PetVoice !== 'undefined') PetVoice.speak('咔嚓！排除一个错误答案！', 'crab');
                }
            }
        },

        // 🐟 小泡鱼技能：召唤锦鲤结界免除一次答错惩罚
        executeFishShield(card) {
            this.activeEffects.koiShieldActive = true;
            card.classList.add('pet-bubble-shield-active');
            if (typeof PetSound !== 'undefined') PetSound.multiBubble();
            if (window.roamingPet) {
                window.roamingPet.say('🫧 锦鲤结界展开！本题若答错将自动抵挡，保住连胜！', 4000);
                if (typeof PetVoice !== 'undefined') PetVoice.speak('锦鲤结界已开启，放心选吧！', 'fish');
            }
        },

        // 🦐 跳跳虾技能：疾风弹射 3 题经验与贝壳翻倍
        executeShrimpBoost() {
            this.activeEffects.hyperBoostRemaining = 3;
            if (typeof PetSound !== 'undefined') PetSound.shrimpSnap();
            if (window.roamingPet) {
                window.roamingPet.say('🚀 疾风弹射启动！接下来的 3 题经验与贝壳双倍入账！冲鸭！', 4000);
                if (typeof PetVoice !== 'undefined') PetVoice.speak('火箭推进启动！冲鸭！', 'shrimp');
            }
        },

        // 🐙 皮皮章技能：荧光题眼高亮题干核心词
        executeOctoScanner(card) {
            const titleEl = card.querySelector('.q-title-text') || card.querySelector('h3') || card.querySelector('.m3-headline-small');
            if (titleEl && !titleEl.getAttribute('data-scanned')) {
                titleEl.setAttribute('data-scanned', 'true');
                const rawText = titleEl.innerText;
                // 智能高亮关键字
                const highlighted = rawText.replace(/(不正确|正确|下列|属于|不属于|主要|最早|最晚|第[一二三四五]|哪一项|\d+)/g, 
                    '<mark class="pet-ink-mark" style="background:#48CAE4; color:#03045E; border-radius:4px; padding:2px 4px; font-weight:bold; box-shadow:0 0 8px rgba(72,202,228,0.8);">$1</mark>');
                titleEl.innerHTML = highlighted;

                if (typeof PetSound !== 'undefined') PetSound.suctionPop();
                if (window.roamingPet) {
                    window.roamingPet.say('💡 荧光墨水已高亮核心题眼！仔细看高亮词汇哦！', 3800);
                    if (typeof PetVoice !== 'undefined') PetVoice.speak('墨水为你标出重点啦！', 'octopus');
                }
            }
        },

        // 🎏 纸灵锦技能：翻折智慧纸笺，排除错误干扰
        executeOrigamiFold(card) {
            this.executeCrabSnip(card);
            if (typeof PetSound !== 'undefined' && typeof PetSound.paperRustle === 'function') {
                PetSound.paperRustle();
            }
            if (window.roamingPet) {
                window.roamingPet.say('🎋 灵纸翻折！为你排除一道迷障选项！', 3800);
                if (typeof PetVoice !== 'undefined') PetVoice.speak('灵纸翻折，答案浮现！', 'origami_koi');
            }
        },

        // 更新界面技能按钮状态
        updateQuizSkillBtn() {
            const btn = document.getElementById('pet-quiz-skill-btn');
            if (!btn) return;
            const petData = PetLifeSystem.getData();
            const def = this.getSkillDef(petData.type);
            const remaining = Math.max(0, def.maxUses - this.quizUsedCount);

            btn.innerHTML = `
                <span class="skill-icon" style="font-size:14px;">${def.icon}</span>
                <span class="skill-name" style="font-size:11px; font-weight:bold;">${def.name}</span>
                <span class="skill-badge" style="background:rgba(255,255,255,0.25); border-radius:8px; padding:1px 5px; font-size:10px;">${remaining}</span>
            `;

            if (remaining > 0) {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                btn.classList.add('skill-ready');
            } else {
                btn.style.opacity = '0.5';
                btn.classList.remove('skill-ready');
            }
        }
    };

    // --- 4. 情绪与情景感知引擎 (PET EMOTION SYSTEM) ---
    const PetEmotionSystem = {
        currentEmotion: 'normal', // normal | thinking | comfort | sleep | celebrate
        lingerTimer: null,

        init() {
            // 监听答题卡片停留，若思考超 7 秒未选，进入 PONDERING 认真陪读状态
            this.bindQuizLingerDetection();
        },

        setEmotion(emotion) {
            if (this.currentEmotion === emotion) return;
            this.currentEmotion = emotion;

            // 重新渲染漫游伴学精灵与挂件的 SVG
            if (window.roamingPet && typeof window.roamingPet.render === 'function') {
                window.roamingPet.render();
            }
        },

        bindQuizLingerDetection() {
            const onQuizActivity = () => {
                if (this.currentEmotion === 'thinking') {
                    this.setEmotion('normal');
                }
                if (this.lingerTimer) clearTimeout(this.lingerTimer);
                // 仅在答题界面下启动停留检测
                const quizView = document.getElementById('view-quiz');
                if (quizView && quizView.style.display !== 'none') {
                    this.lingerTimer = setTimeout(() => {
                        if (this.currentEmotion === 'normal') {
                            this.setEmotion('thinking');
                        }
                    }, 8000);
                }
            };

            window.addEventListener('pointerdown', onQuizActivity, { passive: true });
            window.addEventListener('keydown', onQuizActivity, { passive: true });
        }
    };

    // --- 5. 路线 B：高质感专业精灵序列帧引擎 (PET SPRITE SHEET ENGINE) ---
    const PetSpriteEngine = {
        STORAGE_MODE_KEY: 'bingo_child_pet_render_mode',
        currentAction: 'idle',
        actionTimer: null,

        // 默认内置全套清单 (开箱即用，离线即载)
        manifest: {
            basePath: './assets/pets/',
            species: {
                fish: {
                    name: '小泡鱼',
                    actions: {
                        idle: { frames: 4, fps: 4, file: 'fish/idle.svg', loop: true },
                        move: { frames: 6, fps: 8, file: 'fish/move.svg', loop: true },
                        think: { frames: 4, fps: 3, file: 'fish/think.svg', loop: true },
                        celebrate: { frames: 6, fps: 9, file: 'fish/celebrate.svg', loop: true },
                        sleep: { frames: 3, fps: 2, file: 'fish/sleep.svg', loop: true },
                        drag: { frames: 4, fps: 8, file: 'fish/drag.svg', loop: true }
                    }
                },
                crab: {
                    name: '机灵蟹',
                    actions: {
                        idle: { frames: 4, fps: 4, file: 'crab/idle.svg', loop: true },
                        move: { frames: 6, fps: 8, file: 'crab/move.svg', loop: true },
                        think: { frames: 4, fps: 3, file: 'crab/think.svg', loop: true },
                        celebrate: { frames: 6, fps: 9, file: 'crab/celebrate.svg', loop: true },
                        sleep: { frames: 3, fps: 2, file: 'crab/sleep.svg', loop: true },
                        drag: { frames: 4, fps: 8, file: 'crab/drag.svg', loop: true },
                        climb: { frames: 6, fps: 6, file: 'crab/climb.svg', loop: true }
                    }
                },
                shrimp: {
                    name: '跳跳虾',
                    actions: {
                        idle: { frames: 4, fps: 4, file: 'shrimp/idle.svg', loop: true },
                        move: { frames: 6, fps: 9, file: 'shrimp/move.svg', loop: true },
                        think: { frames: 4, fps: 3, file: 'shrimp/think.svg', loop: true },
                        celebrate: { frames: 6, fps: 9, file: 'shrimp/celebrate.svg', loop: true },
                        sleep: { frames: 3, fps: 2, file: 'shrimp/sleep.svg', loop: true },
                        drag: { frames: 4, fps: 8, file: 'shrimp/drag.svg', loop: true }
                    }
                },
                octopus: {
                    name: '皮皮章',
                    actions: {
                        idle: { frames: 4, fps: 4, file: 'octopus/idle.svg', loop: true },
                        move: { frames: 6, fps: 7, file: 'octopus/move.svg', loop: true },
                        think: { frames: 4, fps: 3, file: 'octopus/think.svg', loop: true },
                        celebrate: { frames: 6, fps: 9, file: 'octopus/celebrate.svg', loop: true },
                        sleep: { frames: 3, fps: 2, file: 'octopus/sleep.svg', loop: true },
                        drag: { frames: 4, fps: 8, file: 'octopus/drag.svg', loop: true }
                    }
                }
            }
        },

        init() {
            // 尝试异步加载远程/外部更新的 manifest.json（支持外部图包热插拔）
            try {
                fetch('./assets/pets/manifest.json')
                    .then(res => res.ok ? res.json() : null)
                    .then(data => {
                        if (data && data.species) {
                            this.manifest = Object.assign({}, this.manifest, data);
                        }
                    })
                    .catch(() => {});
            } catch (e) {}
        },

        getRenderMode() {
            // 默认启用路线 B (Sprite 模式)
            return localStorage.getItem(this.STORAGE_MODE_KEY) || 'sprite';
        },

        setRenderMode(mode) {
            if (mode !== 'vector' && mode !== 'sprite') mode = 'sprite';
            localStorage.setItem(this.STORAGE_MODE_KEY, mode);
            if (window.roamingPet && typeof window.roamingPet.render === 'function') {
                window.roamingPet.render();
            }
            if (typeof updatePetWidgets === 'function') {
                updatePetWidgets();
            }
            return mode;
        },

        getActionConf(species, action) {
            const spDef = this.manifest.species[species] || this.manifest.species.fish;
            return spDef.actions[action] || spDef.actions.idle;
        },

        // 调度全局精灵播放特定动作 (带有可选定时自动恢复 idle)
        setAction(action, duration = 0) {
            if (this.actionTimer) {
                clearTimeout(this.actionTimer);
                this.actionTimer = null;
            }
            this.currentAction = action;

            // 实时更新视口中的活动动作
            const viewports = document.querySelectorAll('.pet-sprite-viewport');
            viewports.forEach(vp => {
                const sp = vp.getAttribute('data-species') || 'fish';
                const conf = this.getActionConf(sp, action);
                vp.setAttribute('data-action', action);
                const img = vp.querySelector('.pet-sprite-sheet-img');
                if (img && conf) {
                    const src = `${this.manifest.basePath}${conf.file}`;
                    if (img.getAttribute('src') !== src) {
                        img.setAttribute('src', src);
                    }
                    const durationSec = (conf.frames / conf.fps).toFixed(2);
                    img.style.animationDuration = `${durationSec}s`;
                    img.style.animationTimingFunction = `steps(${conf.frames})`;
                }
            });

            if (duration > 0) {
                this.actionTimer = setTimeout(() => {
                    this.actionTimer = null;
                    this.setAction('idle');
                }, duration);
            }
        },

        // 五阶觉醒高阶光环与王冠法饰
        getStageDecor(stageIndex) {
            if (stageIndex <= 0) return '';
            if (stageIndex === 1) {
                return '<div class="pet-sprite-stage-glow stage-1" title="二阶·极光碧灵"></div>';
            } else if (stageIndex === 2) {
                return '<div class="pet-sprite-stage-crown stage-2" title="三阶·霸王金冠"><span class="crown-icon">👑</span></div>';
            } else if (stageIndex === 3) {
                return '<div class="pet-sprite-stage-orb stage-3" title="四阶·祥瑞灵珠"><span class="orb-icon">🔮</span></div>';
            } else if (stageIndex === 4) {
                return `
                    <div class="pet-sprite-stage-aura stage-4" title="五阶·九霄真龙">
                        <span class="cosmic-crown">🔱</span>
                        <div class="cosmic-ring ring-outer"></div>
                        <div class="cosmic-ring ring-inner"></div>
                        <span class="cosmic-sparkle">✨</span>
                    </div>
                `;
            }
            return '';
        },

        // 生成高质感精灵视口 HTML
        renderAvatar(species = 'fish', stageIndex = 0, opts = {}) {
            const sp = this.manifest.species[species] ? species : 'fish';
            let action = opts.action;
            if (!action) {
                const emotion = opts.emotion || PetEmotionSystem.currentEmotion || 'normal';
                if (emotion === 'sleep') action = 'sleep';
                else if (emotion === 'thinking') action = 'think';
                else if (emotion === 'celebrate') action = 'celebrate';
                else action = this.currentAction || 'idle';
            }

            const conf = this.getActionConf(sp, action);
            const w = opts.width || 68;
            const h = opts.height || 68;
            const s = Math.max(0, Math.min(4, stageIndex));
            const src = `${this.manifest.basePath}${conf.file}`;
            const durationSec = (conf.frames / conf.fps).toFixed(2);
            const decor = this.getStageDecor(s);

            return `
                <div class="pet-sprite-viewport species-${sp} action-${action} stage-${s}" 
                     data-species="${sp}" data-action="${action}" data-stage="${s}"
                     style="width:${w}px; height:${h}px;" title="${this.manifest.species[sp].name} (第${s + 1}阶)">
                    <div class="pet-sprite-actor stage-${s}" style="width:${w}px; height:${h}px;">
                        <img class="pet-sprite-sheet-img" src="${src}" alt="${sp}" draggable="false"
                             style="height:100%; max-width:none; width:auto; animation-duration:${durationSec}s; animation-timing-function:steps(${conf.frames});" />
                    </div>
                    ${decor}
                </div>
            `.trim();
        }
    };

        // --- 6. 现代微立体几何切面折纸引擎 (FACETED LOW-POLY ORIGAMI ENGINE - 20 MODELS) ---
    const PetOrigamiEngine = {
        uidCounter: 0,

        get_fish_stage_0(uid) {
            return `<!-- Fish Stage 0: 萌动小纸苗 (四角折纸灵雏) -->
        <polygon points="80,50 48,30 48,50" fill="#A7F3D0" />
        <polygon points="80,50 48,50 48,70" fill="#10B981" />
        <polygon points="48,30 48,50 26,50" fill="#34D399" />
        <polygon points="48,50 48,70 26,50" fill="#059669" />
        <polygon points="26,50 10,32 18,50" fill="#6EE7B7" />
        <polygon points="26,50 18,50 10,68" fill="#047857" />
        <line x1="80" y1="50" x2="18" y2="50" stroke="#FFFFFF" stroke-width="1.1" stroke-dasharray="2.5,1.5" stroke-linecap="round" />
        <line x1="48" y1="30" x2="48" y2="70" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" stroke-linecap="round" />
        <polygon points="66,45 69,47 66,49 63,47" fill="#FFFFFF" />
        <polygon points="66,46 67.5,47 66,48 64.5,47" fill="#065F46" />`;
        },

        get_fish_stage_1(uid) {
            return `<!-- Fish Stage 1: 几何切面鱼 (六棱极光灵鱼) -->
        <polygon points="86,50 64,36 68,50" fill="#A5F3FC" />
        <polygon points="86,50 68,50 64,64" fill="#0891B2" />
        <polygon points="64,36 40,24 44,50 68,50" fill="#38BDF8" />
        <polygon points="64,64 68,50 44,50 40,76" fill="#0284C7" />
        <polygon points="40,24 20,50 44,50" fill="#0284C7" />
        <polygon points="40,76 44,50 20,50" fill="#0369A1" />
        <polygon points="40,24 32,8 36,26" fill="#BAE6FD" />
        <polygon points="36,26 32,8 26,30" fill="#38BDF8" />
        <polygon points="20,50 4,24 12,42" fill="#7DD3FC" />
        <polygon points="20,50 12,42 8,50" fill="#0284C7" />
        <polygon points="20,50 8,50 12,58" fill="#0369A1" />
        <polygon points="20,50 12,58 4,76" fill="#075985" />
        <polyline points="86,50 68,50 44,50 20,50 8,50" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="2.5,1.5" stroke-linecap="round" />
        <line x1="64" y1="36" x2="64" y2="64" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" stroke-linecap="round" />
        <line x1="40" y1="24" x2="40" y2="76" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" stroke-linecap="round" />
        <polygon points="72,44 76,47 72,50 68,47" fill="#FFFFFF" />
        <polygon points="72,45 74.5,47 72,49 69.5,47" fill="#0369A1" />`;
        },

        get_fish_stage_2(uid) {
            return `<!-- Fish Stage 2: 立体千羽鱼 (三阶·展翼霸主) -->
        <polygon points="62,18 68,8 74,18 68,14" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <polygon points="56,22 62,18 65,23" fill="#F59E0B" />
        <polygon points="74,18 80,22 71,23" fill="#D97706" />
        <polygon points="86,50 66,32 70,50" fill="#C7D2FE" />
        <polygon points="86,50 70,50 66,68" fill="#6366F1" />
        <polygon points="66,32 44,20 48,50 70,50" fill="#818CF8" />
        <polygon points="66,68 70,50 48,50 44,80" fill="#4F46E5" />
        <polygon points="44,20 22,50 48,50" fill="#4338CA" />
        <polygon points="44,80 48,50 22,50" fill="#312E81" />
        <polygon points="48,50 34,4 40,24" fill="#A5B4FC" />
        <polygon points="48,50 40,24 44,20" fill="#6366F1" />
        <polygon points="34,4 24,14 40,24" fill="#C7D2FE" />
        <polygon points="48,50 44,80 40,76" fill="#3730A3" />
        <polygon points="48,50 40,76 34,96" fill="#4F46E5" />
        <polygon points="34,96 24,86 40,76" fill="#312E81" />
        <polygon points="22,50 2,20 12,40" fill="#818CF8" />
        <polygon points="22,50 12,40 6,50" fill="#4F46E5" />
        <polygon points="22,50 6,50 12,60" fill="#4338CA" />
        <polygon points="22,50 12,60 2,80" fill="#312E81" />
        <polyline points="86,50 70,50 48,50 22,50 6,50" stroke="#FDE047" stroke-width="1.3" stroke-dasharray="3,1.5" stroke-linecap="round" />
        <polygon points="74,43 78,47 74,51 70,47" fill="#FFFFFF" />
        <polygon points="74,44.5 76.5,47 74,49.5 71.5,47" fill="#312E81" />`;
        },

        get_fish_stage_3(uid) {
            return `<!-- Fish Stage 3: 烫金和风锦 (四阶·朱红烈焰金箔锦鲤) -->
        <g class="origami-floating-orb">
            <polygon points="0,-8 6,-3 6,3 0,8 -6,3 -6,-3" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
            <polygon points="0,-8 0,0 6,-3" fill="#FFFBEB" />
            <polygon points="6,-3 0,0 6,3" fill="#FBBF24" />
            <polygon points="6,3 0,0 0,8" fill="#F59E0B" />
            <polygon points="0,8 0,0 -6,3" fill="#D97706" />
            <polygon points="-6,3 0,0 -6,-3" fill="#B45309" />
            <polygon points="-6,-3 0,0 0,-8" fill="#FDE68A" />
        </g>
        <polygon points="88,50 66,30 72,50" fill="#FDA4AF" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="88,50 72,50 66,70" fill="#E11D48" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="66,30 42,16 48,50 72,50" fill="#F43F5E" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="66,70 72,50 48,50 42,84" fill="#BE123C" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="42,16 20,50 48,50" fill="#E11D48" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="42,84 48,50 20,50" fill="#9F1239" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="66,30 52,6 56,26" fill="#FBBF24" stroke="#D97706" stroke-width="0.8" />
        <polygon points="66,70 56,74 52,94" fill="#F59E0B" stroke="#B45309" stroke-width="0.8" />
        <polygon points="20,50 0,16 8,36" fill="#FB7185" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="20,50 8,36 4,46" fill="#F43F5E" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="20,50 4,46 4,54" fill="#FBBF24" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="20,50 4,54 8,64" fill="#E11D48" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="20,50 8,64 0,84" fill="#9F1239" stroke="#FBBF24" stroke-width="0.8" />
        <polyline points="88,50 72,50 48,50 20,50 4,50" stroke="#FFFBEB" stroke-width="1.6" stroke-dasharray="3,1" stroke-linecap="round" />
        <polygon points="76,43 81,47 76,51 71,47" fill="#FFFFFF" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="76,44.5 79,47 76,49.5 73,47" fill="#881337" />`;
        },

        get_fish_stage_4(uid) {
            return `<!-- Fish Stage 4: 九天折纸龙 (五阶·全息全真神龙觉醒) -->
        <g class="origami-cosmic-ring ring-outer">
            <polygon points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                     fill="none" stroke="#FBBF24" stroke-width="1.4" stroke-dasharray="4,2.5" />
        </g>
        <g class="origami-cosmic-ring ring-inner">
            <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
                     fill="none" stroke="#22D3EE" stroke-width="1.2" stroke-dasharray="3,2" />
        </g>
        <polygon points="68,26 76,6 72,22" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <polygon points="76,6 84,10 75,20" fill="#F59E0B" />
        <polygon points="60,28 58,10 63,22" fill="#FBBF24" />
        <polyline points="88,54 96,62 92,72 98,78" fill="none" stroke="#FDE047" stroke-width="1.2" stroke-linecap="round" />
        <polygon points="90,48 72,28 76,48" fill="#67E8F9" />
        <polygon points="90,48 76,48 84,62 88,54" fill="#06B6D4" />
        <polygon points="76,48 84,62 70,68 68,52" fill="#0891B2" />
        <polygon points="72,28 52,16 56,42 76,48" fill="#C084FC" />
        <polygon points="68,52 56,42 48,68 64,74" fill="#9333EA" />
        <polygon points="52,16 32,24 38,48 56,42" fill="#F472B6" />
        <polygon points="56,42 38,48 30,72 48,68" fill="#DB2777" />
        <polygon points="32,24 16,42 38,48" fill="#FBBF24" />
        <polygon points="38,48 16,42 18,66 30,72" fill="#D97706" />
        <polygon points="16,42 0,28 8,46" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="16,42 8,46 2,54" fill="#F43F5E" stroke="#E11D48" stroke-width="0.8" />
        <polygon points="16,42 2,54 6,64" fill="#C084FC" stroke="#9333EA" stroke-width="0.8" />
        <polygon points="16,42 6,64 0,76" fill="#22D3EE" stroke="#0891B2" stroke-width="0.8" />
        <polyline points="90,48 76,48 56,42 38,48 16,42 2,54" stroke="#FFFBEB" stroke-width="1.8" stroke-dasharray="3,1.5" stroke-linecap="round" />
        <polygon points="86,22 88,20 90,22 88,24" fill="#FDE047" />
        <polygon points="14,20 16,18 18,20 16,22" fill="#67E8F9" />
        <polygon points="22,86 24,84 26,86 24,88" fill="#F472B6" />
        <polygon points="80,42 85,45 80,48 75,45" fill="#FFFFFF" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="80,43.5 83,45 80,46.5 77,45" fill="#581C87" />`;
        },

        get_crab_stage_0(uid) {
            return `<!-- Crab Stage 0: 纸灵幼蟹 (方块六角豆蟹) -->
        <polygon points="50,28 66,36 66,62 50,72 34,62 34,36" fill="#FB923C" />
        <polygon points="50,28 66,36 50,50" fill="#FDBA74" />
        <polygon points="50,28 50,50 34,36" fill="#F97316" />
        <polygon points="34,36 50,50 34,62" fill="#EA580C" />
        <polygon points="66,36 66,62 50,50" fill="#C2410C" />
        <polygon points="34,62 50,50 50,72" fill="#9A3412" />
        <!-- 左小剪刀 -->
        <polygon points="34,36 16,24 22,40" fill="#F97316" />
        <polygon points="34,36 22,40 26,44" fill="#C2410C" />
        <!-- 右小剪刀 -->
        <polygon points="66,36 84,24 78,40" fill="#FDBA74" />
        <polygon points="66,36 78,40 74,44" fill="#EA580C" />
        <!-- 折纸足肢 -->
        <polygon points="34,50 20,58 34,58" fill="#C2410C" />
        <polygon points="34,60 22,72 34,68" fill="#9A3412" />
        <polygon points="66,50 80,58 66,58" fill="#EA580C" />
        <polygon points="66,60 78,72 66,68" fill="#C2410C" />
        <!-- 折痕骨架 -->
        <line x1="50" y1="28" x2="50" y2="72" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="2,1.5" />
        <line x1="34" y1="50" x2="66" y2="50" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" />
        <!-- 眼睛 -->
        <polygon points="44,22 47,25 44,28 41,25" fill="#FFFFFF" />
        <polygon points="44,23.5 45.5,25 44,26.5 42.5,25" fill="#7C2D12" />
        <polygon points="56,22 59,25 56,28 53,25" fill="#FFFFFF" />
        <polygon points="56,23.5 57.5,25 56,26.5 54.5,25" fill="#7C2D12" />`;
        },

        get_crab_stage_1(uid) {
            return `<!-- Crab Stage 1: 棱角双钳蟹 (折纸铁甲重钳) -->
        <!-- 甲壳主面 (八棱切面) -->
        <polygon points="50,22 72,32 72,62 50,74 28,62 28,32" fill="#F97316" />
        <polygon points="50,22 72,32 50,48" fill="#FED7AA" />
        <polygon points="50,22 50,48 28,32" fill="#FB923C" />
        <polygon points="28,32 50,48 28,62" fill="#EA580C" />
        <polygon points="72,32 72,62 50,48" fill="#C2410C" />
        <polygon points="28,62 50,48 50,74" fill="#9A3412" />
        <polygon points="50,74 50,48 72,62" fill="#7C2D12" />
        <!-- 强力折纸左鳌 -->
        <polygon points="28,32 10,14 18,34" fill="#F87171" />
        <polygon points="10,14 6,24 18,34" fill="#DC2626" />
        <polygon points="28,32 18,34 22,46" fill="#991B1B" />
        <!-- 强力折纸右鳌 -->
        <polygon points="72,32 90,14 82,34" fill="#FCA5A5" />
        <polygon points="90,14 94,24 82,34" fill="#EF4444" />
        <polygon points="72,32 82,34 78,46" fill="#B91C1C" />
        <!-- 侧足切面 -->
        <polygon points="28,46 12,56 26,56" fill="#EA580C" />
        <polygon points="28,58 14,74 26,68" fill="#C2410C" />
        <polygon points="72,46 88,56 74,56" fill="#F97316" />
        <polygon points="72,58 86,74 74,68" fill="#EA580C" />
        <!-- 折痕线 -->
        <polyline points="50,22 50,48 50,74" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="3,1.5" />
        <line x1="28" y1="48" x2="72" y2="48" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" />
        <!-- 双眼 -->
        <polygon points="42,16 46,20 42,24 38,20" fill="#FFFFFF" />
        <polygon points="42,18 44,20 42,22 40,20" fill="#991B1B" />
        <polygon points="58,16 62,20 58,24 54,20" fill="#FFFFFF" />
        <polygon points="58,18 60,20 58,22 56,20" fill="#991B1B" />`;
        },

        get_crab_stage_2(uid) {
            return `<!-- Crab Stage 2: 金冠赤甲帝王蟹 (三阶·黄金霸王鳌) -->
        <!-- 折纸王者金冠 👑 -->
        <polygon points="44,14 50,4 56,14 50,10" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <polygon points="38,18 44,14 47,19" fill="#F59E0B" />
        <polygon points="56,14 62,18 53,19" fill="#D97706" />
        <!-- 主躯干厚重晶面 -->
        <polygon points="50,18 76,28 76,64 50,76 24,64 24,28" fill="#EF4444" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="50,18 76,28 50,46" fill="#FCA5A5" />
        <polygon points="50,18 50,46 24,28" fill="#F87171" />
        <polygon points="24,28 50,46 24,64" fill="#DC2626" />
        <polygon points="76,28 76,64 50,46" fill="#B91C1C" />
        <polygon points="24,64 50,46 50,76" fill="#991B1B" />
        <polygon points="50,76 50,46 76,64" fill="#7F1D1D" />
        <!-- 黄金切面大双鳌 -->
        <polygon points="24,28 6,8 16,30" fill="#FDE047" stroke="#D97706" stroke-width="0.8" />
        <polygon points="6,8 2,18 16,30" fill="#F59E0B" />
        <polygon points="24,28 16,30 20,44" fill="#B45309" />
        <polygon points="76,28 94,8 84,30" fill="#FFFBEB" stroke="#D97706" stroke-width="0.8" />
        <polygon points="94,8 98,18 84,30" fill="#FDE047" />
        <polygon points="76,28 84,30 80,44" fill="#D97706" />
        <!-- 侧足三联折纸 -->
        <polygon points="24,44 6,52 20,54" fill="#DC2626" />
        <polygon points="24,54 8,68 20,64" fill="#B91C1C" />
        <polygon points="24,64 12,82 22,74" fill="#991B1B" />
        <polygon points="76,44 94,52 80,54" fill="#EF4444" />
        <polygon points="76,54 92,68 80,64" fill="#DC2626" />
        <polygon points="76,64 88,82 78,74" fill="#B91C1C" />
        <!-- 黄金主折脊线 -->
        <polyline points="50,18 50,46 50,76" stroke="#FDE047" stroke-width="1.4" stroke-dasharray="3,1.5" />
        <!-- 双眼 -->
        <polygon points="40,14 44,18 40,22 36,18" fill="#FFFFFF" />
        <polygon points="40,16 42,18 40,20 38,18" fill="#D97706" />
        <polygon points="60,14 64,18 60,22 56,18" fill="#FFFFFF" />
        <polygon points="60,16 62,18 60,20 58,18" fill="#D97706" />`;
        },

        get_crab_stage_3(uid) {
            return `<!-- Crab Stage 3: 机甲多棱暴风蟹 (四阶·钛晶光刃神鳌) -->
        <!-- 浮动折纸光棱护盾 (左上方旋转) -->
        <g class="origami-floating-orb" transform="translate(18, 16)">
            <polygon points="0,-8 7,-4 7,4 0,8 -7,4 -7,-4" fill="#A855F7" stroke="#FBBF24" stroke-width="0.8" />
            <polygon points="0,-8 0,0 7,-4" fill="#E9D5FF" />
            <polygon points="7,-4 0,0 7,4" fill="#C084FC" />
            <polygon points="7,4 0,0 0,8" fill="#A855F7" />
            <polygon points="0,8 0,0 -7,4" fill="#7E22CE" />
            <polygon points="-7,4 0,0 -7,-4" fill="#581C87" />
            <polygon points="-7,-4 0,0 0,-8" fill="#C084FC" />
        </g>
        <!-- 主躯干钛晶紫金折甲 -->
        <polygon points="50,16 78,26 80,64 50,78 20,64 22,26" fill="#8B5CF6" stroke="#FBBF24" stroke-width="0.9" />
        <polygon points="50,16 78,26 50,44" fill="#DDD6FE" />
        <polygon points="50,16 50,44 22,26" fill="#A78BFA" />
        <polygon points="22,26 50,44 20,64" fill="#7C3AED" />
        <polygon points="78,26 80,64 50,44" fill="#6D28D9" />
        <polygon points="20,64 50,44 50,78" fill="#5B21B6" />
        <polygon points="50,78 50,44 80,64" fill="#4C1D95" />
        <!-- 等离子多棱巨双鳌 (刀锋展开) -->
        <polygon points="22,26 2,4 12,28" fill="#F43F5E" stroke="#FBBF24" stroke-width="0.9" />
        <polygon points="2,4 0,16 12,28" fill="#E11D48" />
        <polygon points="22,26 12,28 16,42" fill="#BE123C" />
        <polygon points="78,26 98,4 88,28" fill="#FB7185" stroke="#FBBF24" stroke-width="0.9" />
        <polygon points="98,4 100,16 88,28" fill="#F43F5E" />
        <polygon points="78,26 88,28 84,42" fill="#E11D48" />
        <!-- 折纸战甲侧刃 -->
        <polygon points="20,44 4,52 18,54" fill="#7C3AED" stroke="#FBBF24" stroke-width="0.6" />
        <polygon points="20,54 4,68 18,64" fill="#6D28D9" />
        <polygon points="20,64 8,82 20,74" fill="#5B21B6" />
        <polygon points="80,44 96,52 82,54" fill="#8B5CF6" stroke="#FBBF24" stroke-width="0.6" />
        <polygon points="80,54 96,68 82,64" fill="#7C3AED" />
        <polygon points="80,64 92,82 80,74" fill="#6D28D9" />
        <!-- 烫金能量脊梁 -->
        <polyline points="50,16 50,44 50,78" stroke="#FDE047" stroke-width="1.6" stroke-dasharray="3,1" />
        <!-- 双眼 -->
        <polygon points="38,12 43,16 38,20 33,16" fill="#22D3EE" />
        <polygon points="62,12 67,16 62,20 57,16" fill="#22D3EE" />`;
        },

        get_crab_stage_4(uid) {
            return `<!-- Crab Stage 4: 星穹裂空神鳌 (五阶·宇宙真神巨鳌) -->
        <!-- 外层十二边形全息神圣星环 -->
        <g class="origami-cosmic-ring ring-outer">
            <polygon points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                     fill="none" stroke="#FBBF24" stroke-width="1.4" stroke-dasharray="4,2.5" />
        </g>
        <g class="origami-cosmic-ring ring-inner">
            <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
                     fill="none" stroke="#A855F7" stroke-width="1.2" stroke-dasharray="3,2" />
        </g>
        <!-- 巨鳌王冠 -->
        <polygon points="44,10 50,0 56,10 50,6" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <!-- 星穹主甲 -->
        <polygon points="50,14 80,24 82,64 50,80 18,64 20,24" fill="#6366F1" stroke="#FDE047" stroke-width="1" />
        <polygon points="50,14 80,24 50,44" fill="#C7D2FE" />
        <polygon points="50,14 50,44 20,24" fill="#818CF8" />
        <polygon points="20,24 50,44 18,64" fill="#4F46E5" />
        <polygon points="80,24 82,64 50,44" fill="#4338CA" />
        <polygon points="18,64 50,44 50,80" fill="#3730A3" />
        <polygon points="50,80 50,44 82,64" fill="#312E81" />
        <!-- 宇宙裂空巨鳌 (横跨天际) -->
        <polygon points="20,24 0,0 12,28" fill="#FDE047" stroke="#F59E0B" stroke-width="1" />
        <polygon points="0,0 0,16 12,28" fill="#F43F5E" />
        <polygon points="20,24 12,28 16,42" fill="#E11D48" />
        <polygon points="80,24 100,0 88,28" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1" />
        <polygon points="100,0 100,16 88,28" fill="#FBBF24" />
        <polygon points="80,24 88,28 84,42" fill="#D97706" />
        <!-- 六足神晶刃 -->
        <polygon points="18,44 2,52 16,54" fill="#A855F7" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="18,54 2,68 16,64" fill="#9333EA" />
        <polygon points="18,64 6,82 18,74" fill="#7E22CE" />
        <polygon points="82,44 98,52 84,54" fill="#22D3EE" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="82,54 98,68 84,64" fill="#06B6D4" />
        <polygon points="82,64 94,82 82,74" fill="#0891B2" />
        <!-- 贯穿全息脊梁 -->
        <polyline points="50,14 50,44 50,80" stroke="#FFFBEB" stroke-width="1.8" stroke-dasharray="3,1" />
        <!-- 散落全息折纸小星芒 -->
        <polygon points="88,20 90,18 92,20 90,22" fill="#FDE047" />
        <polygon points="10,20 12,18 14,20 12,22" fill="#22D3EE" />
        <polygon points="22,86 24,84 26,86 24,88" fill="#F472B6" />
        <!-- 神威双目 -->
        <polygon points="38,10 43,14 38,18 33,14" fill="#FDE047" />
        <polygon points="62,10 67,14 62,18 57,14" fill="#FDE047" />`;
        },

        get_shrimp_stage_0(uid) {
            return `<!-- Shrimp Stage 0: 弯折小纸虾 (三段式软萌纸虾) -->
        <!-- 头部前节 -->
        <polygon points="76,38 58,26 62,48" fill="#F472B6" />
        <polygon points="76,38 62,48 70,54" fill="#DB2777" />
        <!-- 躯干中节 -->
        <polygon points="58,26 40,32 44,52 62,48" fill="#FB7185" />
        <!-- 腹部后节 -->
        <polygon points="40,32 24,46 28,62 44,52" fill="#E11D48" />
        <!-- 尾扇双折纸 -->
        <polygon points="24,46 8,56 18,60" fill="#FDA4AF" />
        <polygon points="24,46 18,60 14,70 28,62" fill="#BE123C" />
        <!-- 虾须几何折线 -->
        <polyline points="76,38 88,26 96,16" stroke="#F472B6" stroke-width="1" stroke-linecap="round" fill="none" />
        <polyline points="76,38 88,32 94,24" stroke="#FB7185" stroke-width="0.8" stroke-linecap="round" fill="none" />
        <!-- 折痕骨架 -->
        <line x1="62" y1="48" x2="44" y2="52" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" />
        <line x1="44" y1="52" x2="28" y2="62" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" />
        <!-- 眼睛 -->
        <polygon points="66,35 69,38 66,41 63,38" fill="#FFFFFF" />
        <polygon points="66,36.5 67.5,38 66,39.5 64.5,38" fill="#881337" />`;
        },

        get_shrimp_stage_1(uid) {
            return `<!-- Shrimp Stage 1: 扇尾晶莹虾 (六节折叠弹射晶虾) -->
        <!-- 头部与前额刺 -->
        <polygon points="82,34 62,24 66,46" fill="#FBBF24" />
        <polygon points="82,34 66,46 76,52" fill="#F59E0B" />
        <polygon points="82,34 94,24 74,32" fill="#FDE047" />
        <!-- 躯干甲片 1 -->
        <polygon points="62,24 46,28 48,50 66,46" fill="#F472B6" />
        <!-- 躯干甲片 2 -->
        <polygon points="46,28 32,38 36,58 48,50" fill="#FB7185" />
        <!-- 尾节 -->
        <polygon points="32,38 18,52 24,68 36,58" fill="#E11D48" />
        <!-- 四折百褶纸扇尾 -->
        <polygon points="18,52 2,56 10,64" fill="#FDE047" />
        <polygon points="18,52 10,64 6,74" fill="#F59E0B" />
        <polygon points="18,52 6,74 16,78" fill="#D97706" />
        <polygon points="18,52 16,78 24,68" fill="#B45309" />
        <!-- 虾须折线 -->
        <polyline points="82,34 92,20 100,10" stroke="#FDE047" stroke-width="1.2" stroke-linecap="round" fill="none" />
        <!-- 折痕骨架 -->
        <polyline points="82,34 66,46 48,50 36,58 18,52" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="2.5,1.5" fill="none" />
        <!-- 眼睛 -->
        <polygon points="70,32 74,36 70,40 66,36" fill="#FFFFFF" />
        <polygon points="70,33.5 72.5,36 70,38.5 67.5,36" fill="#991B1B" />`;
        },

        get_shrimp_stage_2(uid) {
            return `<!-- Shrimp Stage 2: 烈焰喷射虾 (三阶·火箭喷射金羽) -->
        <!-- 折纸王者金冠 👑 -->
        <polygon points="56,16 62,6 68,16 62,12" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <!-- 火箭喷射折叠翼 -->
        <polygon points="46,28 36,10 42,28" fill="#F97316" stroke="#EA580C" stroke-width="0.8" />
        <polygon points="36,10 28,18 40,28" fill="#EA580C" />
        <!-- 头部烈焰面 -->
        <polygon points="84,36 64,24 68,48" fill="#FED7AA" />
        <polygon points="84,36 68,48 78,54" fill="#F97316" />
        <!-- 躯干甲片 -->
        <polygon points="64,24 46,28 48,52 68,48" fill="#F43F5E" />
        <polygon points="46,28 30,40 34,60 48,52" fill="#E11D48" />
        <polygon points="30,40 16,54 22,70 34,60" fill="#BE123C" />
        <!-- 火焰五折尾 -->
        <polygon points="16,54 0,54 8,64" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="16,54 8,64 4,74" fill="#F97316" />
        <polygon points="16,54 4,74 14,80" fill="#EF4444" />
        <polygon points="16,54 14,80 22,70" fill="#DC2626" />
        <!-- 黄金长须 -->
        <polyline points="84,36 94,18 100,6" stroke="#FDE047" stroke-width="1.3" stroke-linecap="round" fill="none" />
        <!-- 烫金主折痕 -->
        <polyline points="84,36 68,48 48,52 34,60 16,54" stroke="#FFFBEB" stroke-width="1.4" stroke-dasharray="3,1.5" fill="none" />
        <!-- 眼睛 -->
        <polygon points="72,32 76,36 72,40 68,36" fill="#FFFFFF" />
        <polygon points="72,33.5 74.5,36 72,38.5 69.5,36" fill="#7C2D12" />`;
        },

        get_shrimp_stage_3(uid) {
            return `<!-- Shrimp Stage 3: 雷霆金羽神速虾 (四阶·电光金翼神速) -->
        <!-- 悬浮折纸电光灵球 (右上方) -->
        <g class="origami-floating-orb" transform="translate(80, 14)">
            <polygon points="0,-8 6,-3 6,3 0,8 -6,3 -6,-3" fill="#38BDF8" stroke="#FDE047" stroke-width="0.8" />
            <polygon points="0,-8 0,0 6,-3" fill="#E0F2FE" />
            <polygon points="6,-3 0,0 6,3" fill="#7DD3FC" />
            <polygon points="6,3 0,0 0,8" fill="#38BDF8" />
            <polygon points="0,8 0,0 -6,3" fill="#0284C7" />
            <polygon points="-6,3 0,0 -6,-3" fill="#0369A1" />
            <polygon points="-6,-3 0,0 0,-8" fill="#BAE6FD" />
        </g>
        <!-- 舒展的折纸雷霆神翼 -->
        <polygon points="48,28 36,4 42,26" fill="#FDE047" stroke="#D97706" stroke-width="0.8" />
        <polygon points="36,4 24,12 40,26" fill="#F59E0B" />
        <polygon points="24,12 16,6 30,22" fill="#D97706" />
        <!-- 主躯干金羽甲片 -->
        <polygon points="84,36 64,22 68,48" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="84,36 68,48 78,56" fill="#FDE047" />
        <polygon points="64,22 46,26 48,52 68,48" fill="#FBBF24" />
        <polygon points="46,26 28,38 32,60 48,52" fill="#F59E0B" />
        <polygon points="28,38 14,54 20,72 32,60" fill="#D97706" />
        <!-- 金羽扇尾 -->
        <polygon points="14,54 0,50 6,62" fill="#38BDF8" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="14,54 6,62 0,72" fill="#0284C7" />
        <polygon points="14,54 0,72 10,80" fill="#FBBF24" />
        <polygon points="14,54 10,80 20,72" fill="#F59E0B" />
        <!-- 闪电折痕须 -->
        <polyline points="84,36 94,24 92,16 100,8" stroke="#FDE047" stroke-width="1.5" stroke-linecap="round" fill="none" />
        <polyline points="84,36 68,48 48,52 32,60 14,54" stroke="#FFFBEB" stroke-width="1.6" stroke-dasharray="3,1" fill="none" />
        <!-- 眼睛 -->
        <polygon points="72,30 77,34 72,38 67,34" fill="#38BDF8" />`;
        },

        get_shrimp_stage_4(uid) {
            return `<!-- Shrimp Stage 4: 不死朱雀真神虾 (五阶·朱雀神凰极意) -->
        <!-- 外层十二边形神圣星环 -->
        <g class="origami-cosmic-ring ring-outer">
            <polygon points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                     fill="none" stroke="#FBBF24" stroke-width="1.4" stroke-dasharray="4,2.5" />
        </g>
        <g class="origami-cosmic-ring ring-inner">
            <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
                     fill="none" stroke="#F43F5E" stroke-width="1.2" stroke-dasharray="3,2" />
        </g>
        <!-- 朱雀真神冠羽 -->
        <polygon points="62,18 70,4 74,18" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="54,22 62,18 64,24" fill="#F59E0B" />
        <!-- 舒展的朱雀折纸双翼 -->
        <polygon points="48,28 30,0 38,24" fill="#FDA4AF" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="30,0 18,10 34,24" fill="#F43F5E" />
        <polygon points="18,10 8,6 24,20" fill="#E11D48" />
        <!-- 主躯干朱雀霓虹甲片 -->
        <polygon points="84,36 64,20 68,48" fill="#F472B6" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="84,36 68,48 78,56" fill="#EC4899" />
        <polygon points="64,20 46,24 48,52 68,48" fill="#DB2777" />
        <polygon points="46,24 28,36 32,60 48,52" fill="#BE185D" />
        <polygon points="28,36 14,52 20,72 32,60" fill="#9D174D" />
        <!-- 绚烂凤凰九折飘尾 -->
        <polygon points="14,52 0,44 6,58" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="14,52 6,58 0,68" fill="#F43F5E" />
        <polygon points="14,52 0,68 8,78" fill="#C084FC" />
        <polygon points="14,52 8,78 20,72" fill="#22D3EE" />
        <!-- 凤凰金丝神须 -->
        <polyline points="84,36 96,20 92,10 100,0" stroke="#FDE047" stroke-width="1.6" stroke-linecap="round" fill="none" />
        <polyline points="84,36 68,48 48,52 32,60 14,52" stroke="#FFFBEB" stroke-width="1.8" stroke-dasharray="3,1" fill="none" />
        <!-- 全息星芒 -->
        <polygon points="86,18 88,16 90,18 88,20" fill="#FDE047" />
        <polygon points="12,18 14,16 16,18 14,20" fill="#22D3EE" />
        <polygon points="22,86 24,84 26,86 24,88" fill="#F472B6" />
        <!-- 神威明目 -->
        <polygon points="72,28 77,32 72,36 67,32" fill="#FDE047" />`;
        },

        get_octo_stage_0(uid) {
            return `<!-- Octo Stage 0: 八角小纸章 (八角穹顶小软章) -->
        <!-- 八角折纸穹顶头 -->
        <polygon points="50,18 68,26 74,44 64,58 50,62 36,58 26,44 32,26" fill="#C084FC" />
        <polygon points="50,18 68,26 50,42" fill="#E9D5FF" />
        <polygon points="50,18 50,42 32,26" fill="#D8B4FE" />
        <polygon points="32,26 50,42 26,44" fill="#C084FC" />
        <polygon points="68,26 74,44 50,42" fill="#A855F7" />
        <polygon points="26,44 50,42 36,58" fill="#9333EA" />
        <polygon points="74,44 50,42 64,58" fill="#7E22CE" />
        <polygon points="36,58 50,42 50,62" fill="#6B21A8" />
        <polygon points="64,58 50,42 50,62" fill="#581C87" />
        <!-- 六只折纸三角触手 -->
        <polygon points="28,54 18,68 32,64" fill="#9333EA" />
        <polygon points="34,60 26,76 40,68" fill="#7E22CE" />
        <polygon points="42,62 44,82 50,68" fill="#6B21A8" />
        <polygon points="50,68 56,82 58,62" fill="#6B21A8" />
        <polygon points="60,68 74,76 66,60" fill="#7E22CE" />
        <polygon points="68,64 82,68 72,54" fill="#9333EA" />
        <!-- 折痕骨架 -->
        <line x1="50" y1="18" x2="50" y2="62" stroke="#FFFFFF" stroke-width="1" stroke-dasharray="2,1.5" />
        <line x1="26" y1="44" x2="74" y2="44" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" />
        <!-- 折纸几何眼睛 -->
        <polygon points="40,36 44,39 40,42 36,39" fill="#FFFFFF" />
        <polygon points="40,37.5 42,39 40,40.5 38,39" fill="#3B0764" />
        <polygon points="60,36 64,39 60,42 56,39" fill="#FFFFFF" />
        <polygon points="60,37.5 62,39 60,40.5 58,39" fill="#3B0764" />`;
        },

        get_octo_stage_1(uid) {
            return `<!-- Octo Stage 1: 棱面火箭乌贼 (流线折叠箭尾) -->
        <!-- 火箭尖顶与侧翼 -->
        <polygon points="50,14 68,34 50,38" fill="#93C5FD" />
        <polygon points="50,14 50,38 32,34" fill="#60A5FA" />
        <polygon points="50,14 78,28 68,34" fill="#BFDBFE" />
        <polygon points="50,14 32,34 22,28" fill="#3B82F6" />
        <!-- 躯干中央晶面 -->
        <polygon points="32,34 50,38 48,60 30,56" fill="#2563EB" />
        <polygon points="68,34 70,56 52,60 50,38" fill="#1D4ED8" />
        <!-- 触手折叠飘带 -->
        <polygon points="30,56 16,74 32,70" fill="#3B82F6" />
        <polygon points="36,60 28,84 42,76" fill="#2563EB" />
        <polygon points="44,60 48,92 52,76" fill="#1D4ED8" />
        <polygon points="52,76 52,92 56,60" fill="#1D4ED8" />
        <polygon points="58,76 72,84 64,60" fill="#1E40AF" />
        <polygon points="68,70 84,74 70,56" fill="#172554" />
        <!-- 脊椎折痕线 -->
        <polyline points="50,14 50,38 50,60" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="2.5,1.5" />
        <!-- 双眼 -->
        <polygon points="38,44 42,48 38,52 34,48" fill="#FFFFFF" />
        <polygon points="38,45.5 40.5,48 38,50.5 35.5,48" fill="#1E3A8A" />
        <polygon points="62,44 66,48 62,52 58,48" fill="#FFFFFF" />
        <polygon points="62,45.5 64.5,48 62,50.5 59.5,48" fill="#1E3A8A" />`;
        },

        get_octo_stage_2(uid) {
            return `<!-- Octo Stage 2: 礼帽折纸魔术章 (三阶·魔术大礼帽) -->
        <!-- 3D 折纸魔术高礼帽 🎩 -->
        <polygon points="36,4 64,4 62,20 38,20" fill="#18181B" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="36,4 50,4 50,20 38,20" fill="#27272A" />
        <!-- 礼帽金带 -->
        <polygon points="38,16 62,16 61,20 39,20" fill="#FDE047" />
        <!-- 礼帽帽檐折面 -->
        <polygon points="26,20 74,20 68,24 32,24" fill="#3F3F46" />
        <!-- 章鱼头部晶面 -->
        <polygon points="32,24 68,24 74,44 64,58 50,62 36,58 26,44" fill="#A855F7" />
        <polygon points="32,24 68,24 50,42" fill="#C084FC" />
        <polygon points="32,24 50,42 26,44" fill="#A855F7" />
        <polygon points="68,24 74,44 50,42" fill="#9333EA" />
        <polygon points="26,44 50,42 36,58" fill="#7E22CE" />
        <polygon points="74,44 50,42 64,58" fill="#6B21A8" />
        <!-- 触手与微型魔杖 -->
        <polygon points="26,54 12,70 28,66" fill="#9333EA" />
        <polygon points="34,60 20,84 38,74" fill="#7E22CE" />
        <polygon points="42,62 44,90 50,74" fill="#6B21A8" />
        <polygon points="50,74 56,90 58,62" fill="#6B21A8" />
        <polygon points="60,74 78,84 66,60" fill="#7E22CE" />
        <!-- 右触手手持金色小魔杖 ✨ -->
        <polygon points="68,66 84,70 72,54" fill="#9333EA" />
        <polyline points="72,54 86,40 90,44 76,58" fill="#FDE047" stroke="#D97706" stroke-width="0.8" />
        <polygon points="88,38 90,36 92,38 90,40" fill="#FFFFFF" />
        <!-- 双眼 -->
        <polygon points="40,36 44,40 40,44 36,40" fill="#FFFFFF" />
        <polygon points="40,37.5 42.5,40 40,42.5 37.5,40" fill="#581C87" />
        <polygon points="60,36 64,40 60,44 56,40" fill="#FFFFFF" />
        <polygon points="60,37.5 62.5,40 60,42.5 57.5,40" fill="#581C87" />`;
        },

        get_octo_stage_3(uid) {
            return `<!-- Octo Stage 3: 奥术千面学者 (四阶·二十面体奥术球) -->
        <!-- 悬浮折纸奥术法球 (左上方) -->
        <g class="origami-floating-orb" transform="translate(18, 16)">
            <polygon points="0,-8 7,-4 7,4 0,8 -7,4 -7,-4" fill="#22D3EE" stroke="#A855F7" stroke-width="0.8" />
            <polygon points="0,-8 0,0 7,-4" fill="#E0F2FE" />
            <polygon points="7,-4 0,0 7,4" fill="#67E8F9" />
            <polygon points="7,4 0,0 0,8" fill="#06B6D4" />
            <polygon points="0,8 0,0 -7,4" fill="#0891B2" />
            <polygon points="-7,4 0,0 -7,-4" fill="#0E7490" />
            <polygon points="-7,-4 0,0 0,-8" fill="#A5F3FC" />
        </g>
        <!-- 学者折纸方巾与金冠 -->
        <polygon points="42,12 50,4 58,12 50,8" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <!-- 头部深海翡翠奥术晶面 -->
        <polygon points="50,14 74,24 80,44 68,60 50,64 32,60 20,44 26,24" fill="#059669" stroke="#FBBF24" stroke-width="0.8" />
        <polygon points="50,14 74,24 50,40" fill="#6EE7B7" />
        <polygon points="50,14 50,40 26,24" fill="#34D399" />
        <polygon points="26,24 50,40 20,44" fill="#10B981" />
        <polygon points="74,24 80,44 50,40" fill="#059669" />
        <polygon points="20,44 50,40 32,60" fill="#047857" />
        <polygon points="80,44 50,40 68,60" fill="#065F46" />
        <!-- 触手八芒舒展折面 -->
        <polygon points="24,56 6,70 24,66" fill="#10B981" stroke="#FBBF24" stroke-width="0.6" />
        <polygon points="30,60 16,84 34,74" fill="#059669" />
        <polygon points="38,62 30,94 44,76" fill="#047857" />
        <polygon points="46,64 50,96 54,64" fill="#065F46" />
        <polygon points="56,76 70,94 62,62" fill="#047857" />
        <polygon points="66,74 84,84 70,60" fill="#059669" />
        <polygon points="76,66 94,70 76,56" fill="#10B981" stroke="#FBBF24" stroke-width="0.6" />
        <!-- 奥术折痕脊梁 -->
        <polyline points="50,14 50,40 50,64" stroke="#FFFBEB" stroke-width="1.6" stroke-dasharray="3,1" />
        <!-- 智慧双目 -->
        <polygon points="38,34 43,38 38,42 33,38" fill="#22D3EE" />
        <polygon points="62,34 67,38 62,42 57,38" fill="#22D3EE" />`;
        },

        get_octo_stage_4(uid) {
            return `<!-- Octo Stage 4: 深渊海皇三叉戟真章 (五阶·深渊海皇真神) -->
        <!-- 外层十二边形神圣星环 -->
        <g class="origami-cosmic-ring ring-outer">
            <polygon points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                     fill="none" stroke="#FBBF24" stroke-width="1.4" stroke-dasharray="4,2.5" />
        </g>
        <g class="origami-cosmic-ring ring-inner">
            <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
                     fill="none" stroke="#A855F7" stroke-width="1.2" stroke-dasharray="3,2" />
        </g>
        <!-- 至尊折纸海皇冠 -->
        <polygon points="42,12 50,0 58,12 50,6" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="36,16 42,12 44,18" fill="#F59E0B" />
        <polygon points="58,12 64,16 56,18" fill="#D97706" />
        <!-- 深渊紫金帝王头面 -->
        <polygon points="50,14 76,22 82,44 70,62 50,66 30,62 18,44 24,22" fill="#7C3AED" stroke="#FDE047" stroke-width="1" />
        <polygon points="50,14 76,22 50,40" fill="#DDD6FE" />
        <polygon points="50,14 50,40 24,22" fill="#C4B5FD" />
        <polygon points="24,22 50,40 18,44" fill="#A78BFA" />
        <polygon points="76,22 82,44 50,40" fill="#8B5CF6" />
        <polygon points="18,44 50,40 30,62" fill="#7C3AED" />
        <polygon points="82,44 50,40 70,62" fill="#6D28D9" />
        <!-- 触手深渊折面 -->
        <polygon points="22,56 4,70 20,66" fill="#8B5CF6" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="28,60 14,84 32,74" fill="#7C3AED" />
        <polygon points="36,62 26,94 42,76" fill="#6D28D9" />
        <polygon points="46,64 50,96 54,64" fill="#5B21B6" />
        <polygon points="56,76 74,94 64,62" fill="#6D28D9" />
        <polygon points="66,74 86,84 72,60" fill="#7C3AED" />
        <!-- 手握折纸海神三叉戟 🔱 -->
        <g transform="translate(82, 38)">
            <line x1="0" y1="36" x2="0" y2="-20" stroke="#FDE047" stroke-width="2.2" stroke-linecap="round" />
            <polygon points="-6,-12 0,-26 6,-12 0,-16" fill="#FDE047" stroke="#D97706" stroke-width="0.8" />
            <polygon points="-12,-8 -6,-16 -4,-8" fill="#FBBF24" stroke="#D97706" stroke-width="0.6" />
            <polygon points="12,-8 6,-16 4,-8" fill="#FBBF24" stroke="#D97706" stroke-width="0.6" />
        </g>
        <!-- 烫金神圣折脊线 -->
        <polyline points="50,14 50,40 50,66" stroke="#FFFBEB" stroke-width="1.8" stroke-dasharray="3,1" />
        <!-- 散落全息星芒 -->
        <polygon points="86,16 88,14 90,16 88,18" fill="#FDE047" />
        <polygon points="12,16 14,14 16,16 14,18" fill="#22D3EE" />
        <polygon points="20,86 22,84 24,86 22,88" fill="#F472B6" />
        <!-- 海皇神威双目 -->
        <polygon points="38,34 43,38 38,42 33,38" fill="#FDE047" />
        <polygon points="62,34 67,38 62,42 57,38" fill="#FDE047" />`;
        },

        // ========================================================
        // 🐢 5. 纸灵龟 (GEOMETRIC TORTOISE - 5 STAGES)
        // ========================================================
        get_turtle_stage_0(uid) {
            return `<!-- Turtle Stage 0: 萌动小钱龟 (六棱翡翠折纸幼龟) -->
        <!-- 四肢小折桨 -->
        <polygon points="30,36 12,26 24,46" fill="#34D399" />
        <polygon points="70,36 88,26 76,46" fill="#10B981" />
        <polygon points="32,62 16,74 34,70" fill="#059669" />
        <polygon points="68,62 84,74 66,70" fill="#047857" />
        <!-- 小尾巴 -->
        <polygon points="50,78 46,88 54,88" fill="#059669" />
        <!-- 呆萌小头 -->
        <polygon points="50,14 58,28 42,28" fill="#6EE7B7" />
        <polygon points="46,20 48,22 46,24 44,22" fill="#064E3B" />
        <polygon points="54,20 56,22 54,24 52,22" fill="#064E3B" />
        <!-- 六边形折纸龟壳 -->
        <polygon points="50,48 50,28 68,38" fill="#34D399" />
        <polygon points="50,48 68,38 68,60" fill="#10B981" />
        <polygon points="50,48 68,60 50,72" fill="#059669" />
        <polygon points="50,48 50,72 32,60" fill="#047857" />
        <polygon points="50,48 32,60 32,38" fill="#10B981" />
        <polygon points="50,48 32,38 50,28" fill="#6EE7B7" />
        <!-- 边缘折痕虚线 -->
        <polygon points="50,28 68,38 68,60 50,72 32,60 32,38" fill="none" stroke="#FFFFFF" stroke-width="1.1" stroke-dasharray="2.5,1.5" />
        <line x1="50" y1="28" x2="50" y2="72" stroke="#FFFFFF" stroke-width="0.8" stroke-dasharray="2,1" />`;
        },

        get_turtle_stage_1(uid) {
            return `<!-- Turtle Stage 1: 菱晶浮游龟 (二阶·宽翼划水晶体灵龟) -->
        <!-- 宽大前肢翼桨 -->
        <polygon points="32,36 4,22 18,48 28,42" fill="#6EE7B7" />
        <polygon points="68,36 96,22 82,48 72,42" fill="#10B981" />
        <polygon points="30,64 12,78 32,74" fill="#059669" />
        <polygon points="70,64 88,78 68,74" fill="#047857" />
        <polygon points="50,80 45,92 55,92" fill="#065F46" />
        <!-- 头部与眼部 -->
        <polygon points="50,12 60,26 40,26" fill="#A7F3D0" />
        <polygon points="50,12 50,26 40,26" fill="#6EE7B7" />
        <polygon points="45,18 47,20 45,22 43,20" fill="#064E3B" />
        <polygon points="55,18 57,20 55,22 53,20" fill="#064E3B" />
        <!-- 多面菱晶龟甲 -->
        <polygon points="50,30 64,40 50,52 36,40" fill="#34D399" />
        <polygon points="50,52 64,64 50,76 36,64" fill="#059669" />
        <polygon points="36,40 50,52 36,64 24,52" fill="#10B981" />
        <polygon points="64,40 76,52 64,64 50,52" fill="#047857" />
        <polygon points="50,30 36,40 24,34 38,26" fill="#A7F3D0" />
        <polygon points="50,30 64,40 76,34 62,26" fill="#6EE7B7" />
        <polygon points="36,64 50,76 44,82 28,72" fill="#065F46" />
        <polygon points="64,64 50,76 56,82 72,72" fill="#064E3B" />
        <!-- 晶体折脊线 -->
        <polyline points="50,12 50,30 50,52 50,76" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="3,1.5" />`;
        },

        get_turtle_stage_2(uid) {
            return `<!-- Turtle Stage 2: 金纹厚甲龟 (三阶·头戴金冠镇浪神龟) -->
        <polygon points="44,8 50,2 56,8 50,5" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <polygon points="38,12 44,8 46,13" fill="#F59E0B" />
        <polygon points="56,8 62,12 54,13" fill="#D97706" />
        <!-- 威严前鳍 -->
        <polygon points="30,36 2,20 16,48 28,42" fill="#34D399" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="70,36 98,20 84,48 72,42" fill="#10B981" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="28,66 10,82 32,76" fill="#059669" />
        <polygon points="72,66 90,82 68,76" fill="#047857" />
        <!-- 龙首灵头 -->
        <polygon points="50,12 62,28 38,28" fill="#A7F3D0" />
        <polygon points="44,18 48,21 44,24 40,21" fill="#FFFFFF" />
        <polygon points="56,18 60,21 56,24 52,21" fill="#FFFFFF" />
        <!-- 金纹玄岩龟甲 -->
        <polygon points="50,32 66,42 50,56 34,42" fill="#059669" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="50,56 66,70 50,82 34,70" fill="#047857" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="34,42 50,56 34,70 20,56" fill="#10B981" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="66,42 80,56 66,70 50,56" fill="#065F46" stroke="#FDE047" stroke-width="0.8" />
        <polyline points="50,2 50,32 50,56 50,82" stroke="#FDE047" stroke-width="1.4" stroke-dasharray="3,1" />`;
        },

        get_turtle_stage_3(uid) {
            return `<!-- Turtle Stage 3: 碧海长青神龟 (四阶·背负仙岛玄灵宝珠) -->
        <g class="origami-floating-orb">
            <polygon points="0,-8 6,-3 6,3 0,8 -6,3 -6,-3" fill="#34D399" stroke="#059669" stroke-width="0.8" />
            <polygon points="0,-8 0,0 6,-3" fill="#A7F3D0" />
            <polygon points="6,-3 0,0 6,3" fill="#10B981" />
            <polygon points="6,3 0,0 0,8" fill="#059669" />
            <polygon points="0,8 0,0 -6,3" fill="#047857" />
            <polygon points="-6,3 0,0 -6,-3" fill="#065F46" />
        </g>
        <!-- 龙首角冠 -->
        <polygon points="46,12 50,2 54,12" fill="#FDE047" />
        <polygon points="50,14 64,30 36,30" fill="#6EE7B7" stroke="#FDE047" stroke-width="0.8" />
        <!-- 巨灵神鳍 -->
        <polygon points="30,36 0,16 14,50 28,42" fill="#10B981" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="70,36 100,16 86,50 72,42" fill="#059669" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="26,66 6,86 32,78" fill="#047857" />
        <polygon points="74,66 94,86 68,78" fill="#065F46" />
        <!-- 仙山八棱背甲 -->
        <polygon points="50,32 70,44 50,60 30,44" fill="#059669" stroke="#FDE047" stroke-width="1" />
        <polygon points="50,60 70,74 50,88 30,74" fill="#064E3B" stroke="#FDE047" stroke-width="1" />
        <polygon points="30,44 50,60 30,74 14,60" fill="#047857" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="70,44 86,60 70,74 50,60" fill="#065F46" stroke="#FDE047" stroke-width="0.8" />
        <polyline points="50,2 50,32 50,60 50,88" stroke="#FFFBEB" stroke-width="1.6" stroke-dasharray="3,1" />`;
        },

        get_turtle_stage_4(uid) {
            return `<!-- Turtle Stage 4: 九天镇岳玄武 (五阶·全息星宿神圣玄武大帝) -->
        <g class="origami-cosmic-ring ring-outer">
            <polygon points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                     fill="none" stroke="#FDE047" stroke-width="1.4" stroke-dasharray="4,2.5" />
        </g>
        <g class="origami-cosmic-ring ring-inner">
            <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
                     fill="none" stroke="#10B981" stroke-width="1.2" stroke-dasharray="3,2" />
        </g>
        <!-- 玄武灵蛇缠绕折线 -->
        <path d="M 18,84 Q 8,50 28,30 T 72,30 T 82,70 T 50,94" fill="none" stroke="#34D399" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="5,2" />
        <!-- 龙首玄武皇冠 -->
        <polygon points="42,10 50,0 58,10 50,4" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="50,12 66,28 34,28" fill="#A7F3D0" stroke="#FDE047" stroke-width="1" />
        <polygon points="44,18 48,21 44,24 40,21" fill="#FDE047" />
        <polygon points="56,18 60,21 56,24 52,21" fill="#FDE047" />
        <!-- 镇岳神甲 -->
        <polygon points="50,32 72,46 50,62 28,46" fill="#047857" stroke="#FDE047" stroke-width="1.2" />
        <polygon points="50,62 72,76 50,90 28,76" fill="#064E3B" stroke="#FDE047" stroke-width="1.2" />
        <polygon points="28,46 50,62 28,76 10,60" fill="#065F46" stroke="#FDE047" stroke-width="1" />
        <polygon points="72,46 90,60 72,76 50,62" fill="#022C22" stroke="#FDE047" stroke-width="1" />
        <!-- 金曜星芒 -->
        <polygon points="88,14 90,12 92,14 90,16" fill="#FDE047" />
        <polygon points="12,14 14,12 16,14 14,16" fill="#FDE047" />
        <polyline points="50,0 50,32 50,62 50,90" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4,1.5" />`;
        },

        // ========================================================
        // 🪼 6. 纸灵水母 (GEOMETRIC JELLYFISH - 5 STAGES)
        // ========================================================
        get_jelly_stage_0(uid) {
            return `<!-- Jellyfish Stage 0: 微光小伞帽 (多面折纸灵水母幼体) -->
        <!-- 伞盖主体 (半球折纸面) -->
        <polygon points="50,20 26,38 50,42" fill="#FDA4AF" />
        <polygon points="50,20 50,42 74,38" fill="#F43F5E" />
        <polygon points="26,38 18,52 34,50 50,42" fill="#FB7185" />
        <polygon points="74,38 50,42 66,50 82,52" fill="#E11D48" />
        <polygon points="34,50 50,42 66,50 50,56" fill="#BE123C" />
        <!-- 裙边荷叶折线 -->
        <polyline points="18,52 34,50 50,56 66,50 82,52" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="2.5,1.5" />
        <!-- 呆萌小眼 -->
        <polygon points="40,36 43,38 40,40 37,38" fill="#881337" />
        <polygon points="60,36 63,38 60,40 57,38" fill="#881337" />
        <!-- 飘动波浪折纸触须 -->
        <polyline points="28,52 24,68 32,82 28,94" stroke="#F43F5E" stroke-width="2.2" stroke-linecap="round" />
        <polyline points="42,54 46,72 40,86 44,96" stroke="#FB7185" stroke-width="2.5" stroke-linecap="round" />
        <polyline points="58,54 54,72 60,86 56,96" stroke="#FDA4AF" stroke-width="2.5" stroke-linecap="round" />
        <polyline points="72,52 76,68 68,82 72,94" stroke="#E11D48" stroke-width="2.2" stroke-linecap="round" />`;
        },

        get_jelly_stage_1(uid) {
            return `<!-- Jellyfish Stage 1: 琉璃七彩水母 (二阶·棱镜霓光幻水母) -->
        <!-- 琉璃伞盖 -->
        <polygon points="50,16 28,34 50,40" fill="#E879F9" />
        <polygon points="50,16 50,40 72,34" fill="#C084FC" />
        <polygon points="28,34 14,50 32,48 50,40" fill="#F472B6" />
        <polygon points="72,34 50,40 68,48 86,50" fill="#A855F7" />
        <polygon points="32,48 50,40 68,48 50,56" fill="#9333EA" />
        <polygon points="14,50 24,56 32,48" fill="#FB7185" />
        <polygon points="86,50 68,48 76,56" fill="#7E22CE" />
        <polyline points="14,50 24,56 32,48 50,56 68,48 76,56 86,50" stroke="#FFFFFF" stroke-width="1.3" stroke-dasharray="2,1" />
        <!-- 晶体眼 -->
        <polygon points="38,34 42,37 38,40 34,37" fill="#FFFFFF" />
        <polygon points="62,34 66,37 62,40 58,37" fill="#FFFFFF" />
        <!-- 6条多折飘带触须 -->
        <polyline points="20,54 12,70 22,84 16,96" stroke="#F472B6" stroke-width="2" stroke-linecap="round" />
        <polyline points="32,52 28,68 36,84 30,98" stroke="#E879F9" stroke-width="2.2" stroke-linecap="round" />
        <polyline points="44,56 48,74 42,88 46,98" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" />
        <polyline points="56,56 52,74 58,88 54,98" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" />
        <polyline points="68,52 72,68 64,84 70,98" stroke="#C084FC" stroke-width="2.2" stroke-linecap="round" />
        <polyline points="80,54 88,70 78,84 84,96" stroke="#A855F7" stroke-width="2" stroke-linecap="round" />`;
        },

        get_jelly_stage_2(uid) {
            return `<!-- Jellyfish Stage 2: 极光仙羽水母 (三阶·灵珠王冠仙羽水母) -->
        <polygon points="44,8 50,2 56,8 50,5" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <polygon points="38,12 44,8 46,13" fill="#F59E0B" />
        <polygon points="56,8 62,12 54,13" fill="#D97706" />
        <!-- 仙羽伞盖 -->
        <polygon points="50,14 24,32 50,38" fill="#F472B6" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="50,14 50,38 76,32" fill="#C084FC" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="24,32 10,48 30,46 50,38" fill="#FB7185" />
        <polygon points="76,32 50,38 70,46 90,48" fill="#A855F7" />
        <polygon points="30,46 50,38 70,46 50,56" fill="#7C3AED" />
        <polyline points="10,48 30,46 50,56 70,46 90,48" stroke="#FDE047" stroke-width="1.4" stroke-dasharray="3,1" />
        <!-- 灵威大眼 -->
        <polygon points="38,32 42,35 38,38 34,35" fill="#FDE047" />
        <polygon points="62,32 66,35 62,38 58,35" fill="#FDE047" />
        <!-- 仙羽飘飘触须 -->
        <polyline points="18,50 8,68 20,84 14,98" stroke="#F43F5E" stroke-width="2.2" stroke-linecap="round" />
        <polyline points="32,48 26,68 34,84 28,98" stroke="#E879F9" stroke-width="2.5" stroke-linecap="round" />
        <polyline points="44,56 50,76 42,90 48,98" stroke="#22D3EE" stroke-width="2.8" stroke-linecap="round" />
        <polyline points="56,56 50,76 58,90 52,98" stroke="#22D3EE" stroke-width="2.8" stroke-linecap="round" />
        <polyline points="68,48 74,68 66,84 72,98" stroke="#A855F7" stroke-width="2.5" stroke-linecap="round" />
        <polyline points="82,50 92,68 80,84 86,98" stroke="#7C3AED" stroke-width="2.2" stroke-linecap="round" />`;
        },

        get_jelly_stage_3(uid) {
            return `<!-- Jellyfish Stage 3: 织梦星河灵母 (四阶·背负星珠梦幻深海神母) -->
        <g class="origami-floating-orb">
            <polygon points="0,-8 6,-3 6,3 0,8 -6,3 -6,-3" fill="#E879F9" stroke="#C084FC" stroke-width="0.8" />
            <polygon points="0,-8 0,0 6,-3" fill="#FDF4FF" />
            <polygon points="6,-3 0,0 6,3" fill="#F472B6" />
            <polygon points="6,3 0,0 0,8" fill="#A855F7" />
            <polygon points="0,8 0,0 -6,3" fill="#7C3AED" />
            <polygon points="-6,3 0,0 -6,-3" fill="#6D28D9" />
        </g>
        <polygon points="50,14 20,32 50,38" fill="#FB7185" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="50,14 50,38 80,32" fill="#A855F7" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="20,32 6,48 28,46 50,38" fill="#F43F5E" />
        <polygon points="80,32 50,38 72,46 94,48" fill="#7C3AED" />
        <polygon points="28,46 50,38 72,46 50,56" fill="#5B21B6" />
        <!-- 流光触手 -->
        <polyline points="14,50 4,68 18,84 10,98" stroke="#FB7185" stroke-width="2.4" stroke-linecap="round" />
        <polyline points="30,48 22,68 32,86 24,98" stroke="#E879F9" stroke-width="2.8" stroke-linecap="round" />
        <polyline points="44,56 52,76 42,92 48,100" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" />
        <polyline points="56,56 48,76 58,92 52,100" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" />
        <polyline points="70,48 78,68 68,86 76,98" stroke="#C084FC" stroke-width="2.8" stroke-linecap="round" />
        <polyline points="86,50 96,68 82,84 90,98" stroke="#7C3AED" stroke-width="2.4" stroke-linecap="round" />`;
        },

        get_jelly_stage_4(uid) {
            return `<!-- Jellyfish Stage 4: 太虚万华神母 (五阶·万华全息星宿神圣水母) -->
        <g class="origami-cosmic-ring ring-outer">
            <polygon points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                     fill="none" stroke="#FDE047" stroke-width="1.4" stroke-dasharray="4,2.5" />
        </g>
        <g class="origami-cosmic-ring ring-inner">
            <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
                     fill="none" stroke="#E879F9" stroke-width="1.2" stroke-dasharray="3,2" />
        </g>
        <polygon points="42,8 50,0 58,8 50,3" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <!-- 神圣万华伞盖 -->
        <polygon points="50,14 18,32 50,38" fill="#F472B6" stroke="#FDE047" stroke-width="1" />
        <polygon points="50,14 50,38 82,32" fill="#A855F7" stroke="#FDE047" stroke-width="1" />
        <polygon points="18,32 4,48 26,46 50,38" fill="#E11D48" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="82,32 50,38 74,46 96,48" fill="#6D28D9" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="26,46 50,38 74,46 50,56" fill="#4C1D95" stroke="#FDE047" stroke-width="1" />
        <!-- 神威光芒触手 -->
        <polyline points="12,50 2,68 16,84 8,98" stroke="#F43F5E" stroke-width="2.6" stroke-linecap="round" />
        <polyline points="28,48 20,68 30,86 22,98" stroke="#E879F9" stroke-width="3" stroke-linecap="round" />
        <polyline points="44,56 52,76 42,92 48,100" stroke="#FDE047" stroke-width="3.2" stroke-linecap="round" />
        <polyline points="56,56 48,76 58,92 52,100" stroke="#FDE047" stroke-width="3.2" stroke-linecap="round" />
        <polyline points="72,48 80,68 70,86 78,98" stroke="#C084FC" stroke-width="3" stroke-linecap="round" />
        <polyline points="88,50 98,68 84,84 92,98" stroke="#8B5CF6" stroke-width="2.6" stroke-linecap="round" />
        <!-- 闪耀星芒 -->
        <polygon points="86,16 88,14 90,16 88,18" fill="#FDE047" />
        <polygon points="12,16 14,14 16,16 14,18" fill="#22D3EE" />`;
        },

        // ========================================================
        // 🐳 7. 纸灵鲸 (GEOMETRIC WHALE - 5 STAGES)
        // ========================================================
        get_whale_stage_0(uid) {
            return `<!-- Whale Stage 0: 喷水萌萌鲸 (流线折纸小巨鲸) -->
        <!-- 头顶折纸喷泉 -->
        <polygon points="50,26 44,12 50,16 56,12" fill="#38BDF8" />
        <polygon points="50,26 40,16 46,20" fill="#7DD3FC" />
        <polygon points="50,26 60,16 54,20" fill="#0284C7" />
        <!-- 呆萌鲸鱼身躯 (面朝右侧) -->
        <polygon points="76,50 50,30 54,50" fill="#38BDF8" />
        <polygon points="76,50 54,50 50,70" fill="#0284C7" />
        <polygon points="50,30 26,40 30,50 54,50" fill="#0284C7" />
        <polygon points="50,70 54,50 30,50 26,60" fill="#0369A1" />
        <!-- 腹部白色琴弦折纹 -->
        <polygon points="76,50 50,70 42,74 68,62" fill="#E0F2FE" />
        <!-- 尾柄与鱼尾 -->
        <polygon points="26,40 26,60 14,50" fill="#075985" />
        <polygon points="14,50 2,36 8,50" fill="#38BDF8" />
        <polygon points="14,50 8,50 2,64" fill="#0284C7" />
        <!-- 萌萌小胸鳍 -->
        <polygon points="50,56 36,68 44,56" fill="#0284C7" />
        <!-- 鲸鱼明目 -->
        <polygon points="68,44 72,46 68,48 64,46" fill="#0C4A6E" />
        <line x1="76" y1="50" x2="14" y2="50" stroke="#FFFFFF" stroke-width="1.1" stroke-dasharray="2.5,1.5" />`;
        },

        get_whale_stage_1(uid) {
            return `<!-- Whale Stage 1: 蓝晶座头鲸 (二阶·长翼破浪座头鲸) -->
        <!-- 折纸喷水泉 -->
        <polygon points="52,24 44,8 52,14 60,8" fill="#38BDF8" />
        <polygon points="52,24 38,12 46,18" fill="#BAE6FD" />
        <polygon points="52,24 66,12 58,18" fill="#0284C7" />
        <!-- 雄伟多棱鲸身 -->
        <polygon points="82,48 54,28 58,48" fill="#60A5FA" />
        <polygon points="82,48 58,48 54,68" fill="#2563EB" />
        <polygon points="54,28 28,36 32,48 58,48" fill="#1D4ED8" />
        <polygon points="54,68 58,48 32,48 28,60" fill="#1E40AF" />
        <!-- 腹部切面 -->
        <polygon points="82,48 54,68 44,72 74,60" fill="#DBEAFE" />
        <!-- 展翼胸鳍 -->
        <polygon points="54,54 26,74 38,58" fill="#3B82F6" />
        <polygon points="26,74 20,78 30,70" fill="#1D4ED8" />
        <!-- 背鳍与尾鳍 -->
        <polygon points="40,32 34,20 36,34" fill="#1D4ED8" />
        <polygon points="28,36 28,60 12,48" fill="#1E3A8A" />
        <polygon points="12,48 0,30 6,48" fill="#60A5FA" />
        <polygon points="12,48 6,48 0,66" fill="#1D4ED8" />
        <!-- 智慧双目 -->
        <polygon points="72,42 76,45 72,48 68,45" fill="#FFFFFF" />
        <polygon points="72,43 74.5,45 72,47 69.5,45" fill="#1E3A8A" />
        <polyline points="82,48 58,48 32,48 12,48" stroke="#FFFFFF" stroke-width="1.3" stroke-dasharray="3,1.5" />`;
        },

        get_whale_stage_2(uid) {
            return `<!-- Whale Stage 2: 破浪独角鲸 (三阶·皇冠螺旋晶角独角鲸) -->
        <polygon points="50,16 56,10 62,16 56,13" fill="#FDE047" stroke="#F59E0B" stroke-width="0.6" />
        <!-- 额前螺旋独角 -->
        <polygon points="78,38 98,28 82,42" fill="#FDE047" stroke="#F59E0B" stroke-width="0.8" />
        <polygon points="82,42 98,28 84,45" fill="#F59E0B" />
        <!-- 霸气鲸身 -->
        <polygon points="84,48 56,26 60,48" fill="#93C5FD" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="84,48 60,48 56,70" fill="#3B82F6" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="56,26 28,34 32,48 60,48" fill="#1D4ED8" />
        <polygon points="56,70 60,48 32,48 28,62" fill="#1E40AF" />
        <!-- 金纹胸鳍 -->
        <polygon points="56,54 22,76 36,58" fill="#2563EB" stroke="#FDE047" stroke-width="0.6" />
        <!-- 尾柄与双叉尾鳍 -->
        <polygon points="28,34 28,62 10,48" fill="#172554" />
        <polygon points="10,48 -2,28 4,48" fill="#60A5FA" stroke="#FDE047" stroke-width="0.6" />
        <polygon points="10,48 4,48 -2,68" fill="#1D4ED8" stroke="#FDE047" stroke-width="0.6" />
        <polyline points="84,48 60,48 32,48 10,48" stroke="#FDE047" stroke-width="1.4" stroke-dasharray="3,1" />`;
        },

        get_whale_stage_3(uid) {
            return `<!-- Whale Stage 3: 覆海金铠虎鲸 (四阶·金铠利齿深海霸主) -->
        <g class="origami-floating-orb">
            <polygon points="0,-8 6,-3 6,3 0,8 -6,3 -6,-3" fill="#60A5FA" stroke="#2563EB" stroke-width="0.8" />
            <polygon points="0,-8 0,0 6,-3" fill="#DBEAFE" />
            <polygon points="6,-3 0,0 6,3" fill="#3B82F6" />
            <polygon points="6,3 0,0 0,8" fill="#1D4ED8" />
            <polygon points="0,8 0,0 -6,3" fill="#1E40AF" />
            <polygon points="-6,3 0,0 -6,-3" fill="#172554" />
        </g>
        <!-- 额前独角金晶 -->
        <polygon points="80,36 100,24 84,40" fill="#FDE047" stroke="#D97706" stroke-width="0.8" />
        <!-- 虎鲸黑金重铠 -->
        <polygon points="86,48 58,24 62,48" fill="#1E293B" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="86,48 62,48 58,72" fill="#0F172A" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="58,24 28,32 34,48 62,48" fill="#1E3A8A" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="58,72 62,48 34,48 28,64" fill="#172554" stroke="#FDE047" stroke-width="0.8" />
        <!-- 金纹高耸背鳍 -->
        <polygon points="46,28 38,6 40,30" fill="#FDE047" stroke="#D97706" stroke-width="0.8" />
        <!-- 巨灵胸鳍 -->
        <polygon points="58,54 18,78 34,58" fill="#2563EB" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="28,32 28,64 8,48" fill="#020617" />
        <polygon points="8,48 -4,26 2,48" fill="#3B82F6" stroke="#FDE047" stroke-width="0.8" />
        <polygon points="8,48 2,48 -4,70" fill="#1D4ED8" stroke="#FDE047" stroke-width="0.8" />
        <polyline points="86,48 62,48 34,48 8,48" stroke="#FFFBEB" stroke-width="1.6" stroke-dasharray="3,1" />`;
        },

        get_whale_stage_4(uid) {
            return `<!-- Whale Stage 4: 扶摇九霄鲲鹏 (五阶·全息星宿神圣鲲鹏觉醒) -->
        <g class="origami-cosmic-ring ring-outer">
            <polygon points="50,2 74,8 92,26 98,50 92,74 74,92 50,98 26,92 8,74 2,50 8,26 26,8"
                     fill="none" stroke="#FDE047" stroke-width="1.4" stroke-dasharray="4,2.5" />
        </g>
        <g class="origami-cosmic-ring ring-inner">
            <polygon points="50,12 77,23 88,50 77,77 50,88 23,77 12,50 23,23"
                     fill="none" stroke="#38BDF8" stroke-width="1.2" stroke-dasharray="3,2" />
        </g>
        <!-- 鲲鹏化羽神翼 (展翼遮天) -->
        <polygon points="56,36 34,2 44,28" fill="#60A5FA" stroke="#FDE047" stroke-width="1" />
        <polygon points="56,60 34,98 44,72" fill="#2563EB" stroke="#FDE047" stroke-width="1" />
        <!-- 龙首鲸角 -->
        <polygon points="82,34 102,20 86,40" fill="#FDE047" stroke="#F59E0B" stroke-width="1" />
        <!-- 鲲鹏真身 -->
        <polygon points="88,48 58,22 64,48" fill="#93C5FD" stroke="#FDE047" stroke-width="1" />
        <polygon points="88,48 64,48 58,74" fill="#1D4ED8" stroke="#FDE047" stroke-width="1" />
        <polygon points="58,22 26,30 32,48 64,48" fill="#1E3A8A" stroke="#FDE047" stroke-width="1" />
        <polygon points="58,74 64,48 32,48 26,66" fill="#172554" stroke="#FDE047" stroke-width="1" />
        <!-- 双叉神羽凤尾 -->
        <polygon points="26,30 26,66 6,48" fill="#0F172A" />
        <polygon points="6,48 -8,22 0,48" fill="#38BDF8" stroke="#FDE047" stroke-width="1" />
        <polygon points="6,48 0,48 -8,74" fill="#2563EB" stroke="#FDE047" stroke-width="1" />
        <!-- 闪烁星芒 -->
        <polygon points="88,14 90,12 92,14 90,16" fill="#FDE047" />
        <polygon points="14,14 16,12 18,14 16,16" fill="#FDE047" />
        <polyline points="88,48 64,48 32,48 6,48" stroke="#FFFBEB" stroke-width="2" stroke-dasharray="4,1.5" />`;
        },

        renderSvg(species = 'fish', stageIndex = 0, opts = {}) {
            const sp = (species === 'origami_koi') ? 'fish' : (species || 'fish');
            const uid = 'og_' + (++this.uidCounter);
            const w = opts.width || 68;
            const h = opts.height || 68;
            const s = Math.max(0, Math.min(4, stageIndex));
            const emotion = opts.emotion || (window.PetEngine && PetEngine.Emotion ? PetEngine.Emotion.currentEmotion : 'normal');

            let modelSvg = '';
            if (sp === 'crab') {
                if (s === 0) modelSvg = this.get_crab_stage_0(uid);
                else if (s === 1) modelSvg = this.get_crab_stage_1(uid);
                else if (s === 2) modelSvg = this.get_crab_stage_2(uid);
                else if (s === 3) modelSvg = this.get_crab_stage_3(uid);
                else modelSvg = this.get_crab_stage_4(uid);
            } else if (sp === 'shrimp') {
                if (s === 0) modelSvg = this.get_shrimp_stage_0(uid);
                else if (s === 1) modelSvg = this.get_shrimp_stage_1(uid);
                else if (s === 2) modelSvg = this.get_shrimp_stage_2(uid);
                else if (s === 3) modelSvg = this.get_shrimp_stage_3(uid);
                else modelSvg = this.get_shrimp_stage_4(uid);
            } else if (sp === 'octopus') {
                if (s === 0) modelSvg = this.get_octo_stage_0(uid);
                else if (s === 1) modelSvg = this.get_octo_stage_1(uid);
                else if (s === 2) modelSvg = this.get_octo_stage_2(uid);
                else if (s === 3) modelSvg = this.get_octo_stage_3(uid);
                else modelSvg = this.get_octo_stage_4(uid);
            } else if (sp === 'turtle') {
                if (s === 0) modelSvg = this.get_turtle_stage_0(uid);
                else if (s === 1) modelSvg = this.get_turtle_stage_1(uid);
                else if (s === 2) modelSvg = this.get_turtle_stage_2(uid);
                else if (s === 3) modelSvg = this.get_turtle_stage_3(uid);
                else modelSvg = this.get_turtle_stage_4(uid);
            } else if (sp === 'jellyfish') {
                if (s === 0) modelSvg = this.get_jelly_stage_0(uid);
                else if (s === 1) modelSvg = this.get_jelly_stage_1(uid);
                else if (s === 2) modelSvg = this.get_jelly_stage_2(uid);
                else if (s === 3) modelSvg = this.get_jelly_stage_3(uid);
                else modelSvg = this.get_jelly_stage_4(uid);
            } else if (sp === 'whale') {
                if (s === 0) modelSvg = this.get_whale_stage_0(uid);
                else if (s === 1) modelSvg = this.get_whale_stage_1(uid);
                else if (s === 2) modelSvg = this.get_whale_stage_2(uid);
                else if (s === 3) modelSvg = this.get_whale_stage_3(uid);
                else modelSvg = this.get_whale_stage_4(uid);
            } else {
                if (s === 0) modelSvg = this.get_fish_stage_0(uid);
                else if (s === 1) modelSvg = this.get_fish_stage_1(uid);
                else if (s === 2) modelSvg = this.get_fish_stage_2(uid);
                else if (s === 3) modelSvg = this.get_fish_stage_3(uid);
                else modelSvg = this.get_fish_stage_4(uid);
            }

            const titles = {
                fish: '纸灵锦',
                crab: '纸灵蟹',
                shrimp: '纸灵虾',
                octopus: '纸灵章',
                turtle: '纸灵龟',
                jellyfish: '纸灵水母',
                whale: '纸灵鲸'
            };
            const title = `${titles[sp] || '纸灵伴侣'} (第${s + 1}阶)`;

            return `
                <div class="origami-viewport species-${sp} stage-${s} emotion-${emotion}" 
                     data-species="${sp}" data-stage="${s}"
                     style="width:${w}px; height:${h}px;" title="${title}">
                    <svg viewBox="0 0 100 100" class="origami-pet-svg stage-${s}" style="width:100%; height:100%;">
                        <defs>
                            <filter id="${uid}_shadow" x="-30%" y="-30%" width="160%" height="160%">
                                <feDropShadow dx="0" dy="3.5" stdDeviation="3" flood-color="rgba(15, 23, 42, 0.22)"/>
                            </filter>
                        </defs>
                        <g filter="url(#${uid}_shadow)">
                            ${modelSvg}
                        </g>
                    </svg>
                </div>
            `.trim();
        }
    };

    // 初始化核心系统
    PetVector.init();
    PetSpriteEngine.init();
    PetLifeSystem.init();
    PetEmotionSystem.init();

    return {
        Vector: PetVector,
        Sprite: PetSpriteEngine,
        Origami: PetOrigamiEngine,
        Life: PetLifeSystem,
        Skills: PetSkillSystem,
        Emotion: PetEmotionSystem,

        // 统一角色形象渲染入口 (全量采用现代微立体几何切面折纸引擎)
        renderAvatar(species, stageIndex = 0, opts = {}) {
            return PetOrigamiEngine.renderSvg(species, stageIndex, opts);
        }
    };
})();

window.PetEngine = PetEngine;
