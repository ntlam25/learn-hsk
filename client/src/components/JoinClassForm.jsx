import { useState } from 'react';
import api from '../api/client';
import Button from './ui/Button';
import { notifyClassesChanged } from '../lib/events';

// Ô "Nhập mã lớp": học viên tự vào lớp bằng mã mời giáo viên gửi. onJoined({ class, alreadyEnrolled }).
export default function JoinClassForm({ onJoined, compact = false }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/me/classes/join', { code: value });
      setCode('');
      notifyClassesChanged();
      onJoined?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không vào được lớp, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={'join-class-form' + (compact ? ' compact' : '')} onSubmit={handleSubmit}>
      {!compact && (
        <div className="join-class-text">
          <strong>Có mã lớp?</strong>
          <span>Nhập mã 6 ký tự giáo viên gửi để vào lớp và bắt đầu học.</span>
        </div>
      )}
      <div className="join-class-row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="VD: HSK7QK"
          maxLength={12}
          aria-label="Mã lớp"
          autoCapitalize="characters"
        />
        <Button type="submit" disabled={busy || !code.trim()}>
          {busy ? 'Đang vào…' : 'Vào lớp'}
        </Button>
      </div>
      {error && <div className="field-error">{error}</div>}
    </form>
  );
}
