export function Radio({ name, checked, onChange, label, value, disabled }) {
  return (
    <label className={'ui-radio' + (disabled ? ' disabled' : '')}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} />
      <span className="ui-radio-dot" />
      {label && <span className="ui-radio-label">{label}</span>}
    </label>
  );
}

// Nhóm radio tiện dụng: options = [{ value, label }]
export function RadioGroup({ name, value, onChange, options, disabled, className = '' }) {
  return (
    <div className={'ui-radio-group' + (className ? ' ' + className : '')}>
      {options.map((o) => (
        <Radio
          key={o.value}
          name={name}
          value={o.value}
          label={o.label}
          checked={value === o.value}
          onChange={() => onChange(o.value)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
