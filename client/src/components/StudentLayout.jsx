import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import api from '../api/client';
import { CLASSES_CHANGED } from '../lib/events';
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

// "Lớp đang học": mỗi khoá 1 mục (khoá có nhiều lớp chỉ hiện 1 lần), kèm thanh tiến độ.
// Việc chuyển bài nằm ở thanh chọn bài trên đầu trang xem bài — sidebar không liệt kê bài để luôn gọn.
// Khoá đang xem (trang khoá / trang bài của khoá) được tô sáng.
function MyClassesNav() {
  const { activeCourseId, version } = useCourseNav();
  const { pathname } = useLocation();
  const [cards, setCards] = useState([]);
  // Trang khoá tự sáng nhờ NavLink; trang bài thì sáng theo khoá của bài đang xem
  const lessonCourseId = pathname.startsWith('/lessons/') && activeCourseId != null ? String(activeCourseId) : null;

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

  // Lần đầu + mỗi khi có thay đổi tiến độ: tải lại thẻ lớp
  useEffect(() => {
    loadCards();
  }, [version, loadCards]);

  const courses = useMemo(() => {
    const list = [];
    cards.forEach((c) => {
      if (!list.some((x) => x.course.id === c.course.id)) list.push(c);
    });
    return list;
  }, [cards]);

  if (!courses.length) return null;

  return (
    <div className="sidebar-classes">
      <div className="admin-sidebar-section">Lớp đang học</div>
      {courses.map((c) => {
        const percent = c.openCount ? Math.round((c.completedCount / c.openCount) * 100) : 0;
        return (
          <NavLink
            key={c.course.id}
            to={`/courses/${c.course.id}`}
            end
            title={`${c.course.title} · Lớp ${c.class.name}`}
            className={({ isActive }) => (isActive || String(c.course.id) === lessonCourseId ? 'active' : undefined)}
          >
            <span className={'admin-sidebar-icon sidebar-course-seal' + (c.class.ended ? ' ended' : '')}>
              {c.course.hskLevel ? c.course.hskLevel.replace('HSK', '') : '课'}
            </span>
            <span className="admin-sidebar-label sidebar-course-label">
              <span>{c.course.title}</span>
              <small>
                Lớp {c.class.name} · {c.completedCount}/{c.openCount} bài
              </small>
              <span
                className="sidebar-course-progress"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tiến độ khoá học"
              >
                <span style={{ width: `${percent}%` }} />
              </span>
            </span>
          </NavLink>
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
