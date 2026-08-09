import { useEffect, useRef, useState } from 'react';

// Dropdown tuỳ biến thay cho <select> gốc — trình duyệt không style được phần
// danh sách option của <select> gốc nên giao diện bị lệch tông với phần còn lại.
export default function Select({ value, onChange, options, placeholder = 'Chọn…', disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className={'ui-select' + (className ? ' ' + className : '')} ref={ref}>
      <button
        type="button"
        className={'ui-select-trigger' + (open ? ' open' : '')}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? '' : 'ui-select-placeholder'}>{selected ? selected.label : placeholder}</span>
        <span className="ui-select-chevron">▾</span>
      </button>
      {open && (
        <ul className="ui-select-menu" role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={'ui-select-option' + (o.value === value ? ' selected' : '')}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
