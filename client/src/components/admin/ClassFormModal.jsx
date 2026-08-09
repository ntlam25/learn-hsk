import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const EMPTY = { courseId: '', name: '' };

export default function ClassFormModal({ open, editing, courses, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? { courseId: editing.courseId, name: editing.name } : EMPTY);
    setError('');
  }, [open, editing]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.courseId) {
      setError('Vui lòng chọn khoá học.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/admin/classes/${editing.id}`, form);
        toast.success('Đã cập nhật lớp học.');
      } else {
        await api.post('/admin/classes', form);
        toast.success('Đã tạo lớp học mới.');
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || (editing ? 'Cập nhật lớp thất bại.' : 'Tạo lớp thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  const courseOptions = courses.map((c) => ({ value: c.id, label: c.title }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Cập nhật lớp học' : 'Tạo lớp mới'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit" form="class-form-modal" disabled={saving || !form.name.trim() || !form.courseId}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
        </>
      }
    >
      <form id="class-form-modal" onSubmit={handleSubmit} className="lesson-form">
        {error && <div className="alert-error">{error}</div>}
        <div className="field-row">
          <label>
            Khoá học
            <Select
              value={form.courseId}
              onChange={(v) => setForm((f) => ({ ...f, courseId: v }))}
              options={courseOptions}
              placeholder="-- Chọn khoá học --"
            />
          </label>
          <label>
            Tên lớp
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
        </div>
      </form>
    </Modal>
  );
}
