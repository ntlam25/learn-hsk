import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCourseNav } from '../context/CourseNavContext';
import JoinClassForm from '../components/JoinClassForm';
import { formatDate } from '../lib/format';
import { withNext } from '../lib/nextPath';

// Nhãn trạng thái của bài với học viên: khoá / đã hoàn thành / đang học (% từ đã thuộc)
function lessonBadge(l) {
  if (!l.open) return l.releaseAt ? `🔒 Mở ngày ${formatDate(l.releaseAt)}` : '🔒 Chưa mở';
  if (l.status === 'completed') return '✓ Đã hoàn thành';
  if (l.status === 'in_progress') return l.vocabTotal ? `Đang học · thuộc ${l.knownCount}/${l.vocabTotal} từ` : 'Đang học';
  return l.isPreview ? 'Xem trước' : 'Chưa học';
}

function LessonCard({ lesson: l, mine, courseId }) {
  const body = (
    <>
      <div className="lesson-card-seal">{l.status === 'completed' ? '✓' : l.seal || `${l.lessonNumber}课`}</div>
      <div className="lesson-card-body">
        <div className="lesson-card-zh">{l.titleZh}</div>
        <div className="lesson-card-vi">{l.titleVi}</div>
        <div className="lesson-card-tag">{mine ? lessonBadge(l) : l.isPreview ? 'Xem trước' : l.tag}</div>
      </div>
    </>
  );
  const cls = 'lesson-card' + (mine ? ` lesson-${l.open ? l.status : 'locked'}` : '');
  if (mine && !l.open) {
    return (
      <div className={cls} aria-disabled="true" title="Giáo viên chưa mở bài này cho lớp của bạn">
        {body}
      </div>
    );
  }
  return (
    <Link to={`/lessons/${l.id}?course=${courseId}`} className={cls}>
      {body}
    </Link>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const isStudent = user?.role === 'student';
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState(null);
  const [mine, setMine] = useState(null); // dữ liệu /me/courses/:id của học viên
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    const reqs = [api.get(`/courses/${courseId}`), api.get(`/courses/${courseId}/lessons`)];
    if (isStudent) reqs.push(api.get(`/me/courses/${courseId}`));
    Promise.all(reqs)
      .then(([courseRes, lessonsRes, mineRes]) => {
        setCourse(courseRes.data);
        setLessons(lessonsRes.data);
        setMine(mineRes?.data || null);
      })
      .catch(() => setError('Không tìm thấy khoá học này.'));
  }, [courseId, isStudent]);

  useEffect(load, [load]);

  // Sidebar học viên xổ danh sách bài của khoá đang xem
  const { setActiveCourse } = useCourseNav();
  useEffect(() => setActiveCourse(courseId), [courseId, setActiveCourse]);

  if (error) {
    return (
      <main className="page">
        <div className="alert-error">{error}</div>
        <Link to="/" className="btn-ghost">
          ← Về danh sách khoá học
        </Link>
      </main>
    );
  }

  if (!course || !lessons) {
    return (
      <main className="page">
        <div className="page-loading">Đang tải khoá học…</div>
      </main>
    );
  }

  const enrolled = !!mine?.enrolled;
  const list = enrolled ? mine.lessons : lessons;

  return (
    <main className="page lesson-list-page">
      <header className="page-hero">
        <div className="page-hero-seal">{course.hskLevel ? course.hskLevel.replace('HSK', '') : '课'}</div>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
      </header>

      {enrolled ? (
        <div className="course-me-bar">
          <div>
            {mine.classes.map((c) => (
              <div key={c.id}>
                <strong>Lớp {c.name}</strong>
                {c.teacherName ? ` · GV ${c.teacherName}` : ''}
                {c.ended ? ' · Đã kết thúc (chỉ xem lại)' : ''}
              </div>
            ))}
            <span>
              Đã hoàn thành {mine.completedCount}/{mine.openCount} bài đã mở · khoá có {mine.lessons.length} bài
            </span>
          </div>
          {mine.resumeLesson && (
            <Link to={`/lessons/${mine.resumeLesson.id}?course=${courseId}`} className="btn-primary">
              {mine.resumeLesson.started ? '▶ Học tiếp' : '▶ Bắt đầu học'} · Bài {mine.resumeLesson.lessonNumber}
            </Link>
          )}
        </div>
      ) : isStudent ? (
        <JoinClassForm onJoined={load} />
      ) : !user ? (
        <div className="course-me-bar">
          <span>Đăng nhập và nhập mã lớp giáo viên gửi để học khoá này (bài có nhãn "Xem trước" thì xem được ngay).</span>
          <Link to={withNext('/login', location.pathname)} className="btn-primary">
            Đăng nhập
          </Link>
        </div>
      ) : null}

      {list.length === 0 && <div className="empty-state">Khoá học này chưa có bài học nào.</div>}

      <div className="lesson-grid">
        {list.map((l) => (
          <LessonCard key={l.id} lesson={l} mine={enrolled} courseId={courseId} />
        ))}
      </div>
    </main>
  );
}
