import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/format';

function lessonLabel(l) {
  return l.titleVi || `Bài ${l.lessonNumber}`;
}

// Bỏ dấu tiếng Việt + chữ thường để gõ "ban" khớp "bạn"
function fold(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();
}

// Gõ toàn số → lọc theo số bài ("2" khớp bài 2, 20–29…); còn lại tìm trong tên tiếng Việt / tiếng Trung
function matchesQuery(l, q) {
  if (!q) return true;
  if (/^\d+$/.test(q)) return String(l.lessonNumber).startsWith(q);
  return fold(`${l.titleVi} ${l.titleZh}`).includes(fold(q));
}

// Chip lọc theo trạng thái; bài chưa mở chỉ thuộc nhóm "Chưa mở"
const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả', test: () => true },
  { key: 'todo', label: 'Chưa học', test: (l) => l.open !== false && l.status === 'not_started' },
  { key: 'doing', label: 'Đang học', test: (l) => l.open !== false && l.status === 'in_progress' },
  { key: 'done', label: 'Đã xong', test: (l) => l.open !== false && l.status === 'completed' },
  { key: 'locked', label: 'Chưa mở', test: (l) => l.open === false },
];

// Thanh điều hướng trên đầu trang xem bài: ‹ về khoá học · nút chọn bài (mở lưới mọi bài của khoá) · ‹ › bài trước/sau.
// `lessons` đã sắp theo số bài; bài `open === false` hiện 🔒 và không bấm được, `status === 'completed'` hiện ✓.
// Lưới có ô tìm (số bài / tiếng Trung / tiếng Việt không dấu) + chip lọc theo trạng thái cho khoá nhiều bài.
// `lockedHint`: tooltip cho bài bị khoá không có ngày mở (học viên: GV chưa mở; khách: cần đăng nhập).
// `courseHref`: đích của link khoá (mặc định trang khoá phía học viên; admin/GV thì về trang quản trị của khoá).
export default function LessonNavBar({ course, courseHref, lessons, currentId, onSelect, lockedHint = 'Giáo viên chưa mở bài này' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const ref = useRef(null);
  const gridRef = useRef(null);
  const searchRef = useRef(null);
  const openLessons = lessons.filter((l) => l.open !== false);
  const index = openLessons.findIndex((l) => l.id === currentId);
  const current = lessons.find((l) => l.id === currentId);
  const prev = openLessons[index - 1];
  const next = openLessons[index + 1];

  const q = query.trim();
  const filtering = !!q || statusFilter !== 'all';
  // Chỉ hiện chip có bài (khách / GV không có trạng thái học → thường chỉ còn "Tất cả" và hàng chip bị ẩn)
  const chips = useMemo(
    () => STATUS_FILTERS.map((f) => ({ ...f, count: lessons.filter(f.test).length })).filter((f) => f.key === 'all' || f.count > 0),
    [lessons]
  );
  const statusTest = (STATUS_FILTERS.find((f) => f.key === statusFilter) || STATUS_FILTERS[0]).test;
  const shown = lessons.filter((l) => statusTest(l) && matchesQuery(l, q));

  function resetFilter() {
    setQuery('');
    setStatusFilter('all');
  }

  function close() {
    setOpen(false);
    resetFilter();
  }

  // Đóng khi bấm ra ngoài / nhấn Esc (giống ui/Select); Esc lần đầu chỉ xoá chữ đang tìm
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && close();
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (searchRef.current?.value) setQuery('');
      else close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => close(), [currentId]);

  // Mở lưới: focus ô tìm, cuộn tới bài đang xem (khoá nhiều bài)
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus({ preventScroll: true });
    gridRef.current?.querySelector('.lesson-picker-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  function select(l) {
    close();
    if (l.id !== currentId) onSelect(l);
  }

  // Enter trong ô tìm: chỉ còn đúng 1 bài mở được thì vào luôn
  function onSearchKey(e) {
    if (e.key !== 'Enter') return;
    const selectable = shown.filter((l) => l.open !== false);
    if (selectable.length === 1) select(selectable[0]);
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
        <button type="button" className={'lesson-navbar-picker' + (open ? ' open' : '')} aria-expanded={open} onClick={() => (open ? close() : setOpen(true))}>
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
          <div className="lesson-picker-filter">
            <div className="lesson-picker-head">
              <strong>{course?.title || 'Các bài trong khoá'}</strong>
              <span>
                {filtering ? `Hiện ${shown.length}/${lessons.length} bài` : `${lessons.length} bài`}
                {doneCount ? ` · đã hoàn thành ${doneCount}` : ''}
              </span>
            </div>
            <input
              ref={searchRef}
              type="search"
              className="lesson-picker-search"
              placeholder="Tìm số bài, tiếng Trung, tiếng Việt…"
              aria-label="Tìm bài học"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
            />
            {chips.length > 1 ? (
              <div className="lesson-picker-chips" role="group" aria-label="Lọc theo trạng thái">
                {chips.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={'lesson-picker-chip' + (statusFilter === f.key ? ' active' : '')}
                    aria-pressed={statusFilter === f.key}
                    onClick={() => setStatusFilter(f.key)}
                  >
                    {f.label} <em>{f.count}</em>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {shown.length ? (
            <div className="lesson-picker-grid" ref={gridRef}>
              {shown.map((l) => {
                const locked = l.open === false;
                const doing = !locked && l.status === 'in_progress';
                const cls =
                  'lesson-picker-item' +
                  (l.id === currentId ? ' active' : '') +
                  (locked ? ' locked' : '') +
                  (l.status === 'completed' ? ' completed' : '') +
                  (doing ? ' in-progress' : '');
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
                      {locked ? (
                        <em>🔒</em>
                      ) : l.status === 'completed' ? (
                        <em className="done">✓</em>
                      ) : doing ? (
                        <em className="doing" title="Đang học" />
                      ) : null}
                    </span>
                    <span className="lesson-picker-title">{lessonLabel(l)}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="lesson-picker-empty">
              <span>Không có bài khớp.</span>
              <button
                type="button"
                onClick={() => {
                  resetFilter();
                  searchRef.current?.focus();
                }}
              >
                Xoá lọc
              </button>
            </div>
          )}
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
