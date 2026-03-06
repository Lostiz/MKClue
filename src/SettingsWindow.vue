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

    <div class="settings-layout">
      <div class="settings-sidebar">
        <div class="sidebar-nav">
          <button 
            v-for="item in navItems" 
            :key="item.id"
            class="nav-item"
            :class="{ active: activeSection === item.id }"
            @click="setActiveSection(item.id)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-text">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <div class="settings-main">
        <Transition name="fade-slide" mode="out-in">
          <div class="settings-content" v-if="activeSection === 'appearance'" key="appearance">
            <h2 class="section-title">外观设置</h2>
            
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
                  <span class="btn-emoji">🌙</span>
                  <span class="btn-text">深色</span>
                </button>
                <button 
                  class="theme-btn" 
                  :class="{ active: theme === 'light' }"
                  @click="setTheme('light')"
                >
                  <span class="btn-emoji">☀️</span>
                  <span class="btn-text">浅色</span>
                </button>
              </div>
            </div>
          </div>

          <div class="settings-content" v-else-if="activeSection === 'editor'" key="editor">
            <h2 class="section-title">编辑器设置</h2>
            
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
                <span class="setting-label">格式模式</span>
                <span class="setting-desc">选择工具栏插入语法的格式类型</span>
              </div>
              <div class="format-selector">
                <button 
                  class="format-btn" 
                  :class="{ active: formatMode === 'markdown' }"
                  @click="setFormatMode('markdown')"
                >
                  <span class="btn-emoji">📝</span>
                  <span class="btn-text">Markdown</span>
                </button>
                <button 
                  class="format-btn" 
                  :class="{ active: formatMode === 'html' }"
                  @click="setFormatMode('html')"
                >
                  <span class="btn-emoji">🌐</span>
                  <span class="btn-text">HTML</span>
                </button>
              </div>
            </div>
          </div>

          <div class="settings-content" v-else-if="activeSection === 'about'" key="about">
            <h2 class="section-title">关于</h2>
            
            <div class="about-content">
              <img v-if="iconPath" :src="iconPath" class="app-logo-large" alt="MKClue" />
              <h3 class="app-name">MKClue</h3>
              <p class="app-version">版本 v1.2</p>
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
          </div>
        </Transition>
      </div>
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
    const formatMode = ref('markdown');
    const version = ref('1.1.0');
    const electronVersion = ref('');
    const nodeVersion = ref('');
    const platform = ref('');
    const iconPath = ref(null);
    const activeSection = ref('appearance');

    const navItems = [
      { id: 'appearance', icon: '🎨', label: '外观' },
      { id: 'editor', icon: '✏️', label: '编辑器' },
      { id: 'about', icon: 'ℹ️', label: '关于' }
    ];

    const loadSettings = async () => {
      if (window.electronAPI) {
        const result = await window.electronAPI.getConfig();
        if (result && result.success) {
          theme.value = result.config.theme || 'dark';
          autoSave.value = result.config.autoSave !== false;
          formatMode.value = result.config.formatMode || 'markdown';
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
        iconPath.value = '/mkclue.ico';
      }

      document.documentElement.setAttribute('data-theme', theme.value);
    };

    const setActiveSection = (section) => {
      activeSection.value = section;
    };

    const setTheme = (newTheme) => {
      theme.value = newTheme;
      document.documentElement.setAttribute('data-theme', newTheme);
      saveSettings();
    };

    const setFormatMode = (mode) => {
      formatMode.value = mode;
      saveSettings();
    };

    const saveSettings = async () => {
      const config = {
        theme: theme.value,
        autoSave: autoSave.value,
        livePreview: true,
        formatMode: formatMode.value
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
      formatMode,
      version,
      electronVersion,
      nodeVersion,
      platform,
      iconPath,
      activeSection,
      navItems,
      setActiveSection,
      setTheme,
      setFormatMode,
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
  -webkit-app-region: drag;
  flex-shrink: 0;
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
  transition: background 0.15s, color 0.15s;
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

.settings-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.settings-sidebar {
  width: 200px;
  min-width: 200px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: 16px 0;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.nav-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  font-weight: 500;
  white-space: nowrap;
}

.settings-main {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-primary);
}

.settings-content {
  padding: 24px 32px;
  min-width: 400px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.setting-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
  gap: 32px;
  min-height: 60px;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  line-height: 1.5;
  white-space: nowrap;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  white-space: nowrap;
}

.theme-selector,
.format-selector {
  display: flex;
  flex-direction: row;
  gap: 10px;
  flex-shrink: 0;
}

.theme-btn,
.format-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-emoji {
  font-size: 14px;
  flex-shrink: 0;
}

.btn-text {
  white-space: nowrap;
}

.theme-btn:hover,
.format-btn:hover {
  background: var(--bg-hover);
}

.theme-btn.active,
.format-btn.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-primary);
}

.fade-slide-enter-active {
  animation: fadeSlideIn 0.2s ease;
}

.fade-slide-leave-active {
  animation: fadeSlideOut 0.15s ease;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeSlideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    animation: none;
  }
  
  .nav-item,
  .theme-btn,
  .format-btn,
  .titlebar-btn {
    transition: none;
  }
}

.about-content {
  text-align: center;
  padding: 24px 0;
}

.app-logo-large {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: contain;
  margin: 0 auto 16px;
}

.app-name {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.app-version {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.app-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.author-label {
  font-size: 13px;
  color: var(--text-muted);
}

.author-name {
  font-size: 15px;
  color: var(--text-primary);
  font-weight: 500;
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}

.github-link:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--accent-primary);
}

.github-icon {
  width: 20px;
  height: 20px;
}

.tech-info {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.tech-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tech-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tech-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
}

.switch {
  position: relative;
  width: 48px;
  height: 26px;
  flex-shrink: 0;
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
  border-radius: 26px;
  transition: background-color 0.3s, border-color 0.3s;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-muted);
  border-radius: 50%;
  transition: transform 0.3s ease, background-color 0.3s;
}

.switch input:checked + .switch-slider {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
}

.switch input:checked + .switch-slider:before {
  transform: translateX(22px);
  background-color: var(--bg-primary);
}

@media (prefers-reduced-motion: reduce) {
  .switch-slider,
  .switch-slider:before {
    transition: none;
  }
}
</style>
