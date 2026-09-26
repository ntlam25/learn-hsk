import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import JoinClassForm from '../components/JoinClassForm';
import { formatDate } from '../lib/format';

function ProgressLine({ done, total, label }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="course-progress" title={`${pct}%`}>
      <div className="course-progress-bar">
        <div className="course-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span>
        {label} {done}/{total}
      </span>
    </div>
  );
}

export default function MyCoursesPage() {
  const [cards, setCards] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    api
      .get('/me/courses')
      .then((res) => setCards(res.data))
      .catch(() => setError('Không tải được danh sách khoá học của bạn.'));
  }, []);

  useEffect(load, [load]);

  function handleJoined({ class: klass, alreadyEnrolled }) {
    setNotice(alreadyEnrolled ? `Bạn đã ở trong lớp "${klass.name}".` : `Đã vào lớp "${klass.name}" · ${klass.courseTitle}.`);
    load();
  }

  return (
    <main className="page lesson-list-page">
      <header className="page-hero">
        <div className="page-hero-seal">我</div>
        <h1>Khoá học của tôi</h1>
        <p>Các lớp bạn đang học. Nhập mã lớp giáo viên gửi để vào lớp mới.</p>
      </header>

      <JoinClassForm onJoined={handleJoined} />
      {notice && <div className="alert-success">{notice}</div>}
      {error && <div className="alert-error">{error}</div>}
      {!cards && !error && <div className="page-loading">Đang tải…</div>}

      {cards && cards.length === 0 && (
        <div className="empty-state">
          Bạn chưa ở trong lớp học nào. Nhập mã lớp ở trên, hoặc xem thử các <Link to="/preview">bài học xem trước</Link>.
        </div>
      )}

      <div className="lesson-grid">
        {cards?.map((c) => (
          <div key={c.class.id} className={'my-course' + (c.class.ended ? ' ended' : '')}>
            <Link to={`/courses/${c.course.id}`} className="lesson-card">
              <div className="lesson-card-seal">{c.course.hskLevel ? c.course.hskLevel.replace('HSK', '') : '课'}</div>
              <div className="lesson-card-body">
                <div className="lesson-card-zh">{c.course.title}</div>
                <div className="lesson-card-vi">
                  Lớp {c.class.name}
                  {c.class.teacherName ? ` · GV ${c.class.teacherName}` : ''}
                </div>
                {(c.class.startDate || c.class.endDate) && (
                  <div className="lesson-card-vi">
                    {formatDate(c.class.startDate) || '…'} – {formatDate(c.class.endDate) || '…'}
                  </div>
                )}
                {c.class.ended ? <div className="lesson-card-tag">Đã kết thúc · chỉ xem lại</div> : null}
                <ProgressLine done={c.completedCount} total={c.openCount} label="Hoàn thành" />
              </div>
            </Link>
            {c.resumeLesson ? (
              <Link to={`/lessons/${c.resumeLesson.id}?course=${c.course.id}`} className="btn-primary my-course-resume">
                {c.resumeLesson.started ? '▶ Học tiếp' : '▶ Bắt đầu học'} · Bài {c.resumeLesson.lessonNumber}
              </Link>
            ) : (
              <div className="field-hint my-course-resume">Giáo viên chưa mở bài nào cho lớp này.</div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
