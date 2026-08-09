import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import CourseFormModal from '../../components/admin/CourseFormModal';

export default function CourseManagerPage() {
  const toast = useToast();
  const [courses, setCourses] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

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
    if (!confirm(`Xoá khoá học "${course.title}"? Toàn bộ bài học trong khoá sẽ bị xoá theo.`)) return;
    try {
      await api.delete(`/admin/courses/${course.id}`);
      toast.success('Đã xoá khoá học.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại.');
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
              <th>Tên khoá học</th>
              <th>HSK</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="admin-table-zh">{c.title}</div>
                  <div className="admin-table-vi">{c.description}</div>
                </td>
                <td>{c.hskLevel || '—'}</td>
                <td>
                  <button className={'status-pill' + (c.published ? ' published' : '')} onClick={() => togglePublish(c)}>
                    <span className="status-pill-dot" />
                    {c.published ? 'Đã xuất bản' : 'Đang ẩn'}
                  </button>
                </td>
                <td className="admin-table-actions">
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
