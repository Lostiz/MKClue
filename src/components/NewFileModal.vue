<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-title">创建新文档</div>
      <div class="input-group">
        <label class="input-label">文档名称</label>
        <input
          type="text"
          class="input-field"
          :value="newFileName"
          @input="$emit('update:name', $event.target.value)"
          @keyup.enter="$emit('create')"
          placeholder="例如: 我的笔记.md"
          ref="inputRef"
        >
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" @click="$emit('close')">
          取消
        </button>
        <button class="btn btn-primary" @click="$emit('create')">
          创建
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';

export default {
  name: 'NewFileModal',
  props: {
    newFileName: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'create', 'update:name'],
  setup() {
    const inputRef = ref(null);

    onMounted(() => {
      nextTick(() => {
        inputRef.value?.focus();
      });
    });

    return {
      inputRef
    };
  }
};
</script>

<style scoped>
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
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 28px;
  min-width: 400px;
  max-width: 90vw;
  box-shadow: 0 20px 60px var(--shadow);
  animation: modalSlideIn 0.25s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 22px;
  color: var(--accent-primary);
  margin-bottom: 20px;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(201, 169, 97, 0.12);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
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
