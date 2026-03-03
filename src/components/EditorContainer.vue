<template>
  <div class="editor-container">
    <div
      class="editor-pane"
      :class="{
        'hidden': viewMode === 'preview',
        'full-width': viewMode === 'edit'
      }"
    >
      <div class="pane-header">Markdown 编辑器</div>
      <div class="editor-wrapper">
        <textarea
          v-if="currentFile"
          ref="editorRef"
          class="editor-textarea"
          :value="currentFile.content"
          @input="$emit('updateContent', $event.target.value)"
          placeholder="在此输入 Markdown 内容..."
          spellcheck="false"
        ></textarea>
        <div v-else class="empty-state">
          <div class="empty-icon">✍️</div>
          <div class="empty-text">请选择或创建一个文档</div>
        </div>
      </div>
    </div>

    <div
      class="preview-pane"
      :class="{
        'hidden': viewMode === 'edit',
        'full-width': viewMode === 'preview'
      }"
    >
      <div class="pane-header">实时预览</div>
      <div class="preview-wrapper">
        <div
          v-if="currentFile"
          class="preview-content"
          v-html="renderedContent"
          @click="handlePreviewClick"
        ></div>
        <div v-else class="empty-state">
          <div class="empty-icon">👁️</div>
          <div class="empty-text">预览区域</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import 'highlight.js/styles/atom-one-dark.css';
import { ref } from 'vue';

export default {
  name: 'EditorContainer',
  props: {
    currentFile: {
      type: Object,
      default: null
    },
    viewMode: {
      type: String,
      default: 'split'
    },
    renderedContent: {
      type: String,
      default: ''
    },
    theme: {
      type: String,
      default: 'dark'
    }
  },
  emits: ['updateContent', 'imageClick'],
  setup(props, { emit }) {
    const editorRef = ref(null);

    const insertAtCursor = (text) => {
      const textarea = editorRef.value;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = props.currentFile?.content || '';
      
      const newContent = content.substring(0, start) + text + content.substring(end);
      
      emit('updateContent', newContent);
      
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + text.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    };

    const handlePreviewClick = (event) => {
      if (event.target.tagName === 'IMG') {
        const src = event.target.getAttribute('src');
        if (src) {
          emit('imageClick', src);
        }
      }

      if (event.target.tagName === 'A') {
        event.preventDefault();
        const href = event.target.getAttribute('href');
        if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(href);
          } else {
            window.open(href, '_blank');
          }
        }
      }
    };

    return {
      editorRef,
      insertAtCursor,
      handlePreviewClick
    };
  }
};
</script>

<style scoped>
.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane, .preview-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
}

.editor-pane.full-width, .preview-pane.full-width {
  flex: 1;
}

.editor-pane.hidden {
  flex: 0;
  min-width: 0;
  overflow: hidden;
}

.preview-pane.hidden {
  flex: 0;
  min-width: 0;
  overflow: hidden;
}

.pane-header {
  padding: 12px 24px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-weight: 600;
}

.editor-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  padding: 32px;
  background: var(--bg-primary);
  color: var(--text-primary);
  border: none;
  outline: none;
  resize: none;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 0.3px;
}

.editor-textarea::selection {
  background: var(--accent-primary);
  color: var(--bg-primary);
}

.editor-textarea::placeholder {
  color: var(--text-muted);
}

.preview-wrapper {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  background: var(--bg-secondary);
  min-height: 0;
}

.preview-content {
  max-width: 800px;
  margin: 0 auto;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  gap: 16px;
}

.empty-icon {
  font-size: 64px;
  opacity: 0.3;
}

.empty-text {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
}

/* Markdown Preview Styles */
.preview-content :deep(h1) {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 42px;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 24px;
  line-height: 1.2;
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 16px;
}

.preview-content :deep(h2) {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 32px 0 16px;
  line-height: 1.3;
}

.preview-content :deep(h3) {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 24px 0 12px;
}

.preview-content :deep(h4) {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 20px 0 10px;
}

.preview-content :deep(p) {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.preview-content :deep(code) {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: var(--accent-primary);
}

.preview-content :deep(pre) {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--border-color);
}

.preview-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: var(--text-primary);
}

/* Code Block Wrapper with Language Label */
.preview-content :deep(.code-block-wrapper) {
  position: relative;
  background: var(--bg-primary);
  border-radius: 8px;
  margin: 16px 0;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.preview-content :deep(.code-lang-label) {
  position: absolute;
  top: 0;
  right: 0;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-primary);
  background: var(--bg-tertiary);
  border-bottom-left-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'SF Mono', 'Monaco', monospace;
}

.preview-content :deep(.code-block-wrapper pre) {
  margin: 0;
  border: none;
  border-radius: 0;
  padding-top: 16px;
}

/* Code Highlighting */
.preview-content :deep(.hljs) {
  background: transparent;
}

.preview-content :deep(.hljs-keyword),
.preview-content :deep(.hljs-selector-tag) {
  color: #c678dd;
}

.preview-content :deep(.hljs-string),
.preview-content :deep(.hljs-attr) {
  color: #98c379;
}

.preview-content :deep(.hljs-number) {
  color: #d19a66;
}

.preview-content :deep(.hljs-function) {
  color: #61afef;
}

.preview-content :deep(.hljs-comment) {
  color: #5c6370;
  font-style: italic;
}

.preview-content :deep(blockquote) {
  border-left: 4px solid var(--accent-primary);
  padding-left: 20px;
  margin: 16px 0;
  color: var(--text-muted);
  font-style: italic;
}

.preview-content :deep(ul), .preview-content :deep(ol) {
  margin: 16px 0;
  padding-left: 32px;
}

.preview-content :deep(li) {
  margin: 8px 0;
  line-height: 1.8;
  color: var(--text-secondary);
}

/* Task List */
.preview-content :deep(input[type="checkbox"]) {
  margin-right: 8px;
  accent-color: var(--accent-primary);
}

.preview-content :deep(a) {
  color: var(--accent-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s;
  cursor: pointer;
}

.preview-content :deep(a:hover) {
  border-bottom-color: var(--accent-primary);
}

.preview-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 32px 0;
}

/* Table Styles */
.preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.preview-content :deep(th),
.preview-content :deep(td) {
  padding: 12px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.preview-content :deep(th) {
  background: var(--bg-tertiary);
  font-weight: 600;
  color: var(--accent-primary);
}

/* Image Styles */
.preview-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  cursor: zoom-in;
  transition: transform 0.2s, box-shadow 0.2s;
}

.preview-content :deep(img:hover) {
  transform: scale(1.02);
  box-shadow: 0 8px 24px var(--shadow);
}

/* Mermaid Diagram Styles */
.preview-content :deep(.mermaid) {
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 20px;
  margin: 16px 0;
  text-align: center;
  overflow-x: auto;
}

.preview-content :deep(.mermaid svg) {
  max-width: 100%;
  height: auto;
}

/* Math Formula Styles */
.preview-content :deep(.math-block) {
  display: block;
  text-align: center;
  padding: 20px;
  margin: 16px 0;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow-x: auto;
}

.preview-content :deep(.katex) {
  font-size: 1.1em;
}

.preview-content :deep(.katex-display) {
  margin: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

/* HTML Element Styles */
.preview-content :deep(video),
.preview-content :deep(audio) {
  max-width: 100%;
  margin: 16px 0;
  border-radius: 8px;
}

.preview-content :deep(details) {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
}

.preview-content :deep(summary) {
  cursor: pointer;
  font-weight: 600;
  color: var(--accent-primary);
}

.preview-content :deep(div[style*="background"]) {
  border-radius: 8px;
  margin: 16px 0;
}
</style>
