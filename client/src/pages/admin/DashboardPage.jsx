import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import ImportLessonsModal from '../../components/admin/lesson/ImportLessonsModal';
import BulkBar, { SelectAllCell, SelectCell } from '../../components/ui/BulkBar';
import useRowSelection from '../../hooks/useRowSelection';

export default function DashboardPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const selection = useRowSelection((lessons || []).map((l) => l.id));

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
    const used = (lesson.courseIds || []).length;
    const where = used ? `
Bài đang dùng ở ${used} khoá — sẽ biến mất khỏi tất cả các khoá này.` : '';
    if (!confirm(`Xoá hẳn "${lesson.titleVi}"?${where}
Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/lessons/${lesson.id}`);
      toast.success('Đã xoá bài học.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  }

  async function handleBulkDelete() {
    const picked = lessons.filter((l) => selection.isSelected(l.id));
    const shared = picked.filter((l) => l.courseIds?.length).length;
    const warn = shared ? `
${shared} bài đang nằm trong khoá học — sẽ biến mất khỏi các khoá đó.` : '';
    if (!confirm(`Xoá hẳn ${picked.length} bài học đã chọn?${warn}
Hành động này không thể hoàn tác.`)) return;
    setBulkBusy(true);
    try {
      const res = await api.post('/admin/lessons/bulk-delete', { ids: selection.selected });
      toast.success(res.data.message);
      selection.clear();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại.');
    } finally {
      setBulkBusy(false);
    }
  }

  const courseOptions = [
    { value: '', label: 'Tất cả bài học' },
    { value: 'none', label: 'Bài độc lập (chưa thuộc khoá)' },
    ...courses.map((c) => ({ value: c.id, label: c.title })),
  ];
  const courseTitle = Object.fromEntries(courses.map((c) => [c.id, c.title]));
  const realCourseId = courseId === 'none' ? '' : courseId;

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Quản trị bài học</h1>
        <div className="admin-header-actions">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            Import JSON
          </Button>
          <Link to={`/admin/lessons/new${realCourseId ? `?courseId=${realCourseId}` : ''}`} className="btn-primary">
            + Tạo bài học mới
          </Link>
        </div>
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
              <SelectAllCell selection={selection} disabled={!lessons.length} />
              <th>Bài</th>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id} className={selection.isSelected(l.id) ? 'row-selected' : ''}>
                <SelectCell selection={selection} id={l.id} />
                <td>{l.lessonNumber}</td>
                <td>
                  <div className="admin-table-zh">{l.titleZh}</div>
                  <div className="admin-table-vi">
                    {l.titleVi} {l.isPreview ? '· Xem trước' : ''}
                  </div>
                  <div className="lesson-course-tags">
                    {l.courseIds?.length ? (
                      l.courseIds.map((id) => (
                        <Link key={id} to={`/admin/courses/${id}`} className="course-chip">
                          {courseTitle[id] || 'Khoá học'}
                        </Link>
                      ))
                    ) : (
                      <span className="course-chip muted">Bài độc lập</span>
                    )}
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
                  <Link to={`/lessons/${l.id}${l.courseIds?.[0] ? `?course=${l.courseIds[0]}` : ''}`} className="btn-chip">
                    Xem
                  </Link>
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
                <td colSpan={6} className="empty-state">
                  Chưa có bài học nào. Bấm "Tạo bài học mới" hoặc "Import JSON" để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <BulkBar selection={selection} noun="bài">
        <Button variant="chip-danger" onClick={handleBulkDelete} disabled={bulkBusy}>
          {bulkBusy ? 'Đang xoá…' : `Xoá ${selection.count} bài`}
        </Button>
      </BulkBar>

      <ImportLessonsModal
        open={importOpen}
        courses={courses}
        defaultCourseId={realCourseId}
        onClose={() => setImportOpen(false)}
        onImported={load}
      />
    </main>
  );
}
