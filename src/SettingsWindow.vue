<template>
  <div class="settings-window" :data-theme="theme">
    <div class="titlebar">
      <div class="titlebar-drag">
        <img v-if="iconPath" :src="iconPath" class="app-logo" alt="MKClue" />
        <span class="app-title">设置</span>
      </div>
      <div class="titlebar-controls">
        <button class="titlebar-btn close" @click="closeWindow">✕</button>
      </div>
    </div>

    <div class="settings-content">
      <section class="settings-section">
        <h2 class="section-title">外观</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">主题</span>
            <span class="setting-desc">选择应用的颜色主题</span>
          </div>
          <div class="theme-selector">
            <button 
              class="theme-btn" 
              :class="{ active: theme === 'dark' }"
              @click="setTheme('dark')"
            >
              🌙 深色
            </button>
            <button 
              class="theme-btn" 
              :class="{ active: theme === 'light' }"
              @click="setTheme('light')"
            >
              ☀️ 浅色
            </button>
          </div>
        </div>
      </section>

      <div class="divider"></div>

      <section class="settings-section">
        <h2 class="section-title">编辑器</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">自动保存</span>
            <span class="setting-desc">编辑时自动保存文件</span>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="autoSave" @change="saveSettings">
            <span class="switch-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">实时预览</span>
            <span class="setting-desc">编辑时实时更新预览</span>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="livePreview" @change="saveSettings">
            <span class="switch-slider"></span>
          </label>
        </div>
      </section>

      <div class="divider"></div>

      <section class="settings-section about-section">
        <h2 class="section-title">关于</h2>
        
        <div class="about-content">
          <img v-if="iconPath" :src="iconPath" class="app-logo-large" alt="MKClue" />
          <h3 class="app-name">MKClue</h3>
          <p class="app-version">版本 {{ version }}</p>
          <p class="app-desc">优雅的 Markdown 编辑器</p>
          
          <div class="author-info">
            <span class="author-label">作者</span>
            <span class="author-name">Lostiz</span>
          </div>
          
          <a href="#" class="github-link" @click.prevent="openGitHub">
            <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </a>
          
          <div class="tech-info">
            <div class="tech-item">
              <span class="tech-label">Electron</span>
              <span class="tech-value">{{ electronVersion }}</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">Node.js</span>
              <span class="tech-value">{{ nodeVersion }}</span>
            </div>
            <div class="tech-item">
              <span class="tech-label">平台</span>
              <span class="tech-value">{{ platform }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
  name: 'SettingsWindow',
  setup() {
    const theme = ref('dark');
    const autoSave = ref(true);
    const livePreview = ref(true);
    const version = ref('1.0.0');
    const electronVersion = ref('');
    const nodeVersion = ref('');
    const platform = ref('');
    const iconPath = ref(null);

    const loadSettings = async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.getConfig();
        if (result && result.success) {
          theme.value = result.config.theme || 'dark';
          autoSave.value = result.config.autoSave !== false;
          livePreview.value = result.config.livePreview !== false;
        }

        const appInfo = await window.electronAPI.getAppInfo();
        if (appInfo.success) {
          version.value = appInfo.info.version;
          electronVersion.value = appInfo.info.electron;
          nodeVersion.value = appInfo.info.node;
          platform.value = appInfo.info.platform === 'win32' ? 'Windows' : 
                          appInfo.info.platform === 'darwin' ? 'macOS' : 'Linux';
        }
        
        const iconResult = await window.electronAPI.getIconPath();
        if (iconResult) {
          iconPath.value = iconResult;
        }
      } else {
        const savedTheme = localStorage.getItem('mkclue-theme');
        if (savedTheme) theme.value = savedTheme;
        iconPath.value = '/icon.png';
      }

      document.documentElement.setAttribute('data-theme', theme.value);
    };

    const setTheme = (newTheme) => {
      theme.value = newTheme;
      document.documentElement.setAttribute('data-theme', newTheme);
      saveSettings();
    };

    const saveSettings = async () => {
      const config = {
        theme: theme.value,
        autoSave: autoSave.value,
        livePreview: livePreview.value
      };

      if (window.electronAPI) {
        await window.electronAPI.saveConfig(config);
      } else {
        localStorage.setItem('mkclue-theme', theme.value);
      }
    };

    const closeWindow = () => {
      if (window.electronAPI) {
        window.electronAPI.windowClose('settings');
      }
    };

    const openGitHub = () => {
      if (window.electronAPI) {
        window.electronAPI.openExternal('https://github.com/Lostiz');
      } else {
        window.open('https://github.com/Lostiz', '_blank');
      }
    };

    onMounted(() => {
      loadSettings();
    });

    return {
      theme,
      autoSave,
      livePreview,
      version,
      electronVersion,
      nodeVersion,
      platform,
      iconPath,
      setTheme,
      saveSettings,
      closeWindow,
      openGitHub
    };
  }
};
</script>

<style scoped>
.settings-window {
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
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
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

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.settings-section {
  margin-bottom: 8px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 14px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.theme-selector {
  display: flex;
  gap: 8px;
}

.theme-btn {
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-btn:hover {
  background: var(--bg-hover);
}

.theme-btn.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-primary);
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 16px 0;
}

.about-content {
  text-align: center;
  padding: 16px 0;
}

.app-logo-large {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: contain;
  margin: 0 auto 14px;
}

.app-name {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.app-version {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.app-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.author-label {
  font-size: 12px;
  color: var(--text-muted);
}

.author-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
}

.github-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.github-icon {
  width: 18px;
  height: 18px;
}

.tech-info {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.tech-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tech-label {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tech-value {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
}

.switch {
  position: relative;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  transition: 0.3s;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-muted);
  border-radius: 50%;
  transition: 0.3s;
}

.switch input:checked + .switch-slider {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.switch input:checked + .switch-slider:before {
  transform: translateX(20px);
  background-color: var(--bg-primary);
}
</style>
