import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function DashboardPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/courses').then((res) => setCourses(res.data)).catch(() => {});
  }, []);

  function load() {
    api
      .get('/admin/lessons', { params: courseId ? { courseId } : {} })
      .then((res) => setLessons(res.data))
      .catch(() => setError('Không tải được danh sách bài học.'));
  }

  useEffect(load, [courseId]);

  async function togglePublish(lesson) {
    try {
      await api.put(`/admin/lessons/${lesson.id}`, { published: !lesson.published });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  }

  async function handleDelete(lesson) {
    if (!confirm(`Xoá "${lesson.titleVi}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/lessons/${lesson.id}`);
      toast.success('Đã xoá bài học.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  }

  const courseOptions = [{ value: '', label: 'Tất cả khoá học' }, ...courses.map((c) => ({ value: c.id, label: c.title }))];

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Quản trị bài học</h1>
        <Link to={`/admin/lessons/new${courseId ? `?courseId=${courseId}` : ''}`} className="btn-primary">
          + Tạo bài học mới
        </Link>
      </div>

      <div className="admin-filter-field">
        <span>Lọc theo khoá học</span>
        <Select value={courseId} onChange={setCourseId} options={courseOptions} />
      </div>

      {error && <div className="alert-error">{error}</div>}
      {!lessons && !error && <div className="page-loading">Đang tải…</div>}

      {lessons && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Bài</th>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id}>
                <td>{l.lessonNumber}</td>
                <td>
                  <div className="admin-table-zh">{l.titleZh}</div>
                  <div className="admin-table-vi">
                    {l.titleVi} {l.isPreview ? '· Xem trước' : ''}
                  </div>
                </td>
                <td>
                  <button
                    className={'status-pill' + (l.published ? ' published' : '')}
                    onClick={() => togglePublish(l)}
                  >
                    <span className="status-pill-dot" />
                    {l.published ? 'Đã xuất bản' : 'Đang ẩn'}
                  </button>
                </td>
                <td>{new Date(l.updatedAt).toLocaleString('vi-VN')}</td>
                <td className="admin-table-actions">
                  <Link to={`/admin/lessons/${l.id}/edit`} className="btn-chip">
                    Sửa
                  </Link>
                  <Button variant="chip-danger" onClick={() => handleDelete(l)}>
                    Xoá
                  </Button>
                </td>
              </tr>
            ))}
            {lessons.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Chưa có bài học nào. Bấm "Tạo bài học mới" để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
