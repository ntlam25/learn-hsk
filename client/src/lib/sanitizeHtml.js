// Lọc HTML inline cho nội dung bài học (tiêu đề, ghi chú, ví dụ…): giữ đúng các thẻ định dạng
// mà giáo trình gốc dùng (<b>, <br>, <span class="tone-y2">…) và bỏ mọi thứ khác (script, sự kiện, style).
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'BR', 'SPAN', 'SUP', 'SUB', 'SMALL', 'MARK', 'RUBY', 'RT', 'RP']);
const cache = new Map();

function clean(node, doc) {
  const out = doc.createDocumentFragment();
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      out.appendChild(doc.createTextNode(child.textContent));
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      if (ALLOWED_TAGS.has(child.tagName)) {
        const el = doc.createElement(child.tagName.toLowerCase());
        const cls = child.getAttribute('class');
        if (cls) el.setAttribute('class', cls);
        el.appendChild(clean(child, doc));
        out.appendChild(el);
      } else if (!['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT'].includes(child.tagName)) {
        out.appendChild(clean(child, doc)); // bỏ thẻ lạ nhưng giữ chữ bên trong
      }
    }
  });
  return out;
}

export default function sanitizeHtml(html) {
  if (html == null || html === '') return '';
  const key = String(html);
  if (cache.has(key)) return cache.get(key);
  if (!/[<&]/.test(key)) {
    cache.set(key, key);
    return key;
  }
  const doc = new DOMParser().parseFromString(`<body>${key}</body>`, 'text/html');
  const holder = doc.createElement('div');
  holder.appendChild(clean(doc.body, doc));
  const result = holder.innerHTML;
  if (cache.size > 2000) cache.clear();
  cache.set(key, result);
  return result;
}
