import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/format';

function lessonLabel(l) {
  return l.titleVi || `Bài ${l.lessonNumber}`;
}

// Thanh điều hướng trên đầu trang xem bài: ‹ về khoá học · nút chọn bài (mở lưới mọi bài của khoá) · ‹ › bài trước/sau.
// `lessons` đã sắp theo số bài; bài `open === false` hiện 🔒 và không bấm được, `status === 'completed'` hiện ✓.
// `lockedHint`: tooltip cho bài bị khoá không có ngày mở (học viên: GV chưa mở; khách: cần đăng nhập).
// `courseHref`: đích của link khoá (mặc định trang khoá phía học viên; admin/GV thì về trang quản trị của khoá).
export default function LessonNavBar({ course, courseHref, lessons, currentId, onSelect, lockedHint = 'Giáo viên chưa mở bài này' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const openLessons = lessons.filter((l) => l.open !== false);
  const index = openLessons.findIndex((l) => l.id === currentId);
  const current = lessons.find((l) => l.id === currentId);
  const prev = openLessons[index - 1];
  const next = openLessons[index + 1];

  // Đóng khi bấm ra ngoài / nhấn Esc (giống ui/Select)
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [currentId]);

  function select(l) {
    setOpen(false);
    if (l.id !== currentId) onSelect(l);
  }

  const doneCount = lessons.filter((l) => l.status === 'completed').length;

  return (
    <div className="lesson-navbar" ref={ref}>
      {course ? (
        <Link to={courseHref || `/courses/${course.id}`} className="lesson-navbar-course" title="Về trang khoá học">
          <span aria-hidden="true">‹</span> {course.title}
        </Link>
      ) : (
        <span />
      )}

      <div className="lesson-navbar-center">
        <button type="button" className="lesson-navbar-prev" disabled={!prev} onClick={() => prev && select(prev)} title={prev ? lessonLabel(prev) : undefined}>
          ‹ <span>Bài trước</span>
        </button>
        <button type="button" className={'lesson-navbar-picker' + (open ? ' open' : '')} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {current ? (
            <>
              <span className="zh">第{current.lessonNumber}课</span>
              <span className="lesson-navbar-picker-title">{lessonLabel(current)}</span>
            </>
          ) : (
            'Chọn bài học'
          )}
          <span className="lesson-navbar-chevron">▾</span>
        </button>
        <button type="button" className="lesson-navbar-next" disabled={!next} onClick={() => next && select(next)} title={next ? lessonLabel(next) : undefined}>
          <span>Bài sau</span> ›
        </button>
      </div>

      {open ? (
        <div className="lesson-picker" role="dialog" aria-label="Chọn bài học">
          <div className="lesson-picker-head">
            <strong>{course?.title || 'Các bài trong khoá'}</strong>
            <span>
              {lessons.length} bài{doneCount ? ` · đã hoàn thành ${doneCount}` : ''}
            </span>
          </div>
          <div className="lesson-picker-grid">
            {lessons.map((l) => {
              const locked = l.open === false;
              const cls =
                'lesson-picker-item' + (l.id === currentId ? ' active' : '') + (locked ? ' locked' : '') + (l.status === 'completed' ? ' completed' : '');
              return (
                <button
                  key={l.id}
                  type="button"
                  className={cls}
                  disabled={locked}
                  title={locked ? (l.releaseAt ? `Mở vào ${formatDate(l.releaseAt, { withTime: true })}` : lockedHint) : lessonLabel(l)}
                  onClick={() => select(l)}
                >
                  <span className="lesson-picker-num">
                    第{l.lessonNumber}课
                    {locked ? <em>🔒</em> : l.status === 'completed' ? <em className="done">✓</em> : null}
                  </span>
                  <span className="lesson-picker-title">{lessonLabel(l)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Nút "Bài trước / Bài sau" cuối bài học; `lessons` đã sắp theo số bài.
export function LessonPager({ lessons, currentId, onSelect }) {
  const index = lessons.findIndex((l) => l.id === currentId);
  if (index < 0 || lessons.length < 2) return null;
  const prev = lessons[index - 1];
  const next = lessons[index + 1];
  return (
    <nav aria-label="Chuyển bài" className="lesson-pager">
      {prev ? (
        <button type="button" className="lesson-pager-btn prev" onClick={() => onSelect(prev)}>
          <span className="lesson-pager-dir">← Bài trước</span>
          <span className="lesson-pager-name">第{prev.lessonNumber}课 · Bài {prev.lessonNumber}</span>
        </button>
      ) : (
        <span />
      )}
      {next ? (
        <button type="button" className="lesson-pager-btn next" onClick={() => onSelect(next)}>
          <span className="lesson-pager-dir">Bài sau →</span>
          <span className="lesson-pager-name">第{next.lessonNumber}课 · Bài {next.lessonNumber}</span>
        </button>
      ) : (
        <span />
      )}
    </nav>
  );
}
