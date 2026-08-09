import { useState } from 'react';

export const TAB_CATEGORIES = [
  { key: 'vocab', label: 'Từ mới', zh: '生词', audioCategory: 'vocab' },
  { key: 'dialogue', label: 'Bài khóa', zh: '课文', audioCategory: 'text' },
  { key: 'phonetics', label: 'Ngữ âm', zh: '语音', audioCategory: 'phonetics' },
  { key: 'grammar', label: 'Ngữ pháp', zh: '语法', audioCategory: null },
  { key: 'exercise', label: 'Luyện tập', zh: '练习', audioCategory: 'practice' },
];

// Thanh tab dùng lại đúng markup/class nav.tabs của trang xem bài học, thêm nút
// "+ Thêm tab" để bật từng danh mục cố định và nút "×" để ẩn tab (không xoá dữ
// liệu bên trong, chỉ ẩn khỏi editor — bật lại là thấy nội dung cũ).
export default function TabBar({ activeKeys, current, onSelect, onAdd, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const inactive = TAB_CATEGORIES.filter((c) => !activeKeys.includes(c.key));

  return (
    <nav className="tabs admin-tab-bar">
      {TAB_CATEGORIES.filter((c) => activeKeys.includes(c.key)).map((c) => (
        <button key={c.key} type="button" className={c.key === current ? 'active' : ''} onClick={() => onSelect(c.key)}>
          <span className="zh">{c.zh}</span>
          {c.label}
          <span
            className="tab-remove-x"
            role="button"
            title="Ẩn tab này"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(c.key);
            }}
          >
            ×
          </span>
        </button>
      ))}

      {inactive.length > 0 && (
        <div className="tab-add-wrap">
          <button type="button" className="tab-add-btn" onClick={() => setMenuOpen((o) => !o)}>
            + Thêm tab
          </button>
          {menuOpen && (
            <div className="tab-add-menu">
              {inactive.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    onAdd(c.key);
                    setMenuOpen(false);
                  }}
                >
                  <span className="zh">{c.zh}</span> {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
