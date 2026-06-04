<template>
  <div class="app">
    <header class="app-header">
      <h1 class="app-title">HTML 在线编辑器</h1>
      <div class="header-actions">
        <FileUploader @upload="onUpload" />
        <button
          class="btn-download"
          :disabled="!hasContent"
          @click="downloadHtml"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          下载修改后的 HTML
        </button>
      </div>
    </header>
    <main class="app-main">
      <div v-if="!hasContent" class="empty-state">
        <p>上传 HTML 文件，直接在预览中点击文字即可编辑</p>
      </div>
      <HtmlPreview
        v-else
        ref="previewRef"
        class="preview-full"
        :srcdoc="previewSrcDoc"
        @edit="onPreviewEdit"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import FileUploader from './components/FileUploader.vue'
import HtmlPreview from './components/HtmlPreview.vue'
import { extractTextNodes, rebuildHtml, buildPreviewHtml } from './utils/htmlParser.js'

const rawHtml = ref('')
const texts = ref([])
const fileName = ref('')
const previewSrcDoc = ref('')
const previewRef = ref(null)

const hasContent = computed(() => rawHtml.value.length > 0)

function onUpload(data) {
  if (!data) {
    rawHtml.value = ''
    texts.value = []
    fileName.value = ''
    previewSrcDoc.value = ''
    return
  }
  fileName.value = data.name
  rawHtml.value = data.content
  texts.value = extractTextNodes(data.content)
  previewSrcDoc.value = buildPreviewHtml(data.content)
}

function onPreviewEdit({ index, text }) {
  texts.value[index].text = text
}

function downloadHtml() {
  const html = texts.value.length > 0
    ? rebuildHtml(rawHtml.value, texts.value)
    : rawHtml.value
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value.replace(/\.html?$/i, '') + '_modified.html'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style>
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg: #f5f5f7;
  --surface: #ffffff;
  --border: #e5e5ea;
  --text: #1d1d1f;
  --text-secondary: #86868b;
  --accent: #0071e3;
  --accent-hover: #0077ed;
  --radius: 10px;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: var(--text);
  background: var(--bg);
}

#app {
  height: 100%;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-download {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.btn-download:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-download:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.app-main {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 15px;
}

.preview-full {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* FileUploader */
.uploader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drop-zone {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  transition: border-color 0.15s, background 0.15s;
  min-height: 40px;
}

.drop-zone.dragging {
  border-color: var(--accent);
  background: rgba(0, 113, 227, 0.04);
}

.drop-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.drop-content svg {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.drop-text {
  font-size: 13px;
}

.drop-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.file-loaded {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-loaded svg {
  flex-shrink: 0;
  color: #34c759;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-reset {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: var(--border);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-reset:hover {
  background: #d1d1d6;
  color: var(--text);
}

.btn-upload {
  padding: 8px 14px;
  border: none;
  border-radius: var(--radius);
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-upload:hover {
  background: var(--accent-hover);
}

/* HtmlPreview */
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
}

.preview-size {
  font-size: 12px;
  color: var(--text-secondary);
}

.preview-frame-wrapper {
  flex: 1;
  overflow: auto;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
