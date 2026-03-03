<template>
  <div 
    class="tree-node"
    :class="{ 
      'drag-over': isDragOver,
      'dragging': isDragging
    }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div
      class="node-content"
      :style="{ paddingLeft: depth * 16 + 12 + 'px' }"
      :class="{ 
        selected: selectedPath === node.path,
        'is-folder': node.type === 'folder',
        'is-file': node.type === 'file',
        'context-open': showContextMenu
      }"
      @click="handleClick"
      @contextmenu.prevent="openContextMenu"
    >
      <span 
        class="expand-icon" 
        v-if="node.type === 'folder'"
        @click.stop="toggleExpand"
      >
        <span v-if="node.children?.length > 0">
          {{ node.expanded ? '▼' : '▶' }}
        </span>
        <span v-else class="expand-placeholder"></span>
      </span>
      <span class="expand-icon placeholder" v-else></span>
      
      <span class="node-icon">
        {{ getIcon() }}
      </span>
      
      <span class="node-name" v-if="!isRenaming">{{ node.name }}</span>
      <input
        v-else
        ref="renameInputRef"
        type="text"
        class="rename-input"
        v-model="newName"
        @blur="confirmRename"
        @keyup.enter="confirmRename"
        @keyup.escape="cancelRename"
        @click.stop
      />
      
      <div class="node-actions" v-if="showContextMenu && !isRenaming">
        <button class="action-btn" @click.stop="startRename" title="重命名">
          ✏️
        </button>
        <button class="action-btn" @click.stop="deleteNode" title="删除">
          🗑️
        </button>
        <button class="action-btn" v-if="node.type === 'folder'" @click.stop="createChild" title="新建">
          ➕
        </button>
      </div>
    </div>

    <Transition name="expand">
      <div class="node-children" v-if="node.type === 'folder' && node.expanded && node.children">
        <TreeNode
          v-for="child in sortedChildren"
          :key="child.path"
          :node="child"
          :depth="depth + 1"
          :selected-path="selectedPath"
          @select="$emit('select', $event)"
          @expand="$emit('expand', $event)"
          @refresh="$emit('refresh')"
          @move="handleChildMove"
        />
      </div>
    </Transition>
  </div>
</template>

<script>
import { ref, computed, nextTick } from 'vue';

export default {
  name: 'TreeNode',
  props: {
    node: {
      type: Object,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    },
    selectedPath: {
      type: String,
      default: null
    }
  },
  emits: ['select', 'expand', 'refresh', 'move'],
  setup(props, { emit }) {
    const showContextMenu = ref(false);
    const isRenaming = ref(false);
    const newName = ref('');
    const renameInputRef = ref(null);
    const isDragOver = ref(false);
    const isDragging = ref(false);

    const sortedChildren = computed(() => {
      if (!props.node.children) return [];
      return [...props.node.children].sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
    });

    const getIcon = () => {
      if (props.node.type === 'folder') {
        return props.node.expanded ? '📂' : '📁';
      }
      
      const ext = props.node.extension;
      if (ext === '.md' || ext === '.markdown') return '📝';
      if (ext === '.txt') return '📄';
      if (ext === '.json') return '📋';
      if (ext === '.js' || ext === '.ts') return '📜';
      if (ext === '.html' || ext === '.css') return '🎨';
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.webp' || ext === '.svg') return '🖼️';
      if (ext === '.pdf') return '📕';
      return '📄';
    };

    const handleClick = () => {
      if (props.node.type === 'folder') {
        emit('expand', props.node);
      }
      emit('select', props.node);
      showContextMenu.value = false;
    };

    const toggleExpand = () => {
      emit('expand', props.node);
    };

    const openContextMenu = () => {
      showContextMenu.value = !showContextMenu.value;
    };

    const startRename = async () => {
      newName.value = props.node.name;
      isRenaming.value = true;
      showContextMenu.value = false;
      await nextTick();
      renameInputRef.value?.focus();
      renameInputRef.value?.select();
    };

    const confirmRename = async () => {
      if (!newName.value.trim() || newName.value === props.node.name) {
        cancelRename();
        return;
      }

      if (window.electronAPI) {
        const result = await window.electronAPI.renameItem(props.node.path, newName.value);
        if (result.success) {
          emit('refresh');
        } else {
          alert('重命名失败: ' + result.error);
        }
      }
      isRenaming.value = false;
    };

    const cancelRename = () => {
      isRenaming.value = false;
      newName.value = '';
    };

    const deleteNode = async () => {
      showContextMenu.value = false;
      if (confirm(`确定要删除 "${props.node.name}" 吗?`)) {
        if (window.electronAPI) {
          const result = await window.electronAPI.deleteItem(props.node.path);
          if (result.success) {
            emit('refresh');
          } else {
            alert('删除失败: ' + result.error);
          }
        }
      }
    };

    const createChild = async () => {
      showContextMenu.value = false;
      const name = prompt('输入名称:');
      if (!name) return;

      const isFile = name.includes('.');
      const targetPath = props.node.path;

      if (window.electronAPI) {
        if (isFile) {
          const fileName = name.endsWith('.md') ? name : name + '.md';
          const filePath = `${targetPath}/${fileName}`;
          const result = await window.electronAPI.createFile(filePath, `# ${name}\n\n`);
          if (result.success) {
            emit('refresh');
          }
        } else {
          const folderPath = `${targetPath}/${name}`;
          const result = await window.electronAPI.createFolder(folderPath);
          if (result.success) {
            emit('refresh');
          }
        }
      }
    };

    const handleDragStart = (e) => {
      isDragging.value = true;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify({
        path: props.node.path,
        type: props.node.type,
        name: props.node.name
      }));
    };

    const handleDragEnd = () => {
      isDragging.value = false;
      isDragOver.value = false;
    };

    const handleDragOver = (e) => {
      if (props.node.type === 'folder') {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        isDragOver.value = true;
      }
    };

    const handleDragLeave = () => {
      isDragOver.value = false;
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      isDragOver.value = false;

      if (props.node.type !== 'folder') return;

      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.path === props.node.path) return;

        const sourcePath = data.path;
        const targetPath = props.node.path;
        const newName = data.name;

        if (window.electronAPI) {
          const result = await window.electronAPI.moveItem(sourcePath, `${targetPath}/${newName}`);
          if (result.success) {
            emit('refresh');
          } else {
            alert('移动失败: ' + result.error);
          }
        }
      } catch (err) {
        console.error('Drop error:', err);
      }
    };

    const handleChildMove = (data) => {
      emit('move', data);
    };

    return {
      showContextMenu,
      isRenaming,
      newName,
      renameInputRef,
      isDragOver,
      isDragging,
      sortedChildren,
      getIcon,
      handleClick,
      toggleExpand,
      openContextMenu,
      startRename,
      confirmRename,
      cancelRename,
      deleteNode,
      createChild,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleChildMove
    };
  }
};
</script>

<style scoped>
.tree-node {
  user-select: none;
  transition: opacity 0.2s;
}

.tree-node.dragging {
  opacity: 0.5;
}

.tree-node.drag-over > .node-content {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border-radius: 6px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  border-radius: 6px;
  margin: 1px 6px;
  position: relative;
}

.node-content:hover {
  background: var(--bg-hover);
}

.node-content.selected {
  background: var(--bg-tertiary);
  border-left: 2px solid var(--accent-primary);
  margin-left: 4px;
  padding-left: 10px;
}

.node-content.is-folder:hover {
  color: var(--accent-primary);
}

.node-content.context-open {
  background: var(--bg-tertiary);
}

.expand-icon {
  width: 16px;
  font-size: 8px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  cursor: pointer;
}

.expand-placeholder {
  width: 8px;
  height: 8px;
}

.expand-icon.placeholder {
  width: 16px;
}

.node-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.node-name {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.node-content.selected .node-name {
  color: var(--text-primary);
}

.node-content.is-file .node-name {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  font-size: 12px;
}

.rename-input {
  flex: 1;
  background: var(--bg-tertiary);
  border: 1px solid var(--accent-primary);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--text-primary);
  outline: none;
  font-family: inherit;
}

.node-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
  background: var(--bg-secondary);
  border-radius: 4px;
  padding: 2px;
}

.action-btn {
  background: transparent;
  border: none;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 12px;
  border-radius: 3px;
  transition: background 0.15s;
}

.action-btn:hover {
  background: var(--bg-hover);
}

.node-children {
  overflow: hidden;
}

.expand-enter-active {
  animation: expandIn 0.2s ease-out;
}

.expand-leave-active {
  animation: expandOut 0.15s ease-in;
}

@keyframes expandIn {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1000px;
  }
}

@keyframes expandOut {
  from {
    opacity: 1;
    max-height: 1000px;
  }
  to {
    opacity: 0;
    max-height: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .expand-enter-active,
  .expand-leave-active {
    animation: none;
  }
  
  .node-content,
  .expand-icon,
  .action-btn,
  .tree-node {
    transition: none;
  }
}
</style>
