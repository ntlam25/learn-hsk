import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import CourseFormModal from '../../components/admin/CourseFormModal';
import ClassFormModal from '../../components/admin/ClassFormModal';
import ImportLessonsModal from '../../components/admin/lesson/ImportLessonsModal';
import AddExistingLessonsModal from '../../components/admin/lesson/AddExistingLessonsModal';
import BulkBar, { SelectAllCell, SelectCell } from '../../components/ui/BulkBar';
import useRowSelection from '../../hooks/useRowSelection';
import { formatDate } from '../../lib/format';
import { classStatus } from '../../lib/classStatus';

function Stat({ value, label, hint }) {
  return (
    <div className="course-stat" title={hint}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

// Tóm tắt nội dung 1 bài: "12 từ · 5 quiz · 3 file nghe …" (bỏ qua mục bằng 0)
function ContentChips({ lesson: l }) {
  const parts = [
    [l.vocabCount, 'từ'],
    [l.quizCount, 'quiz'],
    [l.flashcardCount, 'flashcard'],
    [l.audioCount, 'file nghe'],
    [l.pageCount, 'trang sách'],
  ].filter(([n]) => n > 0);
  if (!parts.length) return <span className="admin-table-vi">Chưa có nội dung</span>;
  return (
    <div className="course-chips">
      {parts.map(([n, label]) => (
        <span key={label} className="course-chip">
          {n} {label}
        </span>
      ))}
    </div>
  );
}

// Lọc bài theo ô tìm kiếm (tên bài, nhãn, "bài N")
function filterLessons(lessons, search) {
  const term = search.trim().toLowerCase();
  if (!term) return lessons;
  return lessons.filter((l) => [l.titleZh, l.titleVi, l.tag, `bài ${l.lessonNumber}`].some((v) => String(v || '').toLowerCase().includes(term)));
}

// Trang chi tiết khoá học (admin/GV): thông tin khoá, số liệu, danh sách bài học và các lớp đang dùng khoá
export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const selection = useRowSelection(data ? filterLessons(data.lessons, search).map((l) => l.id) : []);

  const load = useCallback(() => {
    api
      .get(`/admin/courses/${courseId}/overview`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Không tải được khoá học.'));
  }, [courseId]);

  useEffect(load, [load]);

  async function patchLesson(lesson, patch, message) {
    try {
      await api.put(`/admin/lessons/${lesson.id}`, patch);
      if (message) toast.success(message);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  }

  // Gỡ bài khỏi khoá này — bài vẫn còn (ở khoá khác, hoặc thành bài độc lập); xoá hẳn bài ở trang Bài học
  async function detachLesson(lesson) {
    const others = (lesson.courseIds || []).filter((id) => id !== courseId).length;
    const after = others ? `Bài vẫn còn ở ${others} khoá khác.` : 'Bài sẽ thành bài độc lập (không mất nội dung).';
    if (!confirm(`Gỡ "Bài ${lesson.lessonNumber} · ${lesson.titleVi}" khỏi khoá này?
${after}`)) return;
    try {
      await api.delete(`/admin/courses/${courseId}/lessons/${lesson.id}`);
      toast.success('Đã gỡ bài khỏi khoá.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gỡ bài thất bại.');
    }
  }

  async function detachSelected() {
    const n = selection.count;
    if (!confirm(`Gỡ ${n} bài đã chọn khỏi khoá này?
Bài không bị xoá — vẫn còn ở các khoá khác hoặc thành bài độc lập.`)) return;
    setBulkBusy(true);
    try {
      const res = await api.post(`/admin/courses/${courseId}/lessons/bulk-remove`, { lessonIds: selection.selected });
      toast.success(res.data.message);
      selection.clear();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gỡ bài thất bại.');
    } finally {
      setBulkBusy(false);
    }
  }

  if (error) {
    return (
      <main className="page admin-dashboard-page">
        <div className="alert-error">{error}</div>
        <Link to="/admin/courses" className="btn-ghost">
          ← Danh sách khoá học
        </Link>
      </main>
    );
  }
  if (!data) return <div className="page-loading">Đang tải…</div>;

  const { course, lessons, classes, stats } = data;
  const term = search.trim().toLowerCase();
  const shown = filterLessons(lessons, search);
  const nextNumber = lessons.reduce((m, l) => Math.max(m, l.lessonNumber), 0) + 1;

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <div>
          <Link to="/admin/courses" className="admin-back-link">
            ← Danh sách khoá học
          </Link>
          <h1>
            {course.title}{' '}
            <span className={'class-status ' + (course.published ? 'active' : 'archived')}>
              {course.published ? 'Đã xuất bản' : 'Đang ẩn'}
            </span>
          </h1>
          <div className="admin-table-vi">
            {course.hskLevel || 'Không gắn HSK'} · tạo ngày {formatDate(course.createdAt)}
          </div>
        </div>
        <div className="admin-header-actions">
          <Link to={`/courses/${course.id}`} className="btn-secondary" target="_blank" rel="noreferrer">
            Xem như học viên
          </Link>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Sửa khoá học
          </Button>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            Import JSON
          </Button>
          <Button variant="secondary" onClick={() => setAddOpen(true)}>
            Thêm bài có sẵn
          </Button>
          <Link to={`/admin/lessons/new?courseId=${course.id}`} className="btn-primary">
            + Bài học
          </Link>
        </div>
      </div>

      {course.description && <p className="course-desc">{course.description}</p>}

      <div className="course-stats">
        <Stat value={stats.lessonCount} label="Bài học" />
        <Stat value={stats.publishedCount} label="Đã xuất bản" hint="Bài học viên thấy được (khi lớp đã mở)" />
        <Stat value={stats.previewCount} label="Xem trước" hint="Ai cũng xem được, không cần vào lớp" />
        <Stat value={stats.vocabCount} label="Từ mới" />
        <Stat value={stats.quizCount} label="Câu quiz" />
        <Stat value={stats.classCount} label="Lớp học" hint={user?.role === 'teacher' ? 'Lớp bạn phụ trách' : undefined} />
        <Stat value={stats.studentCount} label="Học viên" hint="Học viên ở nhiều lớp chỉ tính 1 lần" />
      </div>

      <section className="course-section">
        <div className="admin-header">
          <h2>Danh sách bài học</h2>
          <input
            className="course-search"
            type="search"
            placeholder="Tìm theo tên bài, số bài…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <SelectAllCell selection={selection} disabled={!shown.length} />
              <th>Bài</th>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Xem trước</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.id} className={selection.isSelected(l.id) ? 'row-selected' : ''}>
                <SelectCell selection={selection} id={l.id} />
                <td>
                  <span className="course-lesson-num">{l.lessonNumber}</span>
                </td>
                <td>
                  <div className="admin-table-zh">{l.titleZh}</div>
                  <div className="admin-table-vi">{l.titleVi}</div>
                  {l.courseIds?.length > 1 && (
                    <span className="course-chip shared" title="Bài dùng chung — sửa nội dung sẽ áp dụng cho mọi khoá chứa bài">
                      Dùng chung · {l.courseIds.length} khoá
                    </span>
                  )}
                </td>
                <td>
                  <ContentChips lesson={l} />
                </td>
                <td>
                  <button
                    className={'status-pill' + (l.isPreview ? ' published' : '')}
                    title="Bài xem trước: ai cũng xem được, không cần đăng nhập / vào lớp"
                    onClick={() => patchLesson(l, { isPreview: !l.isPreview })}
                  >
                    <span className="status-pill-dot" />
                    {l.isPreview ? 'Có' : 'Không'}
                  </button>
                </td>
                <td>
                  <button className={'status-pill' + (l.published ? ' published' : '')} onClick={() => patchLesson(l, { published: !l.published })}>
                    <span className="status-pill-dot" />
                    {l.published ? 'Đã xuất bản' : 'Đang ẩn'}
                  </button>
                </td>
                <td>{formatDate(l.updatedAt, { withTime: true })}</td>
                <td className="admin-table-actions">
                  <Link to={`/lessons/${l.id}?course=${course.id}`} className="btn-chip">
                    Xem
                  </Link>
                  <Link to={`/admin/lessons/${l.id}/edit`} className="btn-chip">
                    Sửa
                  </Link>
                  <Button variant="chip-danger" onClick={() => detachLesson(l)} title="Gỡ khỏi khoá (không xoá bài)">
                    Gỡ
                  </Button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-state">
                  {lessons.length ? 'Không có bài nào khớp từ khoá.' : 'Khoá học chưa có bài nào. Bấm "+ Bài học", "Thêm bài có sẵn" hoặc "Import JSON" để thêm.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!term && lessons.length > 0 && (
          <div className="course-section-foot">
            <Link to={`/admin/lessons/new?courseId=${course.id}`} className="btn-chip">
              + Thêm bài {nextNumber}
            </Link>
          </div>
        )}
      </section>

      <section className="course-section">
        <div className="admin-header">
          <h2>Lớp học dùng khoá này</h2>
          <Button variant="secondary" onClick={() => setClassOpen(true)}>
            + Tạo lớp
          </Button>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Lớp</th>
              <th>Giáo viên</th>
              <th>Học viên</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => {
              const st = classStatus(c);
              return (
                <tr key={c.id}>
                  <td>
                    <div className="admin-table-zh">{c.name}</div>
                    <div className="admin-table-vi">
                      Mã <code className={'class-code' + (c.joinEnabled ? '' : ' off')}>{c.joinCode}</code>
                    </div>
                  </td>
                  <td>{c.teacher ? c.teacher.fullName || c.teacher.username : '—'}</td>
                  <td>{c.studentCount ?? 0}</td>
                  <td>{c.startDate || c.endDate ? `${formatDate(c.startDate) || '…'} – ${formatDate(c.endDate) || '…'}` : '—'}</td>
                  <td>
                    <span className={`class-status ${st.key}`}>{st.label}</span>
                  </td>
                  <td className="admin-table-actions">
                    <Link to={`/admin/classes/${c.id}`} className="btn-chip">
                      Quản lý
                    </Link>
                    <Link to={`/admin/classes/${c.id}?tab=report`} className="btn-chip">
                      Báo cáo
                    </Link>
                  </td>
                </tr>
              );
            })}
            {classes.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-state">
                  Chưa có lớp nào dùng khoá này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <CourseFormModal
        open={editOpen}
        editing={course}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
      />
      <BulkBar selection={selection} noun="bài">
        <Button variant="chip-danger" onClick={detachSelected} disabled={bulkBusy} title="Gỡ khỏi khoá (không xoá bài)">
          {bulkBusy ? 'Đang gỡ…' : `Gỡ ${selection.count} bài khỏi khoá`}
        </Button>
      </BulkBar>
      <AddExistingLessonsModal
        open={addOpen}
        courseId={course.id}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          load();
        }}
      />
      <ImportLessonsModal open={importOpen} courseId={course.id} onClose={() => setImportOpen(false)} onImported={load} />
      <ClassFormModal
        open={classOpen}
        editing={null}
        courses={[course]}
        defaultCourseId={course.id}
        onClose={() => setClassOpen(false)}
        onSaved={(klass) => {
          setClassOpen(false);
          navigate(`/admin/classes/${klass.id}?tab=lessons`);
        }}
      />
    </main>
  );
}
