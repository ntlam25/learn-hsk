import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    Promise.all([api.get(`/courses/${courseId}`), api.get(`/courses/${courseId}/lessons`)])
      .then(([courseRes, lessonsRes]) => {
        setCourse(courseRes.data);
        setLessons(lessonsRes.data);
      })
      .catch(() => setError('Không tìm thấy khoá học này.'));
  }, [courseId]);

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

  return (
    <main className="page lesson-list-page">
      <header className="page-hero">
        <div className="page-hero-seal">{course.hskLevel ? course.hskLevel.replace('HSK', '') : '课'}</div>
        <h1>{course.title}</h1>
        <p>{course.description}</p>
      </header>

      {lessons.length === 0 && <div className="empty-state">Khoá học này chưa có bài học nào.</div>}

      <div className="lesson-grid">
        {lessons.map((l) => (
          <Link key={l.id} to={`/lessons/${l.id}`} className="lesson-card">
            <div className="lesson-card-seal">{l.seal || `${l.lessonNumber}课`}</div>
            <div className="lesson-card-body">
              <div className="lesson-card-zh">{l.titleZh}</div>
              <div className="lesson-card-vi">{l.titleVi}</div>
              <div className="lesson-card-tag">{l.isPreview ? 'Xem trước' : l.tag}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
