<template>
  <div class="folder-explorer">
    <div class="folder-header" v-if="currentFolder">
      <div class="folder-path" :title="currentFolder">
        <span class="folder-icon">📁</span>
        <span class="folder-name">{{ getFolderName(currentFolder) }}</span>
      </div>
      <div class="header-actions">
        <button class="btn-icon" @click="toggleSearch" :class="{ active: showSearch }" title="搜索">
          🔍
        </button>
        <button class="btn-icon" @click="refreshFolder" title="刷新">🔄</button>
      </div>
    </div>

    <Transition name="slide-down">
      <div class="search-container" v-if="showSearch">
        <div class="search-input-wrapper">
          <input
            type="text"
            class="search-input"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="搜索文件名和内容..."
            ref="searchInputRef"
          />
          <button class="search-clear" v-if="searchQuery" @click="clearSearch">✕</button>
        </div>
        <div class="search-results" v-if="searchResults.length > 0">
          <div class="search-results-header">
            找到 {{ searchResults.length }} 个结果
          </div>
          <div 
            class="search-result-item" 
            v-for="result in searchResults" 
            :key="result.path"
            @click="selectSearchResult(result)"
          >
            <span class="result-icon">{{ result.type === 'folder' ? '📁' : '📝' }}</span>
            <div class="result-info">
              <span class="result-name">{{ result.name }}</span>
              <span class="result-match" v-if="result.matchType === 'content'">
                {{ result.matchPreview }}
              </span>
            </div>
          </div>
        </div>
        <div class="search-empty" v-else-if="searchQuery && !isSearching">
          未找到匹配结果
        </div>
      </div>
    </Transition>

    <div class="file-tree" v-if="tree.length > 0 && !searchQuery">
      <TreeNode
        v-for="node in tree"
        :key="node.path"
        :node="node"
        :depth="0"
        :selected-path="selectedPath"
        @select="handleSelect"
        @expand="handleExpand"
        @refresh="refreshFolder"
      />
    </div>

    <div class="empty-folder" v-else-if="currentFolder && !searchQuery">
      <div class="empty-icon">📂</div>
      <div class="empty-text">文件夹为空</div>
    </div>

    <div class="modal-overlay" v-if="showCreateDialog" @click.self="showCreateDialog = false">
      <div class="modal">
        <div class="modal-title">{{ createType === 'file' ? '新建文件' : '新建文件夹' }}</div>
        <div class="input-group">
          <label class="input-label">{{ createType === 'file' ? '文件名称' : '文件夹名称' }}</label>
          <input
            type="text"
            class="input-field"
            v-model="newItemName"
            @keyup.enter="confirmCreate"
            :placeholder="createType === 'file' ? '例如: 新文档.md' : '例如: 新文件夹'"
            ref="createInputRef"
          >
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn btn-primary" @click="confirmCreate">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue';
import TreeNode from './TreeNode.vue';

export default {
  name: 'FolderExplorer',
  components: {
    TreeNode
  },
  props: {
    currentFolder: {
      type: String,
      default: null
    }
  },
  emits: ['closeFolder', 'selectFile', 'folderChanged'],
  setup(props, { emit }) {
    const tree = ref([]);
    const selectedPath = ref(null);
    const showCreateDialog = ref(false);
    const createType = ref('file');
    const newItemName = ref('');
    const createInputRef = ref(null);
    const showSearch = ref(false);
    const searchQuery = ref('');
    const searchResults = ref([]);
    const searchInputRef = ref(null);
    const isSearching = ref(false);
    let searchTimeout = null;

    const getFolderName = (path) => {
      return path.split(/[/\\]/).pop() || path;
    };

    const loadFolderTree = async () => {
      if (!props.currentFolder) {
        tree.value = [];
        return;
      }
      
      if (window.electronAPI) {
        const result = await window.electronAPI.readFolderTree(props.currentFolder, 10);
        if (result.success) {
          tree.value = [result.tree];
        }
      }
    };

    const refreshFolder = () => {
      loadFolderTree();
      emit('folderChanged');
    };

    const handleSelect = (node) => {
      selectedPath.value = node.path;
      if (node.type === 'file') {
        emit('selectFile', node);
      }
    };

    const handleExpand = async (node) => {
      node.expanded = !node.expanded;
    };

    const toggleSearch = () => {
      showSearch.value = !showSearch.value;
      if (showSearch.value) {
        nextTick(() => {
          searchInputRef.value?.focus();
        });
      } else {
        searchQuery.value = '';
        searchResults.value = [];
      }
    };

    const handleSearch = async () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
      }

      isSearching.value = true;

      searchTimeout = setTimeout(async () => {
        await performSearch();
        isSearching.value = false;
      }, 300);
    };

    const performSearch = async () => {
      if (!props.currentFolder || !searchQuery.value.trim()) {
        searchResults.value = [];
        return;
      }

      const query = searchQuery.value.toLowerCase().trim();
      const results = [];

      const searchInNode = async (node) => {
        if (node.name.toLowerCase().includes(query)) {
          results.push({
            path: node.path,
            name: node.name,
            type: node.type,
            matchType: 'name',
            matchPreview: null
          });
        }

        if (node.type === 'file' && node.extension === '.md') {
          try {
            if (window.electronAPI) {
              const fileResult = await window.electronAPI.readFile(node.path);
              if (fileResult.success) {
                const content = fileResult.content.toLowerCase();
                if (content.includes(query)) {
                  const contentIndex = content.indexOf(query);
                  const previewStart = Math.max(0, contentIndex - 30);
                  const previewEnd = Math.min(content.length, contentIndex + query.length + 30);
                  const preview = fileResult.content.substring(previewStart, previewEnd);
                  
                  if (!results.find(r => r.path === node.path)) {
                    results.push({
                      path: node.path,
                      name: node.name,
                      type: node.type,
                      matchType: 'content',
                      matchPreview: '...' + preview + '...'
                    });
                  }
                }
              }
            }
          } catch (err) {
            console.error('Search error:', err);
          }
        }

        if (node.children) {
          for (const child of node.children) {
            await searchInNode(child);
          }
        }
      };

      for (const rootNode of tree.value) {
        await searchInNode(rootNode);
      }

      searchResults.value = results.slice(0, 50);
    };

    const clearSearch = () => {
      searchQuery.value = '';
      searchResults.value = [];
      searchInputRef.value?.focus();
    };

    const selectSearchResult = (result) => {
      selectedPath.value = result.path;
      if (result.type === 'file') {
        emit('selectFile', { path: result.path, name: result.name });
      }
      showSearch.value = false;
      searchQuery.value = '';
      searchResults.value = [];
    };

    const confirmCreate = async () => {
      if (!newItemName.value.trim()) {
        alert('请输入名称');
        return;
      }

      let targetPath = props.currentFolder;
      if (selectedPath.value) {
        const selected = findNode(tree.value, selectedPath.value);
        if (selected?.type === 'folder') {
          targetPath = selected.path;
        } else if (selected?.type === 'file') {
          targetPath = selected.path.substring(0, selected.path.lastIndexOf(/[/\\]/.test(selected.path) ? (selected.path.includes('\\') ? '\\' : '/') : '/'));
        }
      }

      if (window.electronAPI) {
        if (createType.value === 'file') {
          const name = newItemName.value.endsWith('.md') ? newItemName.value : newItemName.value + '.md';
          const filePath = `${targetPath}/${name}`;
          const result = await window.electronAPI.createFile(filePath, `# ${newItemName.value}\n\n`);
          if (result.success) {
            refreshFolder();
          } else {
            alert('创建失败: ' + result.error);
          }
        } else {
          const folderPath = `${targetPath}/${newItemName.value}`;
          const result = await window.electronAPI.createFolder(folderPath);
          if (result.success) {
            refreshFolder();
          } else {
            alert('创建失败: ' + result.error);
          }
        }
      }

      showCreateDialog.value = false;
    };

    const findNode = (nodes, path) => {
      for (const node of nodes) {
        if (node.path === path) return node;
        if (node.children) {
          const found = findNode(node.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    watch(() => props.currentFolder, () => {
      loadFolderTree();
      searchQuery.value = '';
      searchResults.value = [];
      showSearch.value = false;
    });

    onMounted(() => {
      loadFolderTree();
    });

    return {
      tree,
      selectedPath,
      showCreateDialog,
      createType,
      newItemName,
      createInputRef,
      showSearch,
      searchQuery,
      searchResults,
      searchInputRef,
      isSearching,
      getFolderName,
      refreshFolder,
      handleSelect,
      handleExpand,
      toggleSearch,
      handleSearch,
      clearSearch,
      selectSearchResult,
      confirmCreate
    };
  }
};
</script>

<style scoped>
.folder-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.folder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
}

.folder-path {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  min-width: 0;
  flex: 1;
}

.folder-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.folder-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 14px;
}

.btn-icon:hover,
.btn-icon.active {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-icon.active {
  color: var(--accent-primary);
}

.search-container {
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0 10px;
  transition: border-color 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: var(--accent-primary);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 8px 0;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-clear {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  font-size: 12px;
  border-radius: 4px;
}

.search-clear:hover {
  color: var(--text-primary);
}

.search-results {
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-tertiary);
  border-radius: 8px;
}

.search-results-header {
  padding: 8px 12px;
  font-size: 11px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.search-result-item:hover {
  background: var(--bg-hover);
}

.result-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.result-name {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-match {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'SF Mono', 'Monaco', monospace;
}

.search-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.slide-down-enter-active {
  animation: slideDown 0.2s ease;
}

.slide-down-leave-active {
  animation: slideUp 0.15s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 400px;
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    max-height: 400px;
  }
  to {
    opacity: 0;
    max-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .slide-down-enter-active,
  .slide-down-leave-active {
    animation: none;
  }
}

.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  min-height: 0;
}

.empty-folder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  min-width: 360px;
  box-shadow: 0 20px 60px var(--shadow);
}

.modal-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 20px;
  color: var(--accent-primary);
  margin-bottom: 16px;
}

.input-group {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.input-field {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-color: var(--accent-primary);
}

.btn-primary:hover {
  background: var(--accent-secondary);
  border-color: var(--accent-secondary);
}
</style>
