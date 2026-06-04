<template>
  <div class="preview-panel">
    <div class="preview-toolbar">
      <span class="preview-label">预览</span>
      <span class="preview-size" v-if="width && height">{{ width }} &times; {{ height }}</span>
    </div>
    <div class="preview-frame-wrapper">
      <iframe
        ref="iframeRef"
        class="preview-frame"
        :srcdoc="srcdoc"
        sandbox="allow-same-origin allow-scripts"
        @load="onLoad"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  srcdoc: { type: String, default: '' },
})

const emit = defineEmits(['edit'])

const iframeRef = ref(null)
const width = ref(null)
const height = ref(null)
const loaded = ref(false)

function onLoad() {
  loaded.value = true
  try {
    const doc = iframeRef.value.contentDocument
    if (doc) {
      width.value = doc.documentElement.scrollWidth
      height.value = doc.documentElement.scrollHeight
    }
  } catch { /* cross-origin */ }
}

function post(msg) {
  if (!iframeRef.value || !loaded.value) return
  try {
    iframeRef.value.contentWindow.postMessage(msg, '*')
  } catch { /* ignore */ }
}

function handleMessage(e) {
  if (!iframeRef.value) return
  if (e.source !== iframeRef.value.contentWindow) return
  if (e.data && e.data.type === 'ht-edit') {
    emit('edit', { index: e.data.index, text: e.data.text })
  }
}

onMounted(() => window.addEventListener('message', handleMessage))
onBeforeUnmount(() => window.removeEventListener('message', handleMessage))

defineExpose({
  updateText(index, text) {
    post({ type: 'ht-update', index, text })
  },
  focusText(index) {
    post({ type: 'ht-focus', index })
  },
})
</script>
