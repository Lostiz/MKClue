const { app, BrowserWindow, dialog, ipcMain, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let settingsWindow = null;
let welcomeWindow = null;

function getResourcePath(...segments) {
  return path.join(__dirname, '..', ...segments);
}

function getIndexHtmlPath() {
  return getResourcePath('dist', 'index.html');
}

function getIconPath() {
  const distIcon = getResourcePath('dist', 'icon.png');
  if (fs.existsSync(distIcon)) return distIcon;
  
  const publicIcon = getResourcePath('public', 'icon.png');
  if (fs.existsSync(publicIcon)) return publicIcon;
  
  if (process.resourcesPath) {
    const resourcesIcon = path.join(process.resourcesPath, 'public', 'icon.png');
    if (fs.existsSync(resourcesIcon)) return resourcesIcon;
  }
  
  return null;
}

function getIconUrl() {
  const iconPath = getIconPath();
  if (iconPath) return 'file:///' + iconPath.replace(/\\/g, '/');
  return null;
}

function loadIcon() {
  const iconPath = getIconPath();
  if (iconPath) return nativeImage.createFromPath(iconPath);
  return null;
}

const appConfig = {
  theme: 'dark',
  language: 'zh-CN',
  devTools: false,
  autoSave: true,
  livePreview: true
};

function loadConfig() {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      Object.assign(appConfig, config);
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  }
  return appConfig;
}

function saveConfig(config) {
  const configPath = path.join(app.getPath('userData'), 'config.json');
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    Object.assign(appConfig, config);
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

function createWelcomeWindow() {
  const icon = loadIcon();
  const indexPath = getIndexHtmlPath();
  
  welcomeWindow = new BrowserWindow({
    width: 480,
    height: 420,
    minWidth: 420,
    minHeight: 380,
    backgroundColor: '#0f0f14',
    title: 'MKClue',
    frame: false,
    resizable: true,
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      sandbox: false
    }
  });

  if (app.isPackaged) {
    if (fs.existsSync(indexPath)) {
      welcomeWindow.loadFile(indexPath, { query: { window: 'welcome' } });
    }
  } else {
    welcomeWindow.loadURL('http://localhost:5173?window=welcome');
    welcomeWindow.webContents.openDevTools();
  }

  welcomeWindow.on('closed', () => {
    welcomeWindow = null;
  });
}

function createMainWindow() {
  const icon = loadIcon();
  const indexPath = getIndexHtmlPath();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f0f14',
    title: 'MKClue',
    frame: false,
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      sandbox: false
    }
  });

  if (app.isPackaged) {
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    }
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  const icon = loadIcon();
  const indexPath = getIndexHtmlPath();

  settingsWindow = new BrowserWindow({
    width: 480,
    height: 560,
    minWidth: 400,
    minHeight: 400,
    backgroundColor: '#0f0f14',
    title: 'MKClue 设置',
    parent: mainWindow,
    frame: false,
    resizable: true,
    icon: icon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      sandbox: false
    }
  });

  if (app.isPackaged) {
    settingsWindow.loadFile(indexPath, { query: { window: 'settings' } });
  } else {
    settingsWindow.loadURL('http://localhost:5173?window=settings');
  }

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

ipcMain.handle('open-main-window', (event, options) => {
  welcomeWindow?.close();
  createMainWindow();
  
  mainWindow.webContents.once('did-finish-load', () => {
    if (options?.folder) {
      mainWindow?.webContents.send('folder-opened', options.folder);
    }
    if (options?.newFile) {
      mainWindow?.webContents.send('file-opened', options.newFile);
    }
  });
  
  return { success: true };
});

ipcMain.handle('close-welcome', () => {
  welcomeWindow?.close();
  return { success: true };
});

ipcMain.handle('window-minimize', (event, type) => {
  const win = type === 'settings' ? settingsWindow : 
              type === 'welcome' ? welcomeWindow : mainWindow;
  win?.minimize();
  return { success: true };
});

ipcMain.handle('window-maximize', (event, type) => {
  const win = type === 'settings' ? settingsWindow : 
              type === 'welcome' ? welcomeWindow : mainWindow;
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
  return { success: true };
});

ipcMain.handle('window-close', (event, type) => {
  const win = type === 'settings' ? settingsWindow : 
              type === 'welcome' ? welcomeWindow : mainWindow;
  win?.close();
  return { success: true };
});

ipcMain.handle('open-settings', () => {
  createSettingsWindow();
  return { success: true };
});

ipcMain.handle('get-config', () => {
  return { success: true, config: appConfig };
});

ipcMain.handle('save-config', (event, config) => {
  saveConfig(config);
  mainWindow?.webContents.send('config-changed', config);
  welcomeWindow?.webContents.send('config-changed', config);
  return { success: true };
});

ipcMain.handle('open-folder-dialog', async () => {
  const win = mainWindow || welcomeWindow;
  const result = await dialog.showOpenDialog(win, {
    title: '选择文件夹',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
  const win = mainWindow || welcomeWindow;
  const result = await dialog.showSaveDialog(win, {
    title: '保存文档',
    defaultPath: defaultName || '新文档.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });
  if (result.canceled) {
    return null;
  }
  return result.filePath;
});

ipcMain.handle('read-folder', async (event, folderPath) => {
  try {
    const items = fs.readdirSync(folderPath, { withFileTypes: true });
    const structure = items.map(item => {
      const itemPath = path.join(folderPath, item.name);
      const stats = fs.statSync(itemPath);
      return {
        name: item.name,
        path: itemPath,
        type: item.isDirectory() ? 'folder' : 'file',
        extension: item.isFile() ? path.extname(item.name).toLowerCase() : null,
        size: stats.size,
        modified: stats.mtime
      };
    });
    
    structure.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    
    return { success: true, items: structure };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-folder-tree', async (event, folderPath, maxDepth = 5) => {
  function readDirRecursive(dirPath, depth = 0) {
    if (depth > maxDepth) return [];
    
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const result = [];
      
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') continue;
        
        const itemPath = path.join(dirPath, item.name);
        const node = {
          name: item.name,
          path: itemPath,
          type: item.isDirectory() ? 'folder' : 'file',
          extension: item.isFile() ? path.extname(item.name).toLowerCase() : null
        };
        
        if (item.isDirectory()) {
          node.children = readDirRecursive(itemPath, depth + 1);
          node.expanded = false;
        }
        
        result.push(node);
      }
      
      result.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name, 'zh-CN');
      });
      
      return result;
    } catch (error) {
      return [];
    }
  }
  
  try {
    const rootName = path.basename(folderPath);
    const tree = {
      name: rootName,
      path: folderPath,
      type: 'folder',
      children: readDirRecursive(folderPath),
      expanded: true,
      isRoot: true
    };
    return { success: true, tree };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
    
    if (imageExts.includes(ext)) {
      const buffer = fs.readFileSync(filePath);
      const base64 = buffer.toString('base64');
      const mimeType = getMimeType(ext);
      return { 
        success: true, 
        isImage: true,
        dataUrl: `data:${mimeType};base64,${base64}`
      };
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content, isImage: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

function getMimeType(ext) {
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

ipcMain.handle('save-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-file', async (event, filePath, content = '') => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-folder', async (event, folderPath) => {
  try {
    fs.mkdirSync(folderPath, { recursive: true });
    return { success: true, path: folderPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-item', async (event, itemPath) => {
  try {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      fs.rmSync(itemPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(itemPath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-item', async (event, oldPath, newName) => {
  try {
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file-exists', async (event, filePath) => {
  try {
    return { success: true, exists: fs.existsSync(filePath) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-item-in-folder', async (event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('resolve-image-paths', async (event, content, mdFilePath) => {
  try {
    const mdDir = path.dirname(mdFilePath);
    console.log('解析图片路径, mdDir:', mdDir);
    
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
    
    // 处理 Markdown 格式: ![alt](path)
    const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let content1 = content.replace(mdImageRegex, (match, alt, imgPath) => {
      if (imgPath.startsWith('data:')) return match;
      if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return match;
      
      const fullPath = path.isAbsolute(imgPath) 
        ? path.normalize(imgPath) 
        : path.normalize(path.resolve(mdDir, imgPath));
      
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        if (imageExts.includes(ext)) {
          try {
            const buffer = fs.readFileSync(fullPath);
            const base64 = buffer.toString('base64');
            const mimeType = getMimeType(ext);
            console.log('MD图片转换成功:', imgPath);
            return `![${alt}](data:${mimeType};base64,${base64})`;
          } catch (e) {
            console.error('读取图片失败:', e);
          }
        }
      }
      return match;
    });
    
    // 处理 HTML 格式: <img src="path" ...>
    const htmlImageRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let content2 = content1.replace(htmlImageRegex, (match, imgPath) => {
      if (imgPath.startsWith('data:')) return match;
      if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return match;
      
      const fullPath = path.isAbsolute(imgPath) 
        ? path.normalize(imgPath) 
        : path.normalize(path.resolve(mdDir, imgPath));
      
      console.log('HTML图片路径:', imgPath, '-> 完整路径:', fullPath, '存在:', fs.existsSync(fullPath));
      
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        if (imageExts.includes(ext)) {
          try {
            const buffer = fs.readFileSync(fullPath);
            const base64 = buffer.toString('base64');
            const mimeType = getMimeType(ext);
            console.log('HTML图片转换成功:', imgPath, '大小:', buffer.length);
            return match.replace(imgPath, `data:${mimeType};base64,${base64}`);
          } catch (e) {
            console.error('读取图片失败:', e);
          }
        }
      }
      return match;
    });
    
    return { success: true, content: content2 };
  } catch (error) {
    console.error('resolve-image-paths 错误:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-image', async () => {
  const win = mainWindow || welcomeWindow;
  const result = await dialog.showOpenDialog(win, {
    title: '选择图片',
    filters: [
      { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'] }
    ],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('get-file-dir', async (event, filePath) => {
  try {
    return { success: true, dir: path.dirname(filePath) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-image-to-folder', async (event, imagePath, targetFolder) => {
  try {
    console.log('复制图片:', imagePath, '到目录:', targetFolder);
    const fileName = path.basename(imagePath);
    const targetPath = path.join(targetFolder, fileName);
    
    let finalPath = targetPath;
    let finalName = fileName;
    if (fs.existsSync(targetPath)) {
      const ext = path.extname(fileName);
      const name = path.basename(fileName, ext);
      finalName = `${name}_${Date.now()}${ext}`;
      finalPath = path.join(targetFolder, finalName);
    }
    
    fs.copyFileSync(imagePath, finalPath);
    console.log('复制成功, 最终路径:', finalPath, '文件名:', finalName);
    return { success: true, path: finalPath, name: finalName };
  } catch (error) {
    console.error('复制图片失败:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-app-info', () => {
  return {
    success: true,
    info: {
      name: 'MKClue',
      version: '1.0.0',
      electron: process.versions.electron,
      node: process.versions.node,
      platform: process.platform
    }
  };
});

ipcMain.handle('get-icon-path', () => {
  return getIconUrl();
});

ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-html', async (event, { filePath, content, title }) => {
  try {
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 16px; }
    h2 { color: #444; margin-top: 32px; }
    code { background: #f4f4f4; padding: 2px 8px; border-radius: 4px; }
    pre { background: #f4f4f4; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #c9a961; padding-left: 16px; color: #666; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  loadConfig();
  createWelcomeWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWelcomeWindow();
  }
});
