import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const HSK_OPTIONS = [
  { value: '', label: 'Không theo chuẩn HSK' },
  { value: 'HSK1', label: 'HSK1' },
  { value: 'HSK2', label: 'HSK2' },
  { value: 'HSK3', label: 'HSK3' },
  { value: 'HSK4', label: 'HSK4' },
  { value: 'HSK5', label: 'HSK5' },
  { value: 'HSK6', label: 'HSK6' },
];
const EMPTY = { title: '', description: '', hskLevel: '' };

export default function CourseFormModal({ open, editing, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? { title: editing.title, description: editing.description || '', hskLevel: editing.hskLevel || '' } : EMPTY);
    setError('');
  }, [open, editing]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, hskLevel: form.hskLevel || null };
    try {
      if (editing) {
        await api.put(`/admin/courses/${editing.id}`, payload);
        toast.success('Đã cập nhật khoá học.');
      } else {
        await api.post('/admin/courses', payload);
        toast.success('Đã tạo khoá học mới.');
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || (editing ? 'Cập nhật khoá học thất bại.' : 'Tạo khoá học thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Cập nhật khoá học' : 'Tạo khoá học mới'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="course-form-modal" disabled={saving || !form.title.trim()}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </>
      }
    >
      <form id="course-form-modal" onSubmit={handleSubmit} className="lesson-form">
        {error && <div className="alert-error">{error}</div>}
        <div className="field-row">
          <label>
            Tên khoá học
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label>
            Trình độ HSK
            <Select value={form.hskLevel} onChange={(v) => setForm((f) => ({ ...f, hskLevel: v }))} options={HSK_OPTIONS} />
          </label>
        </div>
        <label>
          Mô tả
          <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </label>
      </form>
    </Modal>
  );
}
