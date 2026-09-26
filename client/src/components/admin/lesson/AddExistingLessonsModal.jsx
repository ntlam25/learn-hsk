import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';
import Checkbox from '../../ui/Checkbox';
import Modal from '../../ui/Modal';

// Thêm bài có sẵn (bài độc lập hoặc bài của khoá khác) vào khoá — bài được dùng chung, không sao chép:
// sửa bài ở đâu thì mọi khoá chứa bài đều thấy thay đổi.
export default function AddExistingLessonsModal({ open, courseId, onClose, onAdded }) {
  const toast = useToast();
  const [lessons, setLessons] = useState(null);
  const [courses, setCourses] = useState([]);
  const [picked, setPicked] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPicked([]);
    setSearch('');
    setError('');
    setLessons(null);
    Promise.all([api.get('/admin/lessons'), api.get('/admin/courses')])
      .then(([l, c]) => {
        setLessons(l.data.filter((x) => !(x.courseIds || []).includes(courseId)));
        setCourses(c.data);
      })
      .catch(() => setError('Không tải được danh sách bài học.'));
  }, [open, courseId]);

  const courseTitle = useMemo(() => Object.fromEntries(courses.map((c) => [c.id, c.title])), [courses]);
  const term = search.trim().toLowerCase();
  const shown = (lessons || []).filter(
    (l) =>
      !term ||
      [l.titleZh, l.titleVi, l.tag, `bài ${l.lessonNumber}`, ...(l.courseIds || []).map((id) => courseTitle[id])].some((v) =>
        String(v || '').toLowerCase().includes(term)
      )
  );
  const allShownPicked = shown.length > 0 && shown.every((l) => picked.includes(l.id));

  function toggle(id) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function toggleAllShown() {
    const ids = shown.map((l) => l.id);
    setPicked((p) => (allShownPicked ? p.filter((x) => !ids.includes(x)) : [...new Set([...p, ...ids])]));
  }

  async function handleAdd() {
    setSaving(true);
    setError('');
    try {
      const res = await api.post(`/admin/courses/${courseId}/lessons`, { lessonIds: picked });
      toast.success(res.data.message);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Thêm bài thất bại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="wide"
      title="Thêm bài có sẵn vào khoá"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleAdd} disabled={saving || !picked.length}>
            {saving ? 'Đang thêm…' : `Thêm ${picked.length} bài`}
          </Button>
        </>
      }
    >
      <div className="imp">
        <p className="admin-table-vi">
          Bài được <b>dùng chung</b>, không sao chép: sửa nội dung ở một nơi thì mọi khoá chứa bài đều cập nhật theo.
        </p>
        <div className="add-lessons-toolbar">
          <input
            className="course-search"
            type="search"
            placeholder="Tìm theo tên bài, số bài, tên khoá…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {shown.length > 0 && (
            <Checkbox checked={allShownPicked} onChange={toggleAllShown} label={`Chọn tất cả (${shown.length})`} />
          )}
        </div>

        {error && <div className="alert-error">{error}</div>}
        {!lessons && !error && <div className="page-loading">Đang tải…</div>}

        {lessons && (
          <div className="imp-table-wrap">
            <table className="admin-table add-lessons-table">
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id} className={picked.includes(l.id) ? 'picked' : ''} onClick={() => toggle(l.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={picked.includes(l.id)} onChange={() => toggle(l.id)} />
                    </td>
                    <td>
                      <span className="course-lesson-num">{l.lessonNumber}</span>
                    </td>
                    <td>
                      <div className="admin-table-zh">{l.titleZh}</div>
                      <div className="admin-table-vi">{l.titleVi}</div>
                    </td>
                    <td>
                      <div className="lesson-course-tags">
                        {l.courseIds?.length ? (
                          l.courseIds.map((id) => (
                            <span key={id} className="course-chip">
                              {courseTitle[id] || 'Khoá học'}
                            </span>
                          ))
                        ) : (
                          <span className="course-chip muted">Bài độc lập</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      {lessons.length ? 'Không có bài nào khớp từ khoá.' : 'Mọi bài học đều đã có trong khoá này.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
