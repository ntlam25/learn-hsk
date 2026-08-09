import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function PreviewLessonsPage() {
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/lessons/preview')
      .then((res) => setLessons(res.data))
      .catch(() => setError('Không tải được danh sách bài học xem trước.'));
  }, []);

  return (
    <main className="page lesson-list-page">
      <header className="page-hero">
        <div className="page-hero-seal">试</div>
        <h1>Bài học xem trước</h1>
        <p>Xem thử miễn phí, không cần đăng nhập hay chờ được thêm vào lớp.</p>
      </header>

      {error && <div className="alert-error">{error}</div>}
      {!lessons && !error && <div className="page-loading">Đang tải…</div>}

      {lessons && lessons.length === 0 && <div className="empty-state">Hiện chưa có bài học nào được mở xem trước.</div>}

      <div className="lesson-grid">
        {lessons?.map((l) => (
          <Link key={l.id} to={`/lessons/${l.id}`} className="lesson-card">
            <div className="lesson-card-seal">{l.seal || `${l.lessonNumber}课`}</div>
            <div className="lesson-card-body">
              <div className="lesson-card-zh">{l.titleZh}</div>
              <div className="lesson-card-vi">{l.titleVi}</div>
              <div className="lesson-card-tag">{l.courseTitle}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="preview-page-cta">
        <p>Thích những gì bạn thấy? Đăng ký tài khoản để được thêm vào lớp và học đầy đủ.</p>
        <Link to="/register" className="btn-primary">
          Đăng ký học viên
        </Link>
      </div>
    </main>
  );
}
