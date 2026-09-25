import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCourseNav } from '../context/CourseNavContext';
import { normalizeLesson } from '../lib/lessonContent';
import { formatDate } from '../lib/format';
import BookLessonView from '../components/book/BookLessonView';
import LessonNavBar, { LessonPager } from '../components/book/LessonSwitcher';

// Nút "Hoàn thành bài" cuối bài (học viên). Bài cũng tự hoàn thành khi thuộc hết từ + làm đúng hết quiz.
function LessonCompletion({ status, canSubmit, onChange }) {
  const [busy, setBusy] = useState(false);
  const done = status === 'completed';

  async function toggle() {
    setBusy(true);
    try {
      await onChange(done ? { status: 'in_progress', undo: true } : { status: 'completed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={'lesson-complete' + (done ? ' done' : '')}>
      <div>
        <strong>{done ? '✓ Bạn đã hoàn thành bài này' : 'Học xong bài này?'}</strong>
        <span>
          {done
            ? 'Bài được tính vào tiến độ lớp. Có thể bỏ đánh dấu nếu muốn học lại.'
            : 'Đánh dấu hoàn thành — hoặc bài sẽ tự hoàn thành khi bạn thuộc hết từ mới và làm đúng hết bài kiểm tra.'}
        </span>
      </div>
      {canSubmit ? (
        <button type="button" className={'copy-exercise-text' + (done ? '' : ' copied')} disabled={busy} onClick={toggle}>
          {busy ? 'Đang lưu…' : done ? 'Bỏ đánh dấu' : '✓ Hoàn thành bài'}
        </button>
      ) : null}
    </div>
  );
}

function denyText(data) {
  if (data?.reason === 'locked' && data.releaseAt) {
    return `Bài này chưa được giáo viên mở — sẽ mở vào ${formatDate(data.releaseAt, { withTime: true })}.`;
  }
  return data?.message || 'Không tìm thấy bài học này (có thể đã bị ẩn hoặc bạn chưa có quyền xem).';
}

// Trang xem bài học: hiển thị y hệt "Giáo trình Hán ngữ Bài 1–15.html" (nền giấy, hero, tab…) bên trong khung
// chung (sidebar học viên / thanh điều hướng). Bật class html.book-mode để book.css áp nền/phông của giáo trình.
export default function LessonViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [lesson, setLesson] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [course, setCourse] = useState(null);
  const { setActiveCourse, refresh: refreshCourseNav } = useCourseNav();
  const [error, setError] = useState(null); // { text, reason, courseId }
  const [savedDone, setSavedDone] = useState(undefined);
  const [progress, setProgress] = useState(null); // { status, canSubmit } của học viên
  const saveTimer = useRef(null);
  const pendingSave = useRef(null);
  const currentId = useRef(id);
  currentId.current = id;
  const isStudent = user?.role === 'student';
  const isStaff = user?.role === 'admin' || user?.role === 'teacher'; // xem bài từ trang quản trị (cùng tab)

  useEffect(() => {
    document.documentElement.classList.add('book-mode');
    return () => document.documentElement.classList.remove('book-mode');
  }, []);

  useEffect(() => {
    setLesson(null);
    setError(null);
    api
      .get(`/lessons/${id}`)
      .then((res) => setLesson(normalizeLesson(res.data)))
      .catch((err) => {
        const data = err.response?.data;
        setError({ text: denyText(data), reason: data?.reason, courseId: data?.courseId });
      });
  }, [id]);

  // Danh sách bài cho thanh chọn bài: học viên thấy cả bài chưa mở (🔒, kèm trạng thái hoàn thành từng bài)
  useEffect(() => {
    if (!lesson?.courseId) return;
    setActiveCourse(lesson.courseId); // sidebar học viên tô sáng khoá của bài này
    const req = isStudent
      ? api.get(`/me/courses/${lesson.courseId}`).then((res) => ({ course: res.data.course, lessons: res.data.lessons }))
      : Promise.all([api.get(`/courses/${lesson.courseId}`), api.get(`/courses/${lesson.courseId}/lessons`)]).then(([c, l]) => ({
          course: c.data,
          // Khách chỉ mở được bài xem trước — các bài khác hiện 🔒 thay vì bấm vào rồi mới báo cần đăng nhập
          lessons: user ? l.data : l.data.map((x) => ({ ...x, open: !!x.isPreview })),
        }));
    req
      .then((r) => {
        setCourse(r.course);
        setSiblings(r.lessons);
      })
      .catch(() => setSiblings([]));
  }, [lesson?.courseId, isStudent, user, setActiveCourse]);

  // Học viên: ghi lần xem, rồi lấy trạng thái bài + từ "đã thuộc" (lesson_progress.known_vocab)
  useEffect(() => {
    setSavedDone(undefined);
    setProgress(null);
    if (!lesson || !isStudent) return;
    let cancelled = false;
    api
      .post(`/lessons/${lesson.id}/progress`, { status: 'in_progress' })
      .catch(() => {})
      .then(() => api.get(`/lessons/${lesson.id}/progress`))
      .then((res) => {
        if (cancelled) return;
        setSavedDone(res.data.knownVocab || []);
        setProgress({ status: res.data.status, canSubmit: res.data.canSubmit !== false });
      })
      .catch(() => {}); // lỗi thì vẫn dùng bản trong localStorage
    return () => {
      cancelled = true;
    };
  }, [lesson, isStudent]);

  // Trạng thái bài đổi (hoàn thành / bỏ hoàn thành) → cập nhật trang + để sidebar tải lại dấu ✓
  const statusRef = useRef(null);
  statusRef.current = progress?.status;
  const applyStatus = useCallback(
    (lessonId, status) => {
      if (!status || lessonId !== currentId.current) return;
      if (statusRef.current && status !== statusRef.current) refreshCourseNav();
      setProgress((p) => (p ? { ...p, status } : p));
    },
    [refreshCourseNav]
  );

  const flushSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    const pending = pendingSave.current;
    pendingSave.current = null;
    if (!pending) return;
    api
      .put(`/lessons/${pending.lessonId}/progress/vocab`, { knownVocab: pending.keys })
      .then((res) => applyStatus(pending.lessonId, res.data?.status))
      .catch(() => {});
  }, [applyStatus]);

  // Bấm ✓ liên tục thì gom lại, chỉ gửi bản cuối; rời trang / đổi bài thì gửi ngay
  const saveDone = useCallback(
    (keys) => {
      if (!isStudent || !lesson || progress?.canSubmit === false) return;
      pendingSave.current = { lessonId: lesson.id, keys };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushSave, 600);
    },
    [isStudent, lesson, progress?.canSubmit, flushSave]
  );

  useEffect(() => flushSave, [id, flushSave]);

  async function changeCompletion(body) {
    const res = await api.post(`/lessons/${lesson.id}/progress`, body);
    applyStatus(lesson.id, res.data.status);
  }

  const switcherLessons = useMemo(() => {
    if (!lesson) return [];
    const list = siblings.some((l) => l.id === lesson.id) ? siblings : [...siblings, lesson];
    // Bài đang xem lấy trạng thái mới nhất (vừa bấm / tự hoàn thành) để dấu ✓ cập nhật ngay
    const status = progress?.status;
    return [...list]
      .map((l) => (l.id === lesson.id && status ? { ...l, status } : l))
      .sort((a, b) => a.lessonNumber - b.lessonNumber);
  }, [siblings, lesson, progress?.status]);

  function selectLesson(l) {
    navigate(`/lessons/${l.id}`);
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
  }

  const backTo = (lesson || error)?.courseId ? `/courses/${(lesson || error).courseId}` : '/';

  if (error || !lesson) {
    return (
      <div className="book-view">
        <div className="book-state">
          {error ? (
            <>
              <p>{error.text}</p>
              <div className="book-state-actions">
                {!user && (
                  <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="copy-exercise-text">
                    Đăng nhập
                  </Link>
                )}
                {error.reason === 'not_enrolled' && (
                  <Link to="/me/courses" className="copy-exercise-text">
                    Nhập mã lớp
                  </Link>
                )}
                <Link to={backTo} className="copy-exercise-text">
                  {error.courseId ? '← Về trang khoá học' : '← Về danh sách khoá học'}
                </Link>
              </div>
            </>
          ) : (
            <p>Đang tải bài học…</p>
          )}
        </div>
      </div>
    );
  }

  const canSubmit = progress?.canSubmit !== false;
  const openLessons = switcherLessons.filter((l) => l.open !== false);

  return (
    <>
      <BookLessonView
        key={lesson.id}
        lesson={lesson}
        top={
          <>
            <LessonNavBar
              course={course}
              courseHref={isStaff ? `/admin/courses/${lesson.courseId}` : undefined}
              lessons={switcherLessons}
              currentId={lesson.id}
              onSelect={selectLesson}
              lockedHint={user ? undefined : 'Đăng nhập và vào lớp để học bài này'}
            />
            {!canSubmit ? (
              <div className="book-ended-banner">Lớp học đã kết thúc — bạn vẫn xem lại được bài, nhưng không nộp bài / lưu tiến độ nữa.</div>
            ) : null}
          </>
        }
        bottom={
          <>
            {isStudent && progress ? <LessonCompletion status={progress.status} canSubmit={canSubmit} onChange={changeCompletion} /> : null}
            <LessonPager lessons={openLessons} currentId={lesson.id} onSelect={selectLesson} />
          </>
        }
        savedDone={savedDone}
        onDoneChange={isStudent ? saveDone : undefined}
        canSubmit={canSubmit}
        onQuizResult={(r) => applyStatus(lesson.id, r.lessonStatus)}
      />
    </>
  );
}
