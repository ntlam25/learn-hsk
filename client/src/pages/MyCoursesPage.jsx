import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/me/courses')
      .then((res) => setCourses(res.data))
      .catch(() => setError('Không tải được danh sách khoá học của bạn.'));
  }, []);

  return (
    <main className="page lesson-list-page">
      <header className="page-hero">
        <div className="page-hero-seal">我</div>
        <h1>Khoá học của tôi</h1>
        <p>Các khoá học bạn đã được giáo viên/quản trị viên thêm vào lớp.</p>
      </header>

      {error && <div className="alert-error">{error}</div>}
      {!courses && !error && <div className="page-loading">Đang tải…</div>}

      {courses && courses.length === 0 && (
        <div className="empty-state">
          Bạn chưa được thêm vào lớp học nào. Hãy liên hệ giáo viên/quản trị viên, hoặc xem thử các{' '}
          <Link to="/">bài học xem trước</Link>.
        </div>
      )}

      <div className="lesson-grid">
        {courses?.map((c) => (
          <Link key={c.id} to={`/courses/${c.id}`} className="lesson-card">
            <div className="lesson-card-seal">{c.hskLevel ? c.hskLevel.replace('HSK', '') : '课'}</div>
            <div className="lesson-card-body">
              <div className="lesson-card-zh">{c.title}</div>
              <div className="lesson-card-vi">{c.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
