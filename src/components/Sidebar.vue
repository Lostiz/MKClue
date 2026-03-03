<template>
  <div class="sidebar" :class="{ collapsed: !sidebarOpen }">
    <div class="sidebar-header">
      <div class="sidebar-title">MKClue</div>
      <div class="sidebar-subtitle">Markdown Editor</div>
    </div>

    <!-- 文件夹映射区域 -->
    <div class="folder-section">
      <!-- 操作按钮 -->
      <div class="folder-actions">
        <button class="btn" @click="$emit('newFile')" v-if="currentFolder">
          <span>📝</span>
          <span>新建文档</span>
        </button>
        <button class="btn btn-delete" @click="$emit('deleteFile')" v-if="currentFolder && folderFile">
          <span>🗑</span>
          <span>删除文档</span>
        </button>
        <button class="btn btn-secondary" @click="$emit('openFolder')" v-if="!currentFolder">
          <span>📁</span>
          <span>打开文件夹</span>
        </button>
        <button class="btn btn-secondary" @click="$emit('closeFolder')" v-if="currentFolder">
          <span>✕</span>
          <span>关闭文件夹</span>
        </button>
      </div>

      <!-- 文件树 -->
      <FolderExplorer
        v-if="currentFolder"
        :current-folder="currentFolder"
        @close-folder="$emit('closeFolder')"
        @select-file="$emit('selectFolderFile', $event)"
        @folder-changed="$emit('folderChanged')"
      />

      <!-- 空状态 -->
      <div class="empty-state" v-if="!currentFolder">
        <div class="empty-icon">📂</div>
        <div class="empty-text">打开文件夹开始编辑</div>
      </div>
    </div>
  </div>
</template>

<script>
import FolderExplorer from './FolderExplorer.vue';

export default {
  name: 'Sidebar',
  components: {
    FolderExplorer
  },
  props: {
    sidebarOpen: {
      type: Boolean,
      default: true
    },
    currentFolder: {
      type: String,
      default: null
    },
    folderFile: {
      type: Object,
      default: null
    },
    theme: {
      type: String,
      default: 'dark'
    }
  },
  emits: ['toggleSidebar', 'openFolder', 'closeFolder', 'selectFolderFile', 'folderChanged', 'newFile', 'deleteFile']
};
</script>

<style scoped>
.sidebar {
  width: 280px;
  min-width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 100;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(180deg, var(--bg-secondary) 0%, rgba(26, 26, 36, 0.8) 100%);
}

.sidebar-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent-primary);
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.sidebar-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.folder-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.folder-actions {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  transition: all 0.2s;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn:hover {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-primary);
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-delete {
  background: transparent;
  border-color: #f87171;
  color: #f87171;
}

.btn-delete:hover {
  background: #f87171;
  color: white;
  border-color: #f87171;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.4;
}

.empty-text {
  font-size: 14px;
  text-align: center;
}
</style>
