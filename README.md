# Focus Flow (正念专注流) 🧘✨

**Focus Flow** 是一款结合禅意与正念科学的极简专注随身应用。它摒弃了繁复冗余的功能，专注于通过随机正念提神提醒、呼吸律动光环、舒缓白噪声背景音与优雅的成果分享卡片，帮助你在工作与学习中保持当下、沉淀身心。

---

## ✨ 核心特色功能

- 🧘 **正念提神与随机响铃**：在专注倒计时过程中，系统会在设定时间范围内随机触发清脆的“正念铜磬”提示音，提示你停下紧绷的思绪，进行一次深呼吸。
- 🌬️ **自动呼吸律动光环**：Timer 开启后自动伴随 4秒吸气 / 4秒呼气 的柔和渐变与扩散光环，引导你维持稳健的呼吸节奏。
- 🎵 **Web Audio 极简白噪声**：内置舒缓雨声、潮汐海浪、柔和粉噪、纯白噪声等自然背景声，随时在首页一键开启/切换，自带音量微调。
- 🖼️ **一键专注分享海报**：专注完成后自动弹出极简总结与庆祝动画，可实时生成并下载高分辨率图片海报，支持随机刷选金句与一键复制打卡文本。
- 📊 **多维数据复盘与标签管理**：内置日/周/月柱状图与饼图统计，支持自定义标签色彩分类与番茄钟记录管理。
- 💾 **多版本历史快照备份**：提供可随时还原与拍摄的多版本自动快照机制（支持存储最多 10 份历史快照），同时支持 JSON 格式离线导入与导出。
- 📱 **PWA 离线运行**：支持响应式移动端与桌面端体验，配置 Service Worker 可离线安装为桌面应用。

---

## 🛠️ 技术栈

- **前端框架**：React 19 + TypeScript
- **构建工具**：Vite
- **样式处理**：Tailwind CSS + Lucide React 图标库
- **音频引擎**：Web Audio API (合成正念磬音与自然白噪声)
- **卡片渲染**：HTML5 Canvas API
- **庆祝特效**：Canvas Confetti
- **应用离线**：PWA (Service Worker + Web App Manifest)

---

## 🚀 本地快速启动

### 1. 环境准备
确保您的计算机上已安装 [Node.js](https://nodejs.org/) (推荐 v18 或更高版本)。

### 2. 安装依赖
```bash
npm install
# 或使用 pnpm / yarn
pnpm install
```

### 3. 启动开发服务器
```bash
npm run dev
# 或
pnpm dev
```
启动后在浏览器中打开 `http://localhost:3000` 即可预览。

### 4. 构建生产版本
```bash
npm run build
```

---

## 📤 如何提交/导出代码到 GitHub

### 方法一：通过 AI Studio 界面一键导出 (推荐)
1. 点击 AI Studio 顶部/右上角的菜单按钮或应用设置菜单。
2. 选择 **"Export to GitHub"** (或导出到 GitHub / ZIP)。
3. 关联并授权您的 GitHub 账号，选择要创建或绑定的 GitHub 仓库即可快速推送到远端。

### 方法二：在本地 Git 命令行推送
如果在本地或终端中操作，可以使用以下命令：

```bash
# 1. 初始化 Git 仓库
git init

# 2. 添加所有项目文件
git add .

# 3. 提交变更
git commit -m "feat: complete Focus Flow app with refined UI, white noise, and share poster"

# 4. 绑定您的 GitHub 远程仓库
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/focus-flow.git

# 5. 推送到 GitHub
git push -u origin main
```

---

## 📄 开源许可

MIT License

