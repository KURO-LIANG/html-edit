const WRAPPER = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>'

function makeFilter() {
  return {
    acceptNode(node) {
      if (node.parentElement?.tagName === 'SCRIPT') return NodeFilter.FILTER_REJECT
      if (node.parentElement?.tagName === 'STYLE') return NodeFilter.FILTER_REJECT
      const trimmed = node.textContent.trim()
      return trimmed.length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT
    },
  }
}

function normalizeDocument(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(WRAPPER + html + '</body></html>', 'text/html')
  return doc
}

function collectTextNodes(doc) {
  const body = doc.body || doc.documentElement
  const nodes = []
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, makeFilter())
  let node
  while ((node = walker.nextNode())) {
    nodes.push(node)
  }
  return nodes
}

export function extractTextNodes(htmlString) {
  const doc = normalizeDocument(htmlString)
  const textNodes = collectTextNodes(doc)
  return textNodes.map((node, i) => {
    const parent = node.parentElement
    return {
      index: i,
      text: node.textContent,
      parentTag: parent ? parent.tagName.toLowerCase() : 'unknown',
    }
  })
}

export function rebuildHtml(originalHtml, texts) {
  const doc = normalizeDocument(originalHtml)
  const textNodes = collectTextNodes(doc)

  for (let i = 0; i < textNodes.length && i < texts.length; i++) {
    textNodes[i].textContent = texts[i].text
  }

  const realBody = doc.body.querySelector('body') || doc.body
  const bodyContent = realBody.innerHTML

  const origDoc = new DOMParser().parseFromString(originalHtml, 'text/html')
  const htmlEl = origDoc.documentElement

  let htmlAttrs = ''
  if (htmlEl && htmlEl.hasAttributes()) {
    for (const attr of htmlEl.attributes) {
      htmlAttrs += ' ' + attr.name + '="' + attr.value + '"'
    }
  }

  let bodyAttrs = ''
  if (origDoc.body && origDoc.body.hasAttributes()) {
    for (const attr of origDoc.body.attributes) {
      bodyAttrs += ' ' + attr.name + '="' + attr.value + '"'
    }
  }

  const headContent = origDoc.head ? origDoc.head.innerHTML : ''

  return '<!DOCTYPE html>\n<html' + htmlAttrs + '>\n<head>\n' + headContent + '\n</head>\n<body' + bodyAttrs + '>' + bodyContent + '</body>\n</html>'
}

export function buildPreviewHtml(htmlString) {
  const doc = normalizeDocument(htmlString)
  const textNodes = collectTextNodes(doc)

  textNodes.forEach((node, i) => {
    const span = doc.createElement('span')
    span.setAttribute('data-ht-id', String(i))
    span.textContent = node.textContent
    node.parentNode.replaceChild(span, node)
  })

  const script = doc.createElement('script')
  script.textContent = EDITOR_SCRIPT
  doc.body.appendChild(script)

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML
}

const EDITOR_SCRIPT = `
(function() {
  var style = document.createElement('style');
  style.textContent = [
    '[data-ht-id] { cursor: text; border-radius: 2px; transition: background 0.12s; }',
    '[data-ht-id]:hover { background: rgba(0,113,227,0.08); outline: 1px dashed rgba(0,113,227,0.25); }',
    '[data-ht-id].ht-editing { background: rgba(0,113,227,0.1); outline: 2px solid rgba(0,113,227,0.4); border-radius: 3px; cursor: auto; }'
  ].join('\\n');
  document.head.appendChild(style);

  var editingSpan = null;
  var originalText = '';

  function save() {
    if (!editingSpan) return;
    var id = parseInt(editingSpan.getAttribute('data-ht-id'));
    var newText = editingSpan.textContent;
    editingSpan.contentEditable = 'false';
    editingSpan.classList.remove('ht-editing');
    editingSpan = null;
    if (newText !== originalText) {
      window.parent.postMessage({ type: 'ht-edit', index: id, text: newText }, '*');
    }
    originalText = '';
  }

  function cancel() {
    if (!editingSpan) return;
    editingSpan.textContent = originalText;
    editingSpan.contentEditable = 'false';
    editingSpan.classList.remove('ht-editing');
    editingSpan = null;
    originalText = '';
  }

  document.querySelectorAll('[data-ht-id]').forEach(function(span) {
    span.addEventListener('click', function(e) {
      if (editingSpan === this) return;
      if (editingSpan) save();
      e.stopPropagation();
      editingSpan = this;
      originalText = this.textContent;
      this.contentEditable = 'true';
      this.classList.add('ht-editing');
      this.focus();

      var range = document.createRange();
      range.selectNodeContents(this);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    span.addEventListener('keydown', function(e) {
      if (editingSpan !== this) return;
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });

    span.addEventListener('blur', function() {
      if (editingSpan === this) {
        setTimeout(function() {
          if (editingSpan === span) save();
        }, 120);
      }
    });

    span.addEventListener('paste', function(e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  });

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'ht-update') {
      var span = document.querySelector('[data-ht-id="' + e.data.index + '"]');
      if (span) {
        span.textContent = e.data.text;
      }
    }
    if (e.data && e.data.type === 'ht-focus') {
      var span = document.querySelector('[data-ht-id="' + e.data.index + '"]');
      if (span) {
        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        span.style.background = 'rgba(0,113,227,0.15)';
        setTimeout(function() { span.style.background = ''; }, 1800);
      }
    }
  });
})();
`
