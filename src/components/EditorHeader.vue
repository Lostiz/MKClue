<template>
  <div class="editor-header">
    <div class="file-info" v-if="currentFile">
      <div class="file-path" v-if="currentFile.path">
        {{ currentFile.path }}
      </div>
    </div>
    <div class="file-info" v-else>
      <div class="no-file">选择或创建一个文档</div>
    </div>
    
    <div class="header-actions">
      <button 
        class="action-btn" 
        v-if="currentFile"
        @click="$emit('insertImage')"
        title="插入图片"
      >
        🖼️
      </button>
      
      <button 
        class="action-btn save-btn" 
        v-if="currentFile && isFolderFile" 
        @click="$emit('save')"
        title="保存 (Ctrl+S)"
      >
        💾
      </button>
      
      <button 
        class="action-btn settings-btn" 
        @click="$emit('openSettings')"
        title="设置 (Ctrl+,)"
      >
        ⚙️
      </button>
      
      <div class="view-toggle">
        <button
          class="view-btn"
          :class="{ active: viewMode === 'edit' }"
          @click="$emit('changeView', 'edit')"
          title="编辑模式 (Ctrl+1)"
        >
          编辑
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'split' }"
          @click="$emit('changeView', 'split')"
          title="分屏模式 (Ctrl+2)"
        >
          分屏
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'preview' }"
          @click="$emit('changeView', 'preview')"
          title="预览模式 (Ctrl+3)"
        >
          预览
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditorHeader',
  props: {
    currentFile: {
      type: Object,
      default: null
    },
    viewMode: {
      type: String,
      default: 'split'
    },
    isFolderFile: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'dark'
    }
  },
  emits: ['changeView', 'save', 'openSettings', 'insertImage']
};
</script>

<style scoped>
.editor-header {
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-info {
  flex: 1;
  overflow: hidden;
  min-width: 0;
}

.file-path {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
}

.no-file {
  font-size: 13px;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
}

.save-btn:hover {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.view-toggle {
  display: flex;
  gap: 2px;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  margin-left: 8px;
}

.view-btn {
  padding: 8px 14px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  transition: all 0.2s;
}

.view-btn:hover {
  color: var(--text-primary);
}

.view-btn.active {
  background: var(--accent-primary);
  color: var(--bg-primary);
}
</style>
