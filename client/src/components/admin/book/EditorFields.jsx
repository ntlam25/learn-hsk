import { useEffect, useRef, useState } from 'react';

// Ô nhập "trong suốt" đặt đúng chỗ chữ tĩnh của giáo trình. Trường cho phép HTML inline
// (<b>, <br>, <span class="tone-y2">…) — gợi ý hiện trong placeholder/title.
export function TextField({ value, onChange, placeholder, className = '', title, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      className={'be-field ' + className}
      value={value ?? ''}
      placeholder={placeholder}
      title={title || placeholder}
      onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
      {...rest}
    />
  );
}

// Textarea tự giãn theo nội dung
export function AreaField({ value, onChange, placeholder, className = '', rows = 1, title }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 2 + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={'be-field be-area ' + className}
      value={value ?? ''}
      placeholder={placeholder}
      title={title || placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Nhóm nút nhỏ: lên / xuống / xoá cho một phần tử trong danh sách
export function ItemControls({ index, count, onMove, onRemove, label = 'mục' }) {
  return (
    <span className="be-controls">
      {onMove && (
        <>
          <button type="button" disabled={index === 0} onClick={() => onMove(index, index - 1)} title={`Đưa ${label} lên`}>
            ↑
          </button>
          <button type="button" disabled={index === count - 1} onClick={() => onMove(index, index + 1)} title={`Đưa ${label} xuống`}>
            ↓
          </button>
        </>
      )}
      <button type="button" className="be-danger" onClick={() => onRemove(index)} title={`Xoá ${label}`}>
        ×
      </button>
    </span>
  );
}

export function AddButton({ children, onClick, className = '' }) {
  return (
    <button type="button" className={'be-add ' + className} onClick={onClick}>
      {children}
    </button>
  );
}

// Menu thả xuống chọn loại để thêm
export function AddMenu({ label, options, onPick }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="be-add-menu">
      <AddButton onClick={() => setOpen((o) => !o)}>{label}</AddButton>
      {open && (
        <span className="be-add-menu-list">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                setOpen(false);
                onPick(o.value);
              }}
            >
              {o.label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

export function Hint({ children }) {
  return <div className="be-hint">{children}</div>;
}

// Tiện ích thao tác mảng bất biến
export const listOps = {
  update: (list, i, value) => list.map((it, idx) => (idx === i ? value : it)),
  patch: (list, i, fields) => list.map((it, idx) => (idx === i ? { ...it, ...fields } : it)),
  remove: (list, i) => list.filter((_, idx) => idx !== i),
  move: (list, from, to) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    return next;
  },
};
