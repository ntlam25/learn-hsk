import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import CourseFormModal from '../../components/admin/CourseFormModal';
import BulkBar, { SelectAllCell, SelectCell } from '../../components/ui/BulkBar';
import useRowSelection from '../../hooks/useRowSelection';
import { useAuth } from '../../context/AuthContext';

export default function CourseManagerPage() {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin'; // chỉ admin xoá được khoá học
  const selection = useRowSelection(isAdmin ? (courses || []).map((c) => c.id) : []);

  function load() {
    api.get('/admin/courses').then((res) => setCourses(res.data)).catch(() => setLoadError('Không tải được danh sách khoá học.'));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingCourse(null);
    setModalOpen(true);
  }

  function openEdit(course) {
    setEditingCourse(course);
    setModalOpen(true);
  }

  async function togglePublish(course) {
    await api.put(`/admin/courses/${course.id}`, { published: !course.published });
    load();
  }

  async function handleDelete(course) {
    if (!confirm(`Xoá khoá học "${course.title}"?
Các lớp của khoá bị xoá theo; bài học KHÔNG bị xoá (vẫn ở khoá khác hoặc thành bài độc lập).`)) return;
    try {
      await api.delete(`/admin/courses/${course.id}`);
      toast.success('Đã xoá khoá học.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại.');
    }
  }

  async function handleBulkDelete() {
    const classCount = (courses || []).filter((c) => selection.isSelected(c.id)).reduce((s, c) => s + (c.classCount || 0), 0);
    const warn = classCount ? `
${classCount} lớp học của các khoá này sẽ bị xoá theo.` : '';
    if (!confirm(`Xoá ${selection.count} khoá học đã chọn?${warn}
Bài học KHÔNG bị xoá. Hành động này không thể hoàn tác.`)) return;
    setBulkBusy(true);
    try {
      const res = await api.post('/admin/courses/bulk-delete', { ids: selection.selected });
      toast.success(res.data.message);
      selection.clear();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại.');
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Quản lý khoá học</h1>
        <div className="admin-header-actions">
          <Button onClick={openCreate}>+ Tạo khoá học</Button>
        </div>
      </div>

      {loadError && <div className="alert-error">{loadError}</div>}

      {courses && (
        <table className="admin-table">
          <thead>
            <tr>
              {isAdmin && <SelectAllCell selection={selection} disabled={!courses.length} />}
              <th>Tên khoá học</th>
              <th>HSK</th>
              <th>Bài học</th>
              <th>Lớp</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className={selection.isSelected(c.id) ? 'row-selected' : ''}>
                {isAdmin && <SelectCell selection={selection} id={c.id} />}
                <td>
                  <Link to={`/admin/courses/${c.id}`} className="admin-table-zh admin-table-link">
                    {c.title}
                  </Link>
                  <div className="admin-table-vi">{c.description}</div>
                </td>
                <td>{c.hskLevel || '—'}</td>
                <td>{c.lessonCount ?? '—'}</td>
                <td>{c.classCount ?? '—'}</td>
                <td>
                  <button className={'status-pill' + (c.published ? ' published' : '')} onClick={() => togglePublish(c)}>
                    <span className="status-pill-dot" />
                    {c.published ? 'Đã xuất bản' : 'Đang ẩn'}
                  </button>
                </td>
                <td className="admin-table-actions">
                  <Link to={`/admin/courses/${c.id}`} className="btn-chip">
                    Chi tiết
                  </Link>
                  <Link to={`/admin/lessons/new?courseId=${c.id}`} className="btn-chip">
                    + Bài học
                  </Link>
                  <Button variant="chip" onClick={() => openEdit(c)}>
                    Sửa
                  </Button>
                  <Button variant="chip-danger" onClick={() => handleDelete(c)}>
                    Xoá
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <BulkBar selection={selection} noun="khoá học">
        <Button variant="chip-danger" onClick={handleBulkDelete} disabled={bulkBusy}>
          {bulkBusy ? 'Đang xoá…' : `Xoá ${selection.count} khoá`}
        </Button>
      </BulkBar>

      <CourseFormModal
        open={modalOpen}
        editing={editingCourse}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
      />
    </main>
  );
}
