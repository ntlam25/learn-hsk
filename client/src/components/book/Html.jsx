import { createElement } from 'react';
import sanitizeHtml from '../../lib/sanitizeHtml';

// Hiển thị một đoạn HTML inline của bài học (đã lọc) — dùng cho mọi trường có thể chứa <b>, <br>, <span class="…">
export default function Html({ as = 'span', html, ...rest }) {
  return createElement(as, { ...rest, dangerouslySetInnerHTML: { __html: sanitizeHtml(html) } });
}
