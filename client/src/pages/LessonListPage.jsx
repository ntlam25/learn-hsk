import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const HSK_ORDER = ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', null];
const HSK_LABEL = {
  HSK1: 'HSK 1',
  HSK2: 'HSK 2',
  HSK3: 'HSK 3',
  HSK4: 'HSK 4',
  HSK5: 'HSK 5',
  HSK6: 'HSK 6',
  null: 'Khoá học khác',
};

const MISSION_CARDS = [
  {
    icon: '🎯',
    title: 'Lộ trình rõ ràng',
    desc: 'Khoá học chia theo từng cấp độ HSK, đi từ nhập môn đến nâng cao, học viên luôn biết mình đang ở đâu.',
  },
  {
    icon: '✍️',
    title: 'Học đi đôi với luyện tập',
    desc: 'Mỗi bài học có quiz chấm điểm tự động và flashcard ôn từ vựng, không chỉ đọc mà còn kiểm tra được ngay.',
  },
  {
    icon: '❤️',
    title: 'Học viên là trung tâm',
    desc: 'Giáo viên theo sát từng lớp học, xem báo cáo tiến độ để hỗ trợ đúng người, đúng lúc.',
  },
];

const FEATURE_CARDS = [
  {
    icon: '📖',
    title: 'Bài giảng chuẩn giáo trình',
    desc: 'Đầy đủ Từ mới, Bài khóa, Ngữ âm, Ngữ pháp, kèm file nghe theo từng phần và ảnh trang sách gốc.',
  },
  {
    icon: '🧠',
    title: 'Luyện tập & chấm điểm tự động',
    desc: 'Quiz chấm điểm ngay khi nộp bài, flashcard ưu tiên ôn lại từ vựng bạn chưa thuộc.',
  },
  {
    icon: '📊',
    title: 'Theo dõi tiến độ cùng giáo viên',
    desc: 'Lớp học có giáo viên phụ trách, báo cáo điểm số và tiến độ học tập theo thời gian thực.',
  },
];

export default function LessonListPage() {
  const [courses, setCourses] = useState(null);
  const [previewLessons, setPreviewLessons] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/courses'), api.get('/lessons/preview')])
      .then(([coursesRes, previewRes]) => {
        setCourses(coursesRes.data);
        setPreviewLessons(previewRes.data);
      })
      .catch(() => setError('Không tải được danh sách khoá học. Kiểm tra kết nối tới API.'));
  }, []);

  const grouped = HSK_ORDER.map((level) => ({
    level,
    courses: (courses || []).filter((c) => (c.hskLevel || null) === level),
  })).filter((g) => g.courses.length > 0);

  return (
    <main className="lesson-list-page">
      {/* ===== Hero ===== */}
      <section className="home-hero">
        <span className="home-hero-eyebrow">✦ Trung tâm Hán ngữ trực tuyến</span>
        <h1>
          Chinh phục tiếng Trung <span className="home-hero-highlight">theo chuẩn HSK</span>
        </h1>
        <p>
          Trung tâm cung cấp lộ trình học bài bản từ HSK1 đến HSK6, kết hợp bài giảng chuẩn giáo trình với luyện tập
          chấm điểm tự động, giúp học viên tiến bộ rõ ràng từng ngày.
        </p>
        <div className="home-hero-actions">
          <a href="#courses" className="btn-primary">
            Khám phá khoá học →
          </a>
          <Link to="/preview" className="btn-secondary">
            Xem bài học miễn phí
          </Link>
        </div>
        <div className="home-hero-stats">
          <div>
            <strong>6</strong>
            <span>Cấp độ HSK</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>Bài tập chấm điểm tự động</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Học mọi lúc, mọi nơi</span>
          </div>
        </div>
      </section>

      {/* ===== Về trung tâm / Sứ mệnh ===== */}
      <section className="home-section">
        <span className="home-section-eyebrow">Về trung tâm</span>
        <h2 className="section-title">Cầu nối giữa giáo trình truyền thống & học tập số hoá</h2>
        <p className="home-section-lead">
          Chúng tôi số hoá giáo trình Hán ngữ quen thuộc, giữ nguyên chất lượng nội dung gốc nhưng thêm khả năng luyện
          tập, chấm điểm và theo dõi tiến độ mà sách giấy không làm được.
        </p>
        <div className="mission-grid">
          {MISSION_CARDS.map((c, i) => (
            <div key={i} className="mission-card">
              <div className="mission-card-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Tính năng cốt lõi (dark section) ===== */}
      <section className="home-dark-section">
        <span className="home-section-eyebrow">Trải nghiệm học tập</span>
        <h2 className="section-title">Ba trụ cột trong mỗi bài học</h2>
        <p className="home-section-lead">Được thiết kế riêng cho việc tự học và học theo lớp có giáo viên.</p>
        <div className="feature-grid">
          {FEATURE_CARDS.map((c, i) => (
            <div key={i} className="feature-card">
              <div className="feature-card-icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA xem bài học miễn phí ===== */}
      {previewLessons.length > 0 && (
        <section className="preview-cta-banner">
          <div className="preview-cta-text">
            <span className="home-section-eyebrow">Không cần đăng ký</span>
            <h2>Xem thử {previewLessons.length} bài học miễn phí</h2>
            <p>Trải nghiệm ngay giao diện bài học, từ vựng, hội thoại và luyện tập trước khi đăng ký lớp.</p>
          </div>
          <Link to="/preview" className="btn-primary preview-cta-button">
            Xem bài học xem trước →
          </Link>
        </section>
      )}

      {/* ===== Danh sách khoá học ===== */}
      <section id="courses" className="home-section">
        <span className="home-section-eyebrow">Khoá học</span>
        <h2 className="section-title">Chọn khoá học theo trình độ HSK</h2>

        {error && <div className="alert-error">{error}</div>}
        {!courses && !error && <div className="page-loading">Đang tải danh sách khoá học…</div>}

        {courses && courses.length === 0 && (
          <div className="empty-state">
            Chưa có khoá học nào được xuất bản. Vào trang <Link to="/admin/login">Quản trị</Link> để thêm khoá học.
          </div>
        )}

        {grouped.map((group) => (
          <div key={group.level || 'other'} className="hsk-group">
            <h3 className="hsk-group-title">{HSK_LABEL[group.level]}</h3>
            <div className="lesson-grid">
              {group.courses.map((c) => (
                <Link key={c.id} to={`/courses/${c.id}`} className="lesson-card">
                  <div className="lesson-card-seal">{group.level ? group.level.replace('HSK', '') : '课'}</div>
                  <div className="lesson-card-body">
                    <div className="lesson-card-zh">{c.title}</div>
                    <div className="lesson-card-vi">{c.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
