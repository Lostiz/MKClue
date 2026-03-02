<p align="center"><img src="icon.png" style="zoom:40%;"></p>

<h1 align="center">MKClue</h1>

<div align="center">一款优雅的 Markdown 编辑器</div>

## 功能特性

### 📁 文件夹映射
- 打开本地文件夹，直接编辑磁盘文件
- 浏览文件夹树结构
- 新建文件/文件夹、重命名、删除
- 在资源管理器中显示

### 🖼️ 图片支持
- Markdown 中的图片路径自动解析
- 点击预览中的图片放大查看
- 插入图片功能

### 🎨 主题切换
- 深色主题（默认）
- 浅色主题
- 平滑过渡动画

### 🌐 多语言(目前只支持中文)
- 简体中文

### ⚡ 其他特性
- 实时预览 Markdown 渲染效果
- 自动保存文件
- 导出为 HTML
- 可打包为 Windows/Mac/Linux 应用

## 开发

```bash
# 安装依赖
bun install

# 开发模式（仅前端）
bun run dev

# 开发模式（Electron + 前端热重载）
bun run electron:dev

# 构建前端
bun run build

# 打包为桌面应用
bun run electron:build
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+O` | 打开文件夹 |
| `Ctrl+N` | 新建文档 |
| `Ctrl+S` | 保存文件 |
| `Ctrl+,` | 打开设置 |
| `Ctrl+E` | 导出HTML |
| `Ctrl+1` | 编辑模式 |
| `Ctrl+2` | 分屏模式 |
| `Ctrl+3` | 预览模式 |
| `F12` | 开发者工具 |

## 设置窗口

点击顶部的 ⚙️ 按钮打开设置窗口：

- **主题**: 深色/浅色切换
- **语言**: 界面语言选择
- **自动保存**: 编辑时自动保存
- **实时预览**: 编辑时实时更新预览
- **关于**: 应用版本信息

## 项目结构

```
mkclue/
├── electron/              # Electron 主进程
│   ├── main.js           # 主进程入口
│   └── preload.js        # 预加载脚本
├── src/                  # Vue 源码
│   ├── components/       # Vue 组件
│   │   ├── Sidebar.vue
│   │   ├── FolderExplorer.vue
│   │   ├── TreeNode.vue
│   │   ├── EditorHeader.vue
│   │   ├── EditorContainer.vue
│   │   └── NewFileModal.vue
│   ├── styles/
│   │   └── main.css      # 全局样式（含主题变量）
│   ├── App.vue           # 主应用组件
│   ├── SettingsWindow.vue # 设置窗口
│   └── main.js           # 入口文件
├── public/               # 静态资源
├── index.html            # HTML 入口
├── vite.config.js        # Vite 配置
└── package.json          # 项目配置
```

## 打包说明

打包后的应用会在 `dist-electron` 目录中生成：

- **Windows**: `.exe` 安装包
- **macOS**: `.dmg` 安装包
- **Linux**: `.AppImage` 可执行文件

## 注意事项

1. **需要 Node.js 环境** - 确保已安装 Node.js 18+
2. **Electron 打包** - 首次打包会下载 Electron 二进制文件
3. **国内网络** - 如下载慢，可设置镜像：
   ```bash
   npm config set electron_mirror https://npmmirror.com/mirrors/electron/
   ```
4. **文件夹映射** - 此功能仅在桌面应用中可用

## License

[**MIT**](LICENSE).
