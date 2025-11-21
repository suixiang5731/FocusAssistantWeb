# Focus Flow - 专注流

一个结合禅意的专注计时器应用，提供随机的“叮”声正念提醒，帮助你保持当下，提升专注力。支持 PWA，可离线运行。

## 🛠️ 技术栈

- **Core**: React 19, TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **PWA**: Service Worker, Manifest

## 📋 环境准备

在使用 VS Code 运行此项目之前，请确保您的电脑上已安装：

1.  **Node.js** (推荐 v18 或更高版本)
2.  **pnpm** (包管理工具)
    *   如果未安装，可在终端运行 `npm install -g pnpm` 进行安装。
3.  **VS Code** (Visual Studio Code 编辑器)

## 🚀 如何在本地运行 (VS Code)

请按照以下步骤在本地启动项目：

### 1. 打开项目
使用 VS Code 打开包含此代码的文件夹。

### 2. 打开终端
在 VS Code 中，点击顶部菜单栏的 **终端 (Terminal)** -> **新建终端 (New Terminal)**，或者直接使用快捷键 `Ctrl + ~` (Windows/Linux) 或 `Cmd + ~` (Mac)。

### 3. 安装依赖
在终端中输入以下命令并回车，下载项目所需的依赖包：

```bash
pnpm install
```

### 4. 启动开发服务器
依赖安装完成后，输入以下命令启动应用：

```bash
pnpm dev
```

### 5. 预览应用
终端会显示类似 `Local: http://localhost:5173/` 的链接。
*   按住 `Ctrl` (或 Mac 上的 `Cmd`) 并点击该链接。
*   或者直接在浏览器地址栏输入 `http://localhost:5173`。

## 📦 构建生产版本

如果您需要部署应用或测试 PWA 功能（Service Worker），建议构建生产版本：

1.  构建项目：
    ```bash
    pnpm build
    ```
2.  本地预览构建结果：
    ```bash
    pnpm preview
    ```

## 📱 PWA 注意事项

由于 PWA 的 Service Worker 需要 HTTPS 或 localhost 环境才能运行，在本地开发模式 (`pnpm dev`) 下通常可以正常工作。如果在手机局域网访问，可能需要配置 HTTPS 代理。
