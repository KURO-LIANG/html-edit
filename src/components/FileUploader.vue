<template>
  <div class="uploader" :class="{ dragging }">
    <div
      class="drop-zone"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <div class="drop-content" v-if="!fileName">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p class="drop-text">拖放 HTML 文件到此处</p>
        <p class="drop-hint">或点击下方按钮选择文件</p>
      </div>
      <div class="file-loaded" v-else>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <span class="file-name">{{ fileName }}</span>
        <button class="btn-reset" @click.stop="reset" title="重新选择">&times;</button>
      </div>
    </div>
    <label class="btn-upload">
      <input type="file" accept=".html,.htm" @change="onFileChange" hidden />
      {{ fileName ? '重新选择文件' : '选择 HTML 文件' }}
    </label>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'upload'])

const dragging = ref(false)
const fileName = ref('')

watch(() => props.modelValue, (val) => {
  if (!val) fileName.value = ''
})

function processFile(file) {
  if (!file.name.match(/\.html?$/i)) {
    alert('请选择 .html 或 .htm 文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    fileName.value = file.name
    emit('upload', { name: file.name, content })
  }
  reader.readAsText(file)
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file) processFile(file)
}

function reset() {
  fileName.value = ''
  emit('upload', null)
}
</script>
