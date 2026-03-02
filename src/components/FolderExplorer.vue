<template>
  <div class="folder-explorer">
    <!-- 文件夹头部 -->
    <div class="folder-header" v-if="currentFolder">
      <div class="folder-path" :title="currentFolder">
        <span class="folder-icon">📁</span>
        <span class="folder-name">{{ getFolderName(currentFolder) }}</span>
      </div>
      <button class="btn-icon" @click="refreshFolder" title="刷新">🔄</button>
    </div>

    <!-- 文件树 -->
    <div class="file-tree" v-if="tree.length > 0">
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

    <!-- 空状态 -->
    <div class="empty-folder" v-else-if="currentFolder">
      <div class="empty-icon">📂</div>
      <div class="empty-text">文件夹为空</div>
    </div>

    <!-- 新建对话框 -->
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

    const getFolderName = (path) => {
      return path.split(/[/\\]/).pop() || path;
    };

    const loadFolderTree = async () => {
      if (!props.currentFolder) {
        tree.value = [];
        return;
      }
      
      if (window.electronAPI) {
        const result = await window.electronAPI.readFolderTree(props.currentFolder, 5);
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
      getFolderName,
      refreshFolder,
      handleSelect,
      handleExpand,
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

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
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

/* Modal */
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
