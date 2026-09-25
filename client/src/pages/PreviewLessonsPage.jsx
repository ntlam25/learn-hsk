import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

// Lời mời cuối trang theo người xem: khách → đăng ký / đăng nhập; học viên → nhập mã lớp; GV/admin → không hiện
function PreviewCta({ user }) {
  if (!user) {
    return (
      <div className="preview-page-cta">
        <p>Thích những gì bạn thấy? Đăng ký tài khoản, rồi nhập mã lớp giáo viên gửi để học đầy đủ.</p>
        <div className="preview-page-cta-actions">
          <Link to="/register" className="btn-primary">
            Đăng ký học viên
          </Link>
          <Link to="/login" className="btn-secondary">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>
    );
  }
  if (user.role !== 'student') return null;
  return (
    <div className="preview-page-cta">
      <p>Muốn học đầy đủ các bài? Nhập mã lớp giáo viên gửi cho bạn để vào lớp.</p>
      <Link to="/me/courses" className="btn-primary">
        Nhập mã lớp
      </Link>
    </div>
  );
}

export default function PreviewLessonsPage() {
  const { user } = useAuth();
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

      <PreviewCta user={user} />
    </main>
  );
}
