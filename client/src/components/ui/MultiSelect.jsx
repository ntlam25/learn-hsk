import { useEffect, useRef, useState } from 'react';
import Checkbox from './Checkbox';

// Dropdown chọn nhiều (cùng giao diện với Select): value = mảng giá trị đã chọn, options = [{ value, label }]
export default function MultiSelect({ value = [], onChange, options, placeholder = 'Chọn…', disabled = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = options.filter((o) => value.includes(o.value));
  const summary = selected.length === 0 ? null : selected.length === 1 ? selected[0].label : `${selected.length} mục: ${selected.map((o) => o.label).join(', ')}`;

  function toggle(v) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  return (
    <div className={'ui-select ui-multiselect' + (className ? ' ' + className : '')} ref={ref}>
      <button
        type="button"
        className={'ui-select-trigger' + (open ? ' open' : '')}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        title={summary || placeholder}
      >
        <span className={'ui-multiselect-summary' + (summary ? '' : ' ui-select-placeholder')}>{summary || placeholder}</span>
        <span className="ui-select-chevron">▾</span>
      </button>
      {open && (
        <ul className="ui-select-menu" role="listbox" aria-multiselectable="true">
          {options.map((o) => (
            <li key={o.value} className="ui-multiselect-option">
              <Checkbox checked={value.includes(o.value)} onChange={() => toggle(o.value)} label={o.label} />
            </li>
          ))}
          {!options.length && <li className="ui-multiselect-empty">Không có lựa chọn nào.</li>}
        </ul>
      )}
    </div>
  );
}
