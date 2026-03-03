<template>
  <div class="editor-toolbar">
    <div class="toolbar-menu-wrapper">
      <div 
        class="toolbar-main-btn" 
        :class="{ active: showMenu }"
        @mouseenter="showMenu = true"
        @keydown="handleKeydown"
        tabindex="0"
        ref="mainBtnRef"
      >
        <span class="main-icon">✏️</span>
        <span class="main-text">插入</span>
        <span class="main-arrow" :class="{ rotated: showMenu }">▼</span>
      </div>
      <Transition name="dropdown">
        <div 
          class="toolbar-dropdown" 
          v-show="showMenu" 
          @mouseenter="showMenu = true" 
          @mouseleave="showMenu = false"
          ref="dropdownRef"
        >
          <div 
            class="menu-section" 
            v-for="(section, sIndex) in currentMenuSections" 
            :key="section.id"
            :ref="el => { if (el) sectionRefs[sIndex] = el }"
          >
            <div class="menu-section-header">
              <span class="section-icon">{{ section.icon }}</span>
              <span class="section-title">{{ section.title }}</span>
            </div>
            <div class="menu-section-items">
              <button 
                v-for="(item, iIndex) in section.items" 
                :key="item.type"
                class="menu-item"
                :class="{ focused: focusedItem.section === sIndex && focusedItem.item === iIndex }"
                @click="insertSyntax(item.type)"
                @mouseenter="focusedItem = { section: sIndex, item: iIndex }"
                :ref="el => { if (el) itemRefs[`${sIndex}-${iIndex}`] = el }"
              >
                <span class="item-icon">{{ item.icon }}</span>
                <span class="item-text">{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';

export default {
  name: 'EditorToolbar',
  emits: ['insert', 'insert-image'],
  props: {
    formatMode: {
      type: String,
      default: 'markdown'
    }
  },
  setup(props, { emit }) {
    const showMenu = ref(false);
    const mainBtnRef = ref(null);
    const dropdownRef = ref(null);
    const sectionRefs = ref([]);
    const itemRefs = ref({});
    const focusedItem = ref({ section: -1, item: -1 });

    const menuSections = ref([
      {
        id: 'text',
        icon: 'Aa',
        title: '文本格式',
        items: [
          { type: 'heading', icon: 'H', label: '标题' },
          { type: 'bold', icon: 'B', label: '粗体' },
          { type: 'italic', icon: 'I', label: '斜体' },
          { type: 'strikethrough', icon: 'S', label: '删除线' },
          { type: 'center', icon: '⫯', label: '居中' }
        ]
      },
      {
        id: 'list',
        icon: '≡',
        title: '列表',
        items: [
          { type: 'ul', icon: '•', label: '无序列表' },
          { type: 'ol', icon: '1.', label: '有序列表' },
          { type: 'task', icon: '☑', label: '任务列表' },
          { type: 'quote', icon: '"', label: '引用' }
        ]
      },
      {
        id: 'code',
        icon: '</>',
        title: '代码与链接',
        items: [
          { type: 'code', icon: '`', label: '行内代码' },
          { type: 'codeblock', icon: '{ }', label: '代码块' },
          { type: 'link', icon: '🔗', label: '链接' },
          { type: 'image', icon: '🖼', label: '图片' }
        ]
      },
      {
        id: 'table',
        icon: '⊞',
        title: '表格与分隔',
        items: [
          { type: 'table', icon: '⊞', label: '表格' },
          { type: 'hr', icon: '—', label: '分隔线' }
        ]
      },
      {
        id: 'diagram',
        icon: '📊',
        title: '图表',
        items: [
          { type: 'flowchart', icon: '→', label: '流程图' },
          { type: 'sequence', icon: '⇄', label: '时序图' },
          { type: 'classDiagram', icon: '▣', label: '类图' },
          { type: 'stateDiagram', icon: '◉', label: '状态图' },
          { type: 'pie', icon: '◐', label: '饼图' }
        ]
      },
      {
        id: 'math',
        icon: '∑',
        title: '公式',
        items: [
          { type: 'mathInline', icon: '$', label: '行内公式' },
          { type: 'mathBlock', icon: '$$', label: '块级公式' }
        ]
      },
      {
        id: 'html',
        icon: '<>',
        title: 'HTML',
        items: [
          { type: 'htmlImg', icon: '🖼', label: '图片标签' },
          { type: 'htmlVideo', icon: '▶', label: '视频标签' },
          { type: 'htmlAudio', icon: '♪', label: '音频标签' },
          { type: 'htmlDiv', icon: '▢', label: 'Div容器' },
          { type: 'htmlSpan', icon: '▫', label: 'Span标签' },
          { type: 'htmlDetails', icon: '▸', label: '折叠内容' },
          { type: 'htmlCenter', icon: '⫯', label: '居中标签' }
        ]
      }
    ]);

    const currentMenuSections = computed(() => {
      if (props.formatMode === 'html') {
        return menuSections.value.filter(section => section.id === 'html');
      }
      return menuSections.value;
    });

    const getMarkdownSyntaxMap = () => ({
      heading: '# 标题\n',
      bold: '**粗体文本**',
      italic: '*斜体文本*',
      strikethrough: '~~删除线文本~~',
      center: '<center>\n居中内容\n</center>\n',
      ul: '- 列表项\n',
      ol: '1. 列表项\n',
      task: '- [ ] 任务项\n',
      quote: '> 引用内容\n',
      code: '`代码`',
      codeblock: '```language\n代码块\n```\n',
      link: '[链接文本](https://example.com)',
      table: '| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 内容 | 内容 | 内容 |\n',
      hr: '\n---\n',
      flowchart: '```mermaid\nflowchart TD\n    A[开始] --> B[处理]\n    B --> C[结束]\n```\n',
      sequence: '```mermaid\nsequenceDiagram\n    participant A as 参与者A\n    participant B as 参与者B\n    A->>B: 消息\n    B-->>A: 响应\n```\n',
      classDiagram: '```mermaid\nclassDiagram\n    class Animal {\n        +String name\n        +makeSound()\n    }\n    class Dog {\n        +bark()\n    }\n    Animal <|-- Dog\n```\n',
      stateDiagram: '```mermaid\nstateDiagram-v2\n    [*] --> 状态1\n    状态1 --> 状态2: 事件\n    状态2 --> [*]\n```\n',
      pie: '```mermaid\npie showData\n    title 饼图示例\n    "选项A": 30\n    "选项B": 40\n    "选项C": 30\n```\n',
      mathInline: '$E=mc^2$',
      mathBlock: '$$\n\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\cdots + x_n\n$$\n',
      htmlImg: '<img src="图片路径" alt="描述" style="max-width:100%;">\n',
      htmlVideo: '<video controls width="100%">\n  <source src="视频路径" type="video/mp4">\n</video>\n',
      htmlAudio: '<audio controls>\n  <source src="音频路径" type="audio/mpeg">\n</audio>\n',
      htmlDiv: '<div style="padding:10px;background:#f5f5f5;">\n  内容\n</div>\n',
      htmlSpan: '<span style="color:red;">文本</span>',
      htmlDetails: '<details>\n  <summary>点击展开</summary>\n  隐藏的内容\n</details>\n',
      htmlCenter: '<center>\n居中内容\n</center>\n'
    });

    const getHtmlSyntaxMap = () => ({
      htmlImg: '<img src="图片路径" alt="描述" style="max-width:100%;">\n',
      htmlVideo: '<video controls width="100%">\n  <source src="视频路径" type="video/mp4">\n</video>\n',
      htmlAudio: '<audio controls>\n  <source src="音频路径" type="audio/mpeg">\n</audio>\n',
      htmlDiv: '<div style="padding:10px;background:#f5f5f5;">\n  内容\n</div>\n',
      htmlSpan: '<span style="color:red;">文本</span>',
      htmlDetails: '<details>\n  <summary>点击展开</summary>\n  隐藏的内容\n</details>\n',
      htmlCenter: '<center>\n居中内容\n</center>\n'
    });

    const insertSyntax = (type) => {
      showMenu.value = false;
      if (type === 'image') {
        emit('insert-image');
        return;
      }
      
      const syntaxMap = props.formatMode === 'html' ? getHtmlSyntaxMap() : getMarkdownSyntaxMap();
      emit('insert', syntaxMap[type] || '');
    };

    const handleKeydown = (e) => {
      if (!showMenu.value) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          showMenu.value = true;
          nextTick(() => {
            focusedItem.value = { section: 0, item: 0 };
          });
        }
        return;
      }

      const sections = currentMenuSections.value;
      
      if (e.key === 'Escape') {
        showMenu.value = false;
        focusedItem.value = { section: -1, item: -1 };
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextSection = (focusedItem.value.section + 1) % sections.length;
        focusedItem.value = { section: nextSection, item: 0 };
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevSection = focusedItem.value.section <= 0 ? sections.length - 1 : focusedItem.value.section - 1;
        focusedItem.value = { section: prevSection, item: 0 };
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentSection = sections[focusedItem.value.section];
        if (currentSection) {
          const nextItem = (focusedItem.value.item + 1) % currentSection.items.length;
          focusedItem.value = { ...focusedItem.value, item: nextItem };
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentSection = sections[focusedItem.value.section];
        if (currentSection) {
          const prevItem = focusedItem.value.item <= 0 ? currentSection.items.length - 1 : focusedItem.value.item - 1;
          focusedItem.value = { ...focusedItem.value, item: prevItem };
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const section = sections[focusedItem.value.section];
        if (section && section.items[focusedItem.value.item]) {
          insertSyntax(section.items[focusedItem.value.item].type);
        }
      }
    };

    watch(showMenu, (val) => {
      if (!val) {
        focusedItem.value = { section: -1, item: -1 };
      }
    });

    return {
      showMenu,
      mainBtnRef,
      dropdownRef,
      sectionRefs,
      itemRefs,
      focusedItem,
      currentMenuSections,
      insertSyntax,
      handleKeydown
    };
  }
};
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-menu-wrapper {
  position: relative;
}

.toolbar-main-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.toolbar-main-btn:hover,
.toolbar-main-btn:focus {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--bg-primary);
}

.toolbar-main-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--bg-primary);
}

.main-icon {
  font-size: 14px;
}

.main-text {
  font-weight: 500;
}

.main-arrow {
  font-size: 8px;
  opacity: 0.7;
  margin-left: 4px;
  transition: transform 0.2s ease;
}

.main-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-enter-active {
  animation: dropdownIn 0.2s ease;
}

.dropdown-leave-active {
  animation: dropdownOut 0.15s ease;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdownOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-enter-active,
  .dropdown-leave-active {
    animation: none;
  }
  
  .main-arrow {
    transition: none;
  }
  
  .toolbar-main-btn {
    transition: none;
  }
}

.toolbar-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 600px;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.toolbar-dropdown:has(.menu-section:only-child) {
  min-width: 200px;
  grid-template-columns: 1fr;
}

.menu-section {
  background: var(--bg-tertiary);
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.menu-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .menu-section {
    transition: none;
  }
  
  .menu-section:hover {
    transform: none;
  }
}

.menu-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border-color);
}

.section-icon {
  font-size: 12px;
  color: var(--accent-primary);
  font-weight: 600;
  width: 20px;
  text-align: center;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.menu-section-items {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.menu-item:hover,
.menu-item.focused {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.menu-item:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .menu-item {
    transition: none;
  }
  
  .menu-item:active {
    transform: none;
  }
}

.item-icon {
  width: 20px;
  text-align: center;
  font-weight: 600;
}

.item-text {
  flex: 1;
}
</style>
