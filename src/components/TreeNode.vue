<template>
  <div class="tree-node">
    <div
      class="node-content"
      :style="{ paddingLeft: depth * 16 + 12 + 'px' }"
      :class="{ 
        selected: selectedPath === node.path,
        'is-folder': node.type === 'folder',
        'is-file': node.type === 'file'
      }"
      @click="handleClick"
      @contextmenu.prevent="showContextMenu"
    >
      <!-- 展开/折叠箭头 -->
      <span 
        class="expand-icon" 
        v-if="node.type === 'folder' && node.children?.length > 0"
        @click.stop="$emit('expand', node)"
      >
        {{ node.expanded ? '▼' : '▶' }}
      </span>
      <span class="expand-icon placeholder" v-else></span>
      
      <!-- 图标 -->
      <span class="node-icon">
        {{ getIcon() }}
      </span>
      
      <!-- 名称 -->
      <span class="node-name">{{ node.name }}</span>
    </div>

    <!-- 子节点 -->
    <div class="node-children" v-if="node.type === 'folder' && node.expanded && node.children">
      <TreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        @select="$emit('select', $event)"
        @expand="$emit('expand', $event)"
        @refresh="$emit('refresh')"
      />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';

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
  emits: ['select', 'expand', 'refresh'],
  setup(props, { emit }) {
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
    };

    const showContextMenu = async (event) => {
      const action = prompt(`选择操作:\n1. 重命名\n2. 删除\n3. 在资源管理器中显示\n\n输入数字:`);
      
      if (action === '1') {
        const newName = prompt('输入新名称:', props.node.name);
        if (newName && newName !== props.node.name) {
          if (window.electronAPI) {
            const result = await window.electronAPI.renameItem(props.node.path, newName);
            if (result.success) {
              emit('refresh');
            } else {
              alert('重命名失败: ' + result.error);
            }
          }
        }
      } else if (action === '2') {
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
      } else if (action === '3') {
        if (window.electronAPI) {
          window.electronAPI.showItemInFolder(props.node.path);
        }
      }
    };

    return {
      getIcon,
      handleClick,
      showContextMenu
    };
  }
};
</script>

<style scoped>
.tree-node {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 6px;
  margin: 1px 6px;
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

.expand-icon {
  width: 12px;
  font-size: 8px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.expand-icon.placeholder {
  width: 12px;
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
}

.node-content.selected .node-name {
  color: var(--text-primary);
}

.node-content.is-file .node-name {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  font-size: 12px;
}
</style>
