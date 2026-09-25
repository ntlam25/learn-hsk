import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import api from '../api/client';
import { CLASSES_CHANGED } from '../lib/events';
import { formatDate } from '../lib/format';
import { CourseNavContext, useCourseNav } from '../context/CourseNavContext';
import AppShell from './AppShell';
import { IconClass, IconCourse, IconLesson, IconUser } from './icons';

const NAV_ITEMS = [
  { to: '/me/courses', icon: IconClass, label: 'Khoá học của tôi' },
  { to: '/', icon: IconCourse, label: 'Tất cả khoá học', end: true },
  { to: '/preview', icon: IconLesson, label: 'Bài xem trước' },
  { to: '/account', icon: IconUser, label: 'Tài khoản' },
];

const TITLE_RULES = [
  { prefix: '/me/courses', label: 'Khoá học của tôi' },
  { prefix: '/courses/', label: 'Khoá học' },
  { prefix: '/lessons/', label: 'Bài học' },
  { prefix: '/preview', label: 'Bài xem trước' },
  { prefix: '/account', label: 'Tài khoản của tôi' },
  { prefix: '/join', label: 'Vào lớp học' },
  { prefix: '/', label: 'Tất cả khoá học', exact: true },
];

// Tên bài ngắn cho sidebar: "Bài 4 · 你去哪儿" → "你去哪儿"
function shortTitle(l) {
  return String(l.titleVi || '').replace(/^Bài\s*\d+\s*[·:.-]\s*/i, '') || l.titleZh || `Bài ${l.lessonNumber}`;
}

function LessonList({ lessons }) {
  if (!lessons) return <div className="sidebar-lessons-loading">Đang tải bài…</div>;
  if (!lessons.length) return <div className="sidebar-lessons-loading">Khoá chưa có bài.</div>;
  return (
    <div className="sidebar-lessons">
      {lessons.map((l) =>
        l.open ? (
          <NavLink key={l.id} to={`/lessons/${l.id}`} className="sidebar-lesson" title={`${l.titleZh} · ${l.titleVi}`}>
            <span className="sidebar-lesson-num">{l.lessonNumber}</span>
            <span className="sidebar-lesson-title">{shortTitle(l)}</span>
            {l.status === 'completed' ? <span className="sidebar-lesson-mark done">✓</span> : null}
          </NavLink>
        ) : (
          <span
            key={l.id}
            className="sidebar-lesson locked"
            title={l.releaseAt ? `Mở vào ${formatDate(l.releaseAt, { withTime: true })}` : 'Giáo viên chưa mở bài này'}
          >
            <span className="sidebar-lesson-num">{l.lessonNumber}</span>
            <span className="sidebar-lesson-title">{shortTitle(l)}</span>
            <span className="sidebar-lesson-mark">🔒</span>
          </span>
        )
      )}
    </div>
  );
}

// "Lớp đang học": mỗi khoá 1 mục (khoá có nhiều lớp chỉ hiện 1 lần). Khoá đang xem (trang khoá / trang bài)
// tự xổ danh sách bài; các khoá khác bấm ▸ để xổ. Danh sách bài lấy từ /me/courses/:id, lưu tạm theo khoá.
function MyClassesNav() {
  const { activeCourseId, version } = useCourseNav();
  const location = useLocation();
  const [cards, setCards] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [lessonsByCourse, setLessonsByCourse] = useState({});
  const loading = useRef(new Set());
  const rootRef = useRef(null);

  const loadCards = useCallback(() => {
    api
      .get('/me/courses')
      .then((res) => setCards(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    window.addEventListener(CLASSES_CHANGED, loadCards);
    return () => window.removeEventListener(CLASSES_CHANGED, loadCards);
  }, [loadCards]);

  // Lần đầu + mỗi khi có thay đổi tiến độ: tải lại thẻ lớp, bỏ cache danh sách bài để tải lại
  useEffect(() => {
    loadCards();
    setLessonsByCourse({});
  }, [version, loadCards]);

  useEffect(() => {
    if (activeCourseId) setExpanded((prev) => (prev.has(activeCourseId) ? prev : new Set(prev).add(activeCourseId)));
  }, [activeCourseId]);

  useEffect(() => {
    expanded.forEach((courseId) => {
      if (lessonsByCourse[courseId] || loading.current.has(courseId)) return;
      loading.current.add(courseId);
      api
        .get(`/me/courses/${courseId}`)
        .then((res) => setLessonsByCourse((m) => ({ ...m, [courseId]: res.data.lessons })))
        .catch(() => setLessonsByCourse((m) => ({ ...m, [courseId]: [] })))
        .finally(() => loading.current.delete(courseId));
    });
  }, [expanded, lessonsByCourse]);

  // Đưa bài đang xem vào tầm nhìn của sidebar (chỉ cuộn khung menu, không cuộn trang)
  useEffect(() => {
    const active = rootRef.current?.querySelector('.sidebar-lesson.active');
    const nav = active?.closest('.admin-sidebar-nav');
    if (!active || !nav) return;
    const a = active.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    if (a.top < n.top || a.bottom > n.bottom) nav.scrollTop += a.top - n.top - n.height / 2;
  }, [location.pathname, lessonsByCourse]);

  const courses = useMemo(() => {
    const list = [];
    cards.forEach((c) => {
      if (!list.some((x) => x.course.id === c.course.id)) list.push(c);
    });
    return list;
  }, [cards]);

  if (!courses.length) return null;

  function toggle(courseId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  }

  return (
    <div ref={rootRef} className="sidebar-classes">
      <div className="admin-sidebar-section">Lớp đang học</div>
      {courses.map((c) => {
        const open = expanded.has(c.course.id);
        return (
          <div key={c.course.id} className={'sidebar-course' + (open ? ' expanded' : '')}>
            <NavLink to={`/courses/${c.course.id}`} end title={`${c.course.title} · Lớp ${c.class.name}`}>
              <span className={'admin-sidebar-icon sidebar-course-seal' + (c.class.ended ? ' ended' : '')}>
                {c.course.hskLevel ? c.course.hskLevel.replace('HSK', '') : '课'}
              </span>
              <span className="admin-sidebar-label sidebar-course-label">
                <span>{c.course.title}</span>
                <small>
                  Lớp {c.class.name} · {c.completedCount}/{c.openCount} bài
                </small>
              </span>
            </NavLink>
            <button
              type="button"
              className="sidebar-course-toggle"
              aria-expanded={open}
              aria-label={open ? 'Thu gọn danh sách bài' : 'Xem danh sách bài'}
              onClick={() => toggle(c.course.id)}
            >
              {open ? '▾' : '▸'}
            </button>
            {open ? <LessonList lessons={lessonsByCourse[c.course.id]} /> : null}
          </div>
        );
      })}
    </div>
  );
}

// Khung giao diện cho học viên đã đăng nhập: cùng kiểu sidebar với cổng quản trị
export default function StudentLayout() {
  const [activeCourseId, setActiveCourse] = useState(null);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const nav = useMemo(() => ({ activeCourseId, version, setActiveCourse, refresh }), [activeCourseId, version, refresh]);

  return (
    <CourseNavContext.Provider value={nav}>
      <AppShell
        brand={{ eyebrow: 'Hán Ngữ', name: 'Góc học tập' }}
        navItems={NAV_ITEMS}
        extraNav={<MyClassesNav />}
        footer="Cổng học viên"
        subtitle="Mỗi ngày một bài — kiên trì là tiến bộ"
        titleRules={TITLE_RULES}
        homePath="/me/courses"
        accountPath="/account"
      />
    </CourseNavContext.Provider>
  );
}
