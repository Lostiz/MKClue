const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openMainWindow: (options) => 
    ipcRenderer.invoke('open-main-window', options),
  
  closeWelcome: () => 
    ipcRenderer.invoke('close-welcome'),
  
  windowMinimize: (type) => 
    ipcRenderer.invoke('window-minimize', type),
  
  windowMaximize: (type) => 
    ipcRenderer.invoke('window-maximize', type),
  
  windowClose: (type) => 
    ipcRenderer.invoke('window-close', type),

  openSettings: () => 
    ipcRenderer.invoke('open-settings'),
  
  getConfig: () => 
    ipcRenderer.invoke('get-config'),
  
  saveConfig: (config) => 
    ipcRenderer.invoke('save-config', config),

  openFolderDialog: () => 
    ipcRenderer.invoke('open-folder-dialog'),
  
  saveFileDialog: (defaultName) => 
    ipcRenderer.invoke('save-file-dialog', defaultName),
  
  readFolder: (folderPath) => 
    ipcRenderer.invoke('read-folder', folderPath),
  
  readFolderTree: (folderPath, maxDepth) => 
    ipcRenderer.invoke('read-folder-tree', folderPath, maxDepth),

  readFile: (filePath) => 
    ipcRenderer.invoke('read-file', filePath),
  
  saveFile: (filePath, content) => 
    ipcRenderer.invoke('save-file', filePath, content),
  
  createFile: (filePath, content) => 
    ipcRenderer.invoke('create-file', filePath, content),
  
  createFolder: (folderPath) => 
    ipcRenderer.invoke('create-folder', folderPath),
  
  deleteItem: (itemPath) => 
    ipcRenderer.invoke('delete-item', itemPath),
  
  renameItem: (oldPath, newName) => 
    ipcRenderer.invoke('rename-item', oldPath, newName),
  
  moveItem: (sourcePath, targetPath) => 
    ipcRenderer.invoke('move-item', sourcePath, targetPath),
  
  fileExists: (filePath) => 
    ipcRenderer.invoke('file-exists', filePath),
  
  showItemInFolder: (filePath) => 
    ipcRenderer.invoke('show-item-in-folder', filePath),

  resolveImagePaths: (content, mdFilePath) => 
    ipcRenderer.invoke('resolve-image-paths', content, mdFilePath),
  
  selectImage: () => 
    ipcRenderer.invoke('select-image'),
  
  getFileDir: (filePath) => 
    ipcRenderer.invoke('get-file-dir', filePath),
  
  copyImageToFolder: (imagePath, targetFolder) => 
    ipcRenderer.invoke('copy-image-to-folder', imagePath, targetFolder),

  getAppInfo: () => 
    ipcRenderer.invoke('get-app-info'),
  
  getIconPath: () => 
    ipcRenderer.invoke('get-icon-path'),
  
  openExternal: (url) => 
    ipcRenderer.invoke('open-external', url),

  exportHTML: (filePath, content, title) => 
    ipcRenderer.invoke('export-html', { filePath, content, title }),

  onFolderOpened: (callback) => 
    ipcRenderer.on('folder-opened', (event, folderPath) => callback(folderPath)),
  
  onFileOpened: (callback) => 
    ipcRenderer.on('file-opened', (event, fileInfo) => callback(fileInfo)),
  
  onConfigChanged: (callback) => 
    ipcRenderer.on('config-changed', (event, config) => callback(config)),

  removeAllListeners: (channel) => 
    ipcRenderer.removeAllListeners(channel)
});
