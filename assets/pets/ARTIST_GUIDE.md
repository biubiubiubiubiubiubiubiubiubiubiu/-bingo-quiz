# Bingo Quiz 伴学萌宠外部画师素材接入指南 (Artist Asset & Integration Guide)

本指南专为需要引入**网络优质画师图包、开源游戏精灵素材或定制原创原画**而编写，让您能够轻松将外部美术资源无缝接入 Bingo Quiz 路线 B 精灵动画系统。

---

## 一、推荐优质外部画师与素材下载渠道

以下渠道均为游戏与应用行业公认的顶级 2D 萌宠/海洋生物素材源，涵盖免费商用与高质量原画：

### 1. Kenney.nl (全球顶级 CC0 公版游戏美术库)
- **官网主页**：[https://kenney.nl](https://kenney.nl)
- **精选资源包**：
  - **Fish Pack** (包含小丑鱼、河豚、热带鱼、海星、螃蟹等几十种海洋生物高清精灵图与矢量 SVG)
  - **Fantasy Creatures / Animal Pack**
- **授权协议**：**CC0 1.0 Universal**（公有领域，100% 允许个人及商用，无需署名）
- **特点**：造型极其纯净呆萌、色彩鲜亮，儿童与学生护眼亲和力最佳。

### 2. CraftPix.net (专业 2D 独立游戏动画团队)
- **官网主页**：[https://craftpix.net](https://craftpix.net)
- **精选资源包**：
  - **Octopus, Jellyfish, Shark and Sea Creatures Animated Sprites**
  - **Free Underwater Enemies / Marine Animals Pixel Art & Vector Pack**
- **包含动作**：每套生物均自带完整的 `Idle`（呼吸待机）、`Walk/Swim`（移动巡游）、`Attack/Cheer`（技能欢呼）、`Hurt/Sleep`（受惊休眠）等 6~8 帧完整序列。
- **授权协议**：Free License（免费商用）
- **特点**：动画富有经典迪士尼动画法则的挤压与拉伸（Squash & Stretch）张力，Q 弹生动。

### 3. Itch.io (独立游戏原画师与自由插画师社区)
- **搜索入口**：[itch.io/game-assets/tag-ocean](https://itch.io/game-assets/tag-ocean) 或 [itch.io/game-assets/tag-pixel-art](https://itch.io/game-assets/tag-pixel-art)
- **精选原画包**：
  - **Chie Waters Ocean Animals Starter Pack**
  - **Seliel the Shaper - Aquatic Critters & Sea Life**
- **特点**：风格极具艺术辨识度，涵盖日系治愈水彩厚涂与宝可梦级别复古点阵像素风。

### 4. Shimeji 桌宠开源社区 (DeviantArt & Shimejis.xyz)
- **社区网址**：[https://shimejis.xyz](https://shimejis.xyz)
- **特点**：拥有上万款开源桌宠完整动作图集（通常包含行走、爬墙、拖拽、打盹 46 个标准帧）。

---

## 二、素材规格与切片技术标准

外部画师提供的图集只需遵循以下简单规范，即可直接被本系统自动播放：

| 属性 | 规范要求 | 说明 |
| :--- | :--- | :--- |
| **文件格式** | `.png`、`.webp` 或 `.svg` | **必须带 Alpha 透明通道**（无白底或杂色背景） |
| **单帧基准尺寸** | `128×128px` 或 `256×256px` | 在手机/屏幕上按 `64×64px` 渲染，2x/3x Retina 超高清抗锯齿 |
| **排列格式** | **单行横向连排 (Horizontal Strip)** | 例如 6 帧动画，总图尺寸为 $(6 \times 128) \times 128\text{px} = 768 \times 128\text{px}$ |
| **基准朝向** | **默认头部朝右（或朝左）** | 巡游移动时，系统引擎会自动在身体层应用 `scaleX(-1)` 镜像，无需画师绘制反向图 |
| **动作状态命名** | `idle`, `move`, `think`, `celebrate`, `sleep`, `drag`, `climb` | 与系统状态机完全对应 |

---

## 三、三步快速替换新素材

若您下载或获得了外部画师绘制的图包（例如一套新的海豚或猫咪）：

### 第一步：将切片文件拷贝到资源目录
将横向连排图放入 `assets/pets/{生物英文名}/` 目录下，例如：
```
assets/pets/dolphin/
  ├── idle.png       (例如 4 帧，512x128px)
  ├── move.png       (例如 6 帧，768x128px)
  ├── think.png      (例如 4 帧，512x128px)
  ├── celebrate.png  (例如 6 帧，768x128px)
  ├── sleep.png      (例如 3 帧，384x128px)
  └── drag.png       (例如 4 帧，512x128px)
```

### 第二步：登记到 `assets/pets/manifest.json`
在 `manifest.json` 的 `species` 中配置新生物与帧数（`frames`）和帧率（`fps`）：
```json
"dolphin": {
  "name": "海豚奇奇",
  "frameWidth": 128,
  "frameHeight": 128,
  "actions": {
    "idle": { "frames": 4, "fps": 4, "file": "dolphin/idle.png", "loop": true },
    "move": { "frames": 6, "fps": 8, "file": "dolphin/move.png", "loop": true },
    "think": { "frames": 4, "fps": 3, "file": "dolphin/think.png", "loop": true },
    "celebrate": { "frames": 6, "fps": 9, "file": "dolphin/celebrate.png", "loop": true },
    "sleep": { "frames": 3, "fps": 2, "file": "dolphin/sleep.png", "loop": true },
    "drag": { "frames": 4, "fps": 8, "file": "dolphin/drag.png", "loop": true }
  }
}
```

### 第三步：在 `sw.js` 缓存中添加新路径
在 `sw.js` 的 `ASSETS` 列表中添加新放入的文件路径，确保断网离线时依然秒开。

刷新浏览器页面，全新的外部画师伴学萌宠即刻活灵活现地登场！
