import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import CourseFormModal from '../../components/admin/CourseFormModal';
import ClassFormModal from '../../components/admin/ClassFormModal';
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

  async function deleteLesson(lesson) {
    if (!confirm(`Xoá "Bài ${lesson.lessonNumber} · ${lesson.titleVi}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/lessons/${lesson.id}`);
      toast.success('Đã xoá bài học.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại.');
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
  const shown = term
    ? lessons.filter((l) => [l.titleZh, l.titleVi, l.tag, `bài ${l.lessonNumber}`].some((v) => String(v || '').toLowerCase().includes(term)))
    : lessons;
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
              <tr key={l.id}>
                <td>
                  <span className="course-lesson-num">{l.lessonNumber}</span>
                </td>
                <td>
                  <div className="admin-table-zh">{l.titleZh}</div>
                  <div className="admin-table-vi">{l.titleVi}</div>
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
                  <Link to={`/lessons/${l.id}`} className="btn-chip">
                    Xem
                  </Link>
                  <Link to={`/admin/lessons/${l.id}/edit`} className="btn-chip">
                    Sửa
                  </Link>
                  <Button variant="chip-danger" onClick={() => deleteLesson(l)}>
                    Xoá
                  </Button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  {lessons.length ? 'Không có bài nào khớp từ khoá.' : 'Khoá học chưa có bài nào. Bấm "+ Bài học" để thêm.'}
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
