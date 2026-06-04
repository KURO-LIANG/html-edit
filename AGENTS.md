# AGENTS.md

## Stack
- Vue 3 (Composition API, `<script setup>`) + Vite 5
- No router, no state library — single `App.vue` holds all state

## Commands
```bash
npm run dev      # dev server with HMR
npm run build    # production build → dist/
npm run preview  # preview production build
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
- `rebuildHtml()` serializes with `XMLSerializer` then strips wrapper — self-closing tags in source may become void elements in output.
- Text content is replaced verbatim — no HTML entity encoding. Raw HTML tags pasted into the editor will be injected into the DOM.

### Preview iframe details
- Sandbox: `allow-same-origin allow-scripts` — scripts in the uploaded HTML _will execute_ (needed for the inline editor script). Downloaded HTML is clean (no injected script/markers).
- `HtmlPreview` exposes `updateText(index, text)` and `focusText(index)` via `defineExpose` for programmatic sync when needed.
- The `message` event listener filters by `e.source === iframeRef.value.contentWindow` to avoid cross-iframe interference.

## Notes
- No tests, no linter, no type-checking configured yet.
- The download button appends `_modified` to the original filename.
