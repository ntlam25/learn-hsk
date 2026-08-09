import { useState } from 'react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import Select from './ui/Select';

const MOODS = [
  { value: 'vui', label: 'Vui vẻ (mặc định)' },
  { value: 'buon', label: 'Trầm lắng' },
  { value: 'tap_trung', label: 'Tập trung' },
  { value: 'thu_gian', label: 'Thư giãn' },
];

export default function MoodSwitcher({ mood, onChanged }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  async function handleChange(value) {
    setSaving(true);
    try {
      await api.put('/admin/settings/mood', { mood: value });
      document.documentElement.setAttribute('data-mood', value);
      onChanged?.(value);
      toast.success('Đã đổi mood giao diện.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu mood thất bại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mood-switcher">
      <label>
        Mood giao diện toàn hệ thống
        <Select value={mood} onChange={handleChange} options={MOODS} disabled={saving} />
      </label>
    </div>
  );
}
