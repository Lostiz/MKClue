<template>
  <div class="app-container" :data-theme="theme">
    <div class="titlebar">
      <div class="titlebar-drag">
        <img v-if="iconPath" :src="iconPath" class="app-logo" alt="MKClue" />
        <span class="app-title">MKClue</span>
        <span class="app-separator" v-if="currentFileName">·</span>
        <span class="current-file-name" v-if="currentFileName">{{ currentFileName }}</span>
      </div>
      <div class="titlebar-controls">
        <button class="titlebar-btn minimize" @click="minimizeWindow">─</button>
        <button class="titlebar-btn maximize" @click="maximizeWindow">□</button>
        <button class="titlebar-btn close" @click="closeWindow">✕</button>
      </div>
    </div>

    <div class="main-wrapper">
      <Sidebar
        :sidebar-open="sidebarOpen"
        :current-folder="currentFolder"
        :folder-file="folderFile"
        :theme="theme"
        @toggle-sidebar="toggleSidebar"
        @open-folder="openFolder"
        @close-folder="closeFolder"
        @select-folder-file="selectFolderFile"
        @folder-changed="refreshFolder"
        @new-file="createNewDocument"
      />

      <div class="main-content" :class="{ 'sidebar-collapsed': !sidebarOpen }">
        <button class="toggle-sidebar" @click="toggleSidebar">
          {{ sidebarOpen ? '◀' : '▶' }}
        </button>

        <EditorHeader
          :current-file="displayFile"
          :view-mode="viewMode"
          :is-folder-file="!!folderFile"
          :theme="theme"
          @change-view="viewMode = $event"
          @save="saveCurrentFile"
          @open-settings="openSettings"
          @insert-image="insertImage"
        />

        <EditorContainer
          :current-file="displayFile"
          :view-mode="viewMode"
          :rendered-content="renderedContent"
          :theme="theme"
          @update-content="updateContent"
          @image-click="showImagePreview"
        />
      </div>
    </div>

    <div 
      v-if="previewImage" 
      class="image-preview-overlay" 
      @click="previewImage = null"
    >
      <img :src="previewImage" alt="Preview" @click.stop>
      <button class="close-preview" @click="previewImage = null">✕</button>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked';
import Sidebar from './components/Sidebar.vue';
import EditorHeader from './components/EditorHeader.vue';
import EditorContainer from './components/EditorContainer.vue';

export default {
  name: 'App',
  components: {
    Sidebar,
    EditorHeader,
    EditorContainer
  },
  data() {
    return {
      currentFolder: null,
      folderFile: null,
      folderFileContent: '',
      sidebarOpen: true,
      viewMode: 'split',
      theme: 'dark',
      language: 'zh-CN',
      iconPath: null,
      previewImage: null,
      renderedContent: ''
    };
  },
  computed: {
    displayFile() {
      if (this.folderFile) {
        return {
          name: this.folderFile.name,
          path: this.folderFile.path,
          content: this.folderFileContent
        };
      }
      return null;
    },
    currentFileName() {
      return this.folderFile?.name || '';
    }
  },
  watch: {
    folderFileContent(newContent) {
      this.updateRenderedContent(newContent);
    },
    folderFile(newFile) {
      if (!newFile) {
        this.renderedContent = '';
      }
    }
  },
  methods: {
    async updateRenderedContent(content) {
      if (!content) {
        this.renderedContent = '';
        return;
      }
      
      if (this.folderFile?.path && window.electronAPI) {
        try {
          const result = await window.electronAPI.resolveImagePaths(content, this.folderFile.path);
          if (result && result.success) {
            this.renderedContent = marked.parse(result.content);
          } else {
            this.renderedContent = marked.parse(content);
          }
        } catch (e) {
          console.error('渲染错误:', e);
          this.renderedContent = marked.parse(content);
        }
      } else {
        this.renderedContent = marked.parse(content);
      }
    },
    
    minimizeWindow() {
      if (window.electronAPI) window.electronAPI.windowMinimize('main');
    },
    maximizeWindow() {
      if (window.electronAPI) window.electronAPI.windowMaximize('main');
    },
    closeWindow() {
      if (window.electronAPI) window.electronAPI.windowClose('main');
    },
    
    showImagePreview(src) {
      this.previewImage = src;
    },
    
    async insertImage() {
      if (!this.folderFile) {
        alert('请先打开一个文档');
        return;
      }
      
      if (window.electronAPI) {
        const imagePath = await window.electronAPI.selectImage();
        if (imagePath) {
          const dirResult = await window.electronAPI.getFileDir(this.folderFile.path);
          if (dirResult.success) {
            const mdDir = dirResult.dir;
            const result = await window.electronAPI.copyImageToFolder(imagePath, mdDir);
            if (result.success) {
              const relativePath = result.name;
              const imgSyntax = `\n![图片描述](${relativePath})\n`;
              this.folderFileContent += imgSyntax;
            }
          }
        }
      }
    },
    
    async openSettings() {
      if (window.electronAPI) {
        await window.electronAPI.openSettings();
      }
    },
    
    async loadConfig() {
      if (window.electronAPI) {
        const result = await window.electronAPI.getConfig();
        if (result && result.success) {
          this.theme = result.config.theme || 'dark';
          this.language = result.config.language || 'zh-CN';
        }
        const iconResult = await window.electronAPI.getIconPath();
        if (iconResult) {
          this.iconPath = iconResult;
        }
      } else {
        this.theme = localStorage.getItem('mkclue-theme') || 'dark';
        this.iconPath = '/icon.png';
      }
      this.applyTheme();
    },
    
    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
    },
    
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    
    async openFolder() {
      if (window.electronAPI) {
        const folderPath = await window.electronAPI.openFolderDialog();
        if (folderPath) {
          this.currentFolder = folderPath;
          this.folderFile = null;
          this.folderFileContent = '';
        }
      }
    },
    
    closeFolder() {
      this.currentFolder = null;
      this.folderFile = null;
      this.folderFileContent = '';
    },
    
    async selectFolderFile(node) {
      if (node.type !== 'file') return;
      
      const ext = node.extension || '';
      const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
      
      if (imageExts.includes(ext.toLowerCase())) {
        if (window.electronAPI) {
          const result = await window.electronAPI.readFile(node.path);
          if (result.success && result.isImage) {
            this.previewImage = result.dataUrl;
          }
        }
        return;
      }
      
      if (window.electronAPI) {
        const result = await window.electronAPI.readFile(node.path);
        if (result.success) {
          this.folderFile = node;
          this.folderFileContent = result.content;
        } else {
          alert('无法读取文件: ' + result.error);
        }
      }
    },
    
    refreshFolder() {},
    
    async saveCurrentFile() {
      if (this.folderFile && window.electronAPI) {
        const result = await window.electronAPI.saveFile(this.folderFile.path, this.folderFileContent);
        if (!result.success) {
          alert('保存失败: ' + result.error);
        }
      }
    },
    
    async createNewDocument() {
      if (window.electronAPI) {
        const filePath = await window.electronAPI.saveFileDialog('新文档.md');
        if (filePath) {
          const fileName = filePath.split(/[/\\]/).pop();
          const name = fileName.replace('.md', '');
          const result = await window.electronAPI.createFile(filePath, `# ${name}\n\n开始编辑您的 Markdown 文档...`);
          if (result.success) {
            if (!this.currentFolder) {
              this.currentFolder = filePath.substring(0, filePath.lastIndexOf(/[/\\]/.test(filePath) ? (filePath.includes('\\') ? '\\' : '/') : '/'));
            }
            this.folderFile = { name: fileName, path: filePath, type: 'file' };
            this.folderFileContent = `# ${name}\n\n开始编辑您的 Markdown 文档...`;
          }
        }
      }
    },
    
    updateContent(content) {
      if (this.folderFile) {
        this.folderFileContent = content;
        if (window.electronAPI) {
          window.electronAPI.saveFile(this.folderFile.path, content);
        }
      }
    },
    
    async openFile(fileInfo) {
      if (!fileInfo || !fileInfo.path) return;
      
      const dirPath = fileInfo.path.substring(0, fileInfo.path.lastIndexOf(/[/\\]/.test(fileInfo.path) ? (fileInfo.path.includes('\\') ? '\\' : '/') : '/'));
      this.currentFolder = dirPath;
      
      if (window.electronAPI) {
        const result = await window.electronAPI.readFile(fileInfo.path);
        if (result.success) {
          this.folderFile = {
            name: fileInfo.name,
            path: fileInfo.path,
            type: 'file'
          };
          this.folderFileContent = result.content;
        }
      }
    }
  },
  async mounted() {
    await this.loadConfig();
    this.applyTheme();

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.saveCurrentFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        this.openSettings();
      }
    });

    if (window.electronAPI) {
      window.electronAPI.onFolderOpened((folderPath) => {
        this.currentFolder = folderPath;
        this.folderFile = null;
        this.folderFileContent = '';
      });
      
      window.electronAPI.onFileOpened((fileInfo) => {
        this.openFile(fileInfo);
      });
      
      window.electronAPI.onConfigChanged((config) => {
        if (config.theme) {
          this.theme = config.theme;
          this.applyTheme();
        }
        if (config.language) {
          this.language = config.language;
        }
      });
    }
  },
  beforeUnmount() {
    if (window.electronAPI) {
      window.electronAPI.removeAllListeners('folder-opened');
      window.electronAPI.removeAllListeners('file-opened');
      window.electronAPI.removeAllListeners('config-changed');
    }
  }
};
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

.titlebar {
  height: 36px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 12px;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.titlebar-drag {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.app-logo {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
  flex-shrink: 0;
}

.app-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-primary);
  flex-shrink: 0;
}

.app-separator {
  color: var(--text-muted);
  flex-shrink: 0;
}

.current-file-name {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titlebar-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.titlebar-btn {
  width: 46px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.titlebar-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.titlebar-btn.close:hover {
  background: #e81123;
  color: white;
}

.main-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
  transition: margin-left 0.3s ease;
}

.main-content.sidebar-collapsed {
  margin-left: 0;
}

.toggle-sidebar {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: none;
  padding: 12px 8px;
  cursor: pointer;
  border-radius: 0 8px 8px 0;
  color: var(--accent-primary);
  transition: all 0.2s;
  z-index: 50;
}

.toggle-sidebar:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
}

.image-preview-overlay img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.close-preview {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.close-preview:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
