# AGENTS.md

## Stack
- Vue 3 (Composition API, `<script setup>`) + Vite 5
- Electron 35 for desktop app packaging
- No router, no state library — single `App.vue` holds all state

## Commands
```bash
npm run dev                # Vite dev server (web)
npm run build              # Vite production build → dist/
npm run electron:dev       # Electron dev mode (Vite + Electron concurrently)
npm run electron:build     # Package Electron app for current platform → release/
npm run electron:build:mac # Package for macOS
npm run electron:build:win # Package for Windows
```

## Architecture

```
src/
  App.vue                        # root: state, layout, glue
  components/
    FileUploader.vue             # drag-drop + file picker
    HtmlPreview.vue              # full-width iframe preview w/ postMessage
  utils/
    htmlParser.js                # DOMParser-based: extract, rebuild, preview
electron/
  main.js                        # Electron main process (BrowserWindow)
  preload.js                     # contextBridge preload
```

### Core data flow

**File upload (one-time):**
1. `FileUploader` reads file → `App.vue` gets `{ name, content }`
2. `rawHtml = content`; `texts = extractTextNodes(content)`
3. `previewSrcDoc = buildPreviewHtml(content)` → iframe loads once

**Preview inline editing (contenteditable, postMessage, no iframe reload):**
1. User clicks text in preview → span becomes `contentEditable`, cursor appears in-place
2. User types directly; Enter or blur → iframe `postMessage({ type: 'ht-edit', index, text })` to parent
3. Esc reverts to original text and exits edit mode
4. `HtmlPreview` filters by `e.source === iframe.contentWindow`, emits `edit`
5. `App.vue` updates `texts[index].text`

**Download:**
- `rebuildHtml(rawHtml, texts)` produces clean HTML (no `<span>` markers)

### `htmlParser.js` key invariants
- `extractTextNodes()`, `rebuildHtml()`, and `buildPreviewHtml()` **all** walk the DOM in identical order via `collectTextNodes()` (shared `TreeWalker` + filter). Index-based matching — never change walk order without updating all three.
- SCRIPT and STYLE text nodes are skipped by the filter.
- Input is wrapped in a minimal HTML document skeleton (`normalizeDocument`) so fragments and full documents both work.
- `buildPreviewHtml()` replaces text nodes with `<span data-ht-id="N">` markers and appends an inline `<script>` (built via `doc.createElement('script')`, not string concatenation, to avoid `</script>` escaping issues). It only runs once per file upload.
- `rebuildHtml()` uses `realBody.innerHTML` (HTML serialization) for body content to preserve inline scripts. Head comes from original HTML via `origDoc.head.innerHTML`.
- Text content is replaced verbatim — no HTML entity encoding. Raw HTML tags pasted into the editor will be injected into the DOM.

### Preview iframe details
- Sandbox: `allow-same-origin allow-scripts` — scripts in the uploaded HTML _will execute_ (needed for the inline editor script). Downloaded HTML is clean (no injected script/markers).
- `HtmlPreview` exposes `updateText(index, text)` and `focusText(index)` via `defineExpose` for programmatic sync when needed.
- The `message` event listener filters by `e.source === iframeRef.value.contentWindow` to avoid cross-iframe interference.

### Electron packaging
- `vite.config.js` sets `base: './'` for `file://` protocol compatibility
- electron-builder config in `package.json` under `"build"` key
- Output goes to `release/` (gitignored)
- Dev mode loads `http://localhost:5173`, production loads `dist/index.html`

## Notes
- No tests, no linter, no type-checking configured yet.
- The download button appends `_modified` to the original filename.
