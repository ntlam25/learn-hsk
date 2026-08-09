export default function Checkbox({ checked, onChange, label, disabled }) {
  return (
    <label className={'ui-checkbox' + (disabled ? ' disabled' : '')}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="ui-checkbox-box">
        <span className="ui-checkbox-mark">✓</span>
      </span>
      {label && <span className="ui-checkbox-label">{label}</span>}
    </label>
  );
}
