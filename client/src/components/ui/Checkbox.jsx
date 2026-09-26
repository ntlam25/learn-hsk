import { useEffect, useRef } from 'react';

// indeterminate: trạng thái "chọn một phần" (ô chọn tất cả khi mới chọn vài dòng)
export default function Checkbox({ checked, onChange, label, disabled, indeterminate = false, ariaLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <label className={'ui-checkbox' + (disabled ? ' disabled' : '') + (indeterminate ? ' indeterminate' : '')}>
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} disabled={disabled} aria-label={ariaLabel} />
      <span className="ui-checkbox-box">
        <span className="ui-checkbox-mark">{indeterminate ? '–' : '✓'}</span>
      </span>
      {label && <span className="ui-checkbox-label">{label}</span>}
    </label>
  );
}
