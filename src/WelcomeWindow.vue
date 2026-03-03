<template>
  <div class="welcome-window" :data-theme="theme">
    <div class="titlebar">
      <div class="titlebar-drag">
        <img v-if="iconPath" :src="iconPath" class="app-logo" alt="MKClue" />
        <span class="app-title">MKClue</span>
      </div>
      <div class="titlebar-controls">
        <button class="titlebar-btn minimize" @click="minimize">─</button>
        <button class="titlebar-btn close" @click="close">✕</button>
      </div>
    </div>

    <div class="welcome-content">
      <div class="welcome-header">
        <img v-if="iconPath" :src="iconPath" class="logo-large" alt="MKClue" />
        <h1 class="welcome-title">欢迎使用 MKClue</h1>
        <p class="welcome-subtitle">优雅的 Markdown 编辑器</p>
      </div>

      <div class="welcome-actions">
        <button class="action-btn primary" @click="openFolder">
          <span class="action-icon">📁</span>
          <span class="action-text">
            <span class="action-title">打开文件夹</span>
            <span class="action-desc">选择一个包含 Markdown 文件的文件夹</span>
          </span>
        </button>

        <button class="action-btn" @click="createNewDocument">
          <span class="action-icon">📝</span>
          <span class="action-text">
            <span class="action-title">新建文档</span>
            <span class="action-desc">创建一个新的 Markdown 文档</span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'WelcomeWindow',
  setup() {
    const theme = ref('dark');
    const iconPath = ref(null);

    const loadConfig = async () => {
      try {
        if (window.electronAPI) {
          const result = await window.electronAPI.getConfig();
          if (result && result.success) {
            theme.value = result.config.theme || 'dark';
          }
          const iconResult = await window.electronAPI.getIconPath();
          if (iconResult) {
            iconPath.value = iconResult;
          }
        }
      } catch (e) {
        console.error('Load config error:', e);
      }
      
      if (!iconPath.value) {
        iconPath.value = '/mkclue.ico';
      }
      
      document.documentElement.setAttribute('data-theme', theme.value);
    };

    const minimize = () => {
      try {
        if (window.electronAPI) {
          window.electronAPI.windowMinimize('welcome');
        }
      } catch (e) {
        console.error('Minimize error:', e);
      }
    };

    const close = () => {
      try {
        if (window.electronAPI) {
          window.electronAPI.closeWelcome();
        }
      } catch (e) {
        console.error('Close error:', e);
      }
    };

    const openFolder = async () => {
      try {
        if (window.electronAPI) {
          const folderPath = await window.electronAPI.openFolderDialog();
          if (folderPath) {
            await window.electronAPI.openMainWindow({ folder: folderPath });
          }
        }
      } catch (e) {
        console.error('Open folder error:', e);
      }
    };

    const createNewDocument = async () => {
      try {
        if (window.electronAPI) {
          const filePath = await window.electronAPI.saveFileDialog('新文档.md');
          if (filePath) {
            const fileName = filePath.split(/[/\\]/).pop();
            const name = fileName.replace('.md', '');
            await window.electronAPI.createFile(filePath, `# ${name}\n\n开始编辑您的 Markdown 文档...`);
            await window.electronAPI.openMainWindow({ 
              newFile: { path: filePath, name: fileName }
            });
          }
        }
      } catch (e) {
        console.error('Create document error:', e);
      }
    };

    onMounted(() => {
      loadConfig();
    });

    return {
      theme,
      iconPath,
      minimize,
      close,
      openFolder,
      createNewDocument
    };
  }
};
</script>

<style scoped>
.welcome-window {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
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
}

.app-logo {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
}

.app-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-primary);
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

.welcome-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 0;
}

.welcome-header {
  text-align: center;
  margin-bottom: 32px;
  flex-shrink: 0;
}

.logo-large {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: contain;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba(201, 169, 97, 0.3);
}

.welcome-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.welcome-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 360px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-btn:hover {
  background: var(--bg-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--shadow);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-color: var(--accent-primary);
}

.action-btn.primary:hover {
  box-shadow: 0 8px 24px rgba(201, 169, 97, 0.4);
}

.action-btn.primary .action-title,
.action-btn.primary .action-desc {
  color: var(--bg-primary);
}

.action-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.action-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.action-desc {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
