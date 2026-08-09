import { useState } from 'react';

export default function PasswordInput({ value, onChange, ...rest }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input type={visible ? 'text' : 'password'} value={value} onChange={onChange} {...rest} />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        tabIndex={-1}
      >
        {visible ? '🙈' : '👁️'}
      </button>
    </div>
  );
}
