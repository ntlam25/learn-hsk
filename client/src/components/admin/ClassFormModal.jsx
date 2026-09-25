import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const EMPTY = { courseId: '', name: '', teacherId: '', startDate: '', endDate: '' };

// onSaved(klass) nhận lớp vừa tạo/cập nhật
// defaultCourseId: tạo lớp từ trang chi tiết khoá học thì chọn sẵn khoá đó
export default function ClassFormModal({ open, editing, courses, onClose, onSaved, defaultCourseId = '' }) {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState(EMPTY);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            courseId: editing.courseId,
            name: editing.name,
            teacherId: editing.teacherId || '',
            startDate: editing.startDate || '',
            endDate: editing.endDate || '',
          }
        : { ...EMPTY, courseId: defaultCourseId, teacherId: user?.id || '' }
    );
    setError('');
  }, [open, editing, user, defaultCourseId]);

  // Admin chọn giáo viên phụ trách (giáo viên tạo lớp thì luôn là chính mình)
  useEffect(() => {
    if (!open || !isAdmin) return;
    api
      .get('/admin/users', { params: { role: 'teacher' } })
      .then((res) => setTeachers(res.data))
      .catch(() => setTeachers([]));
  }, [open, isAdmin]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.courseId) {
      setError('Vui lòng chọn khoá học.');
      return;
    }
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { courseId: form.courseId, name: form.name.trim(), startDate: form.startDate || null, endDate: form.endDate || null };
    if (isAdmin) payload.teacherId = form.teacherId || null;
    try {
      const res = editing ? await api.put(`/admin/classes/${editing.id}`, payload) : await api.post('/admin/classes', payload);
      toast.success(editing ? 'Đã cập nhật lớp học.' : 'Đã tạo lớp học mới.');
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || (editing ? 'Cập nhật lớp thất bại.' : 'Tạo lớp thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  const courseOptions = courses.map((c) => ({ value: c.id, label: c.title }));
  const teacherOptions = [
    { value: user?.id || '', label: `Tôi (${user?.fullName || user?.username || 'admin'})` },
    ...teachers.filter((t) => t.id !== user?.id).map((t) => ({ value: t.id, label: `${t.fullName || t.username} · @${t.username}` })),
  ];

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
            <Select value={form.courseId} onChange={(v) => set({ courseId: v })} options={courseOptions} placeholder="-- Chọn khoá học --" />
          </label>
          <label>
            Tên lớp
            <input required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="VD: HN-HSK1-K12" />
          </label>
        </div>
        {isAdmin && (
          <div className="field-row">
            <label>
              Giáo viên phụ trách
              <Select value={form.teacherId} onChange={(v) => set({ teacherId: v })} options={teacherOptions} placeholder="-- Chọn giáo viên --" />
            </label>
          </div>
        )}
        <div className="field-row">
          <label>
            Ngày bắt đầu
            <input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </label>
          <label>
            Ngày kết thúc
            <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => set({ endDate: e.target.value })} />
          </label>
        </div>
        <div className="field-hint">
          Qua ngày kết thúc, học viên vẫn xem lại được bài nhưng không nộp bài và không vào lớp bằng mã được nữa.
          {!editing && ' Lớp mới chưa mở bài nào — mở bài ở tab "Bài học" của lớp.'}
        </div>
      </form>
    </Modal>
  );
}
