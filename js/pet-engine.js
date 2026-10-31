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
    // --- 2. 虚拟生命体与深度养成系统 (PET LIFE SYSTEM) ---
    const PetLifeSystem = {
        STORAGE_KEY: 'bingo_child_pet_v2',

        init() {
            this.checkSatietyDecay();
            setInterval(() => this.checkSatietyDecay(), 60000); // 每一分钟自检一次
        },

        getData() {
            try {
                let data = null;
                const v2 = localStorage.getItem(this.STORAGE_KEY);
                if (v2) {
                    data = JSON.parse(v2);
                } else {
                    // 兼容读取 v1 数据
                    const v1 = localStorage.getItem('bingo_child_pet');
                    if (v1) data = JSON.parse(v1);
                }

                if (!data || typeof data !== 'object') {
                    data = {};
                }

                return {
                    type: data.type || 'fish',
                    customName: data.customName || '小泡鱼',
                    exp: data.exp || 0,
                    feedCount: data.feedCount || 0,
                    level: data.level || 1,
                    equippedStage: data.equippedStage ?? null,
                    // v2 新增生命体属性
                    satiety: Math.max(0, Math.min(100, data.satiety ?? 85)), // 饱腹度 0~100
                    lastSatietyDecay: data.lastSatietyDecay || Date.now(),
                    bondExp: data.bondExp || 0,                              // 亲密度经验
                    bondLevel: data.bondLevel || 1,                          // 亲密度等级 1~10
                    shells: Math.max(0, data.shells ?? 20),                  // 贝壳币 (初始赠送20)
                    skillsUsedInQuiz: data.skillsUsedInQuiz || 0             // 当局答题已用技能数
                };
            } catch (e) {
                console.error('读取宠物生命体数据失败:', e);
                return {
                    type: 'fish', customName: '小泡鱼', exp: 0, feedCount: 0, level: 1,
                    equippedStage: null, satiety: 85, lastSatietyDecay: Date.now(),
                    bondExp: 0, bondLevel: 1, shells: 20, skillsUsedInQuiz: 0
                };
            }
        },

        saveData(data) {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
                // 同时同步一份给老系统
                localStorage.setItem('bingo_child_pet', JSON.stringify({
                    type: data.type, customName: data.customName, exp: data.exp,
                    feedCount: data.feedCount, level: data.level, equippedStage: data.equippedStage
                }));
            } catch (e) {
                console.error('保存宠物生命体数据失败:', e);
            }
        },

        // 自然衰减机制：每在应用中活跃 15 分钟衰减 1 点饱腹度
        checkSatietyDecay() {
            const data = this.getData();
            const now = Date.now();
            const minutes = (now - (data.lastSatietyDecay || now)) / (1000 * 60);
            if (minutes >= 15) {
                const drop = Math.floor(minutes / 15);
                data.satiety = Math.max(10, data.satiety - drop);
                data.lastSatietyDecay = now;
                this.saveData(data);
                if (typeof updatePetWidgets === 'function') updatePetWidgets();
            }
        },

        // 答对投喂美食
        feed(foodBonus = 15) {
            const data = this.getData();
            const oldSatiety = data.satiety;
            data.satiety = Math.min(100, data.satiety + foodBonus);
            data.feedCount += 1;
            data.bondExp += 6;
            data.shells += 2; // 每做对一题获得 2 个贝壳币

            // 亲密度等级算法 (每级所需经验 30, 80, 160...)
            const nextBondExp = data.bondLevel * 45;
            if (data.bondExp >= nextBondExp && data.bondLevel < 10) {
                data.bondLevel += 1;
                if (typeof PetSound !== 'undefined') PetSound.cheer();
                if (window.roamingPet) {
                    window.roamingPet.say(`💖 羁绊提升！我们达成 Lv.${data.bondLevel} 亲密伙伴啦！`, 4200);
                }
            }

            this.saveData(data);
            return {
                satiety: data.satiety,
                satietyGained: data.satiety - oldSatiety,
                bondLevel: data.bondLevel,
                shells: data.shells
            };
        },

        // 消耗贝壳币
        spendShells(amount) {
            const data = this.getData();
            if (data.shells >= amount) {
                data.shells -= amount;
                this.saveData(data);
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

    // 初始化核心系统
    PetVector.init();
    PetLifeSystem.init();
    PetEmotionSystem.init();

    return {
        Vector: PetVector,
        Life: PetLifeSystem,
        Skills: PetSkillSystem,
        Emotion: PetEmotionSystem
    };
})();

window.PetEngine = PetEngine;
