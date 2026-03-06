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
        @delete-file="deleteCurrentDocument"
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

        <EditorToolbar
          v-if="folderFile"
          :format-mode="formatMode"
          @insert="insertToolbarSyntax"
          @insert-image="insertImage"
        />

        <EditorContainer
          ref="editorContainerRef"
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
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import katex from 'katex';
import mermaid from 'mermaid';
import Sidebar from './components/Sidebar.vue';
import EditorHeader from './components/EditorHeader.vue';
import EditorToolbar from './components/EditorToolbar.vue';
import EditorContainer from './components/EditorContainer.vue';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose'
});

const renderer = new marked.Renderer();

renderer.code = function(code, language) {
  if (language === 'mermaid') {
    return `<div class="mermaid">${code}</div>`;
  }
  const langLabel = language ? language.toLowerCase() : '';
  const displayLang = langLabel || 'code';
  let highlighted;
  if (language) {
    try {
      highlighted = hljs.highlight(code, { language }).value;
    } catch {
      highlighted = hljs.highlightAuto(code).value;
    }
  } else {
    highlighted = hljs.highlightAuto(code).value;
  }
  return `<div class="code-block-wrapper"><div class="code-lang-label">${displayLang}</div><pre><code class="hljs${langLabel ? ' language-' + langLabel : ''}">${highlighted}</code></pre></div>`;
};

marked.use({ renderer });

export default {
  name: 'App',
  components: {
    Sidebar,
    EditorHeader,
    EditorToolbar,
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
      autoSave: true,
      formatMode: 'markdown',
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

      let processedContent = content;

      if (this.folderFile?.path && window.electronAPI) {
        try {
          const result = await window.electronAPI.resolveImagePaths(content, this.folderFile.path);
          if (result && result.success) {
            processedContent = result.content;
          }
        } catch (e) {
          console.error('图片路径解析错误:', e);
        }
      }

      processedContent = this.processMath(processedContent);

      try {
        this.renderedContent = marked.parse(processedContent);
        this.$nextTick(() => {
          this.renderMermaid();
        });
      } catch (e) {
        console.error('渲染错误:', e);
        this.renderedContent = marked.parse(content);
      }
    },

    processMath(content) {
      content = content.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
        try {
          return `<div class="math-block">${katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false })}</div>`;
        } catch {
          return match;
        }
      });
      content = content.replace(/\$([^$\n]+)\$/g, (match, formula) => {
        try {
          return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return match;
        }
      });
      return content;
    },

    async renderMermaid() {
      const mermaidDivs = document.querySelectorAll('.mermaid');
      for (const div of mermaidDivs) {
        try {
          const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
          const { svg } = await mermaid.render(id, div.textContent);
          div.innerHTML = svg;
        } catch (e) {
          console.error('Mermaid渲染错误:', e);
          div.innerHTML = `<pre style="color:red;">Mermaid语法错误: ${div.textContent}</pre>`;
        }
      }
    },

    insertToolbarSyntax(syntax) {
      if (this.folderFile && this.$refs.editorContainerRef) {
        this.$refs.editorContainerRef.insertAtCursor(syntax);
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
              const imgSyntax = `![图片描述](${relativePath})`;
              
              // 使用 EditorContainer 的 insertAtCursor 方法插入到光标位置
              if (this.$refs.editorContainerRef) {
                this.$refs.editorContainerRef.insertAtCursor(imgSyntax);
              } else {
                // 如果组件不可用，则添加到末尾（兼容性处理）
                this.folderFileContent += `\n${imgSyntax}\n`;
              }
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
          this.autoSave = result.config.autoSave !== false;
          this.formatMode = result.config.formatMode || 'markdown';
        }
        const iconResult = await window.electronAPI.getIconPath();
        if (iconResult) {
          this.iconPath = iconResult;
        }
      } else {
        this.theme = localStorage.getItem('mkclue-theme') || 'dark';
        this.iconPath = '/mkclue.ico';
      }
      this.applyTheme();
    },

    applyTheme() {
      document.documentElement.setAttribute('data-theme', this.theme);
      mermaid.initialize({
        startOnLoad: false,
        theme: this.theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose'
      });
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
          const initialContent = `# ${name}\n\n开始编辑您的 Markdown 文档...`;
          const result = await window.electronAPI.createFile(filePath, initialContent);
          if (result.success) {
            const dirPath = filePath.substring(0, filePath.lastIndexOf(/[/\\]/.test(filePath) ? (filePath.includes('\\') ? '\\' : '/') : '/'));
            if (!this.currentFolder) {
              this.currentFolder = dirPath;
            }
            this.folderFile = { name: fileName, path: filePath, type: 'file', extension: '.md' };
            this.folderFileContent = initialContent;
          }
        }
      }
    },

    async deleteCurrentDocument() {
      if (!this.folderFile) {
        alert('请先选择要删除的文档');
        return;
      }
      const confirmed = confirm(`确定要删除 \"${this.folderFile.name}\" 吗？此操作不可撤销。`);
      if (!confirmed) return;

      if (window.electronAPI) {
        const result = await window.electronAPI.deleteItem(this.folderFile.path);
        if (result.success) {
          this.folderFile = null;
          this.folderFileContent = '';
        } else {
          alert('删除失败: ' + result.error);
        }
      }
    },

    updateContent(content) {
      if (this.folderFile) {
        this.folderFileContent = content;
        if (this.autoSave && window.electronAPI) {
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
        if (config.autoSave !== undefined) {
          this.autoSave = config.autoSave;
        }
        if (config.formatMode !== undefined) {
          this.formatMode = config.formatMode;
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
