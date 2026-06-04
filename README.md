# HTML 在线编辑器

上传 HTML 文件，直接在预览中点击文字即可原地编辑，修改后下载。

## 快速开始

```bash
npm install
npm run dev
```

## 使用方式

1. 上传一个 `.html` 文件（拖拽或点击选择）
2. 在预览中**直接点击文字**，光标出现后原地编辑
3. 按 `Enter` 或点击其他位置自动保存，按 `Esc` 取消
4. 点击「下载修改后的 HTML」保存到本地

## 功能说明

| 功能 | 操作 |
|---|---|
| 上传文件 | 拖拽 HTML 文件到上传区，或点击按钮选择 |
| 编辑文字 | 预览中点击文字，原地输入 |
| 保存修改 | `Enter` / 点击其他地方 |
| 取消编辑 | `Esc` |
| 下载文件 | 点击右上角按钮，文件名自动添加 `_modified` 后缀 |

## 技术栈

- Vue 3 (Composition API) + Vite 5
- 预览通过 iframe + `contentEditable` + `postMessage` 实现双向同步
- HTML 解析基于 `DOMParser` + `TreeWalker`

## 项目结构

```
src/
  App.vue                 # 主组件：状态管理、布局
  components/
    FileUploader.vue      # 文件上传（拖拽 + 选择）
    HtmlPreview.vue       # iframe 预览，postMessage 通信
  utils/
    htmlParser.js         # HTML 文本提取、预览构建、重建导出
```
