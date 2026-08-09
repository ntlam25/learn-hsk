import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate(user.role === 'student' ? '/me/courses' : '/admin', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(identifier, password);
      const dest = location.state?.from?.pathname || (loggedInUser.role === 'student' ? '/me/courses' : '/admin');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Chào mừng trở lại"
      title="Đăng nhập"
      subtitle="Dành cho học viên đang theo học tại trung tâm."
      promoTitle="Học tiếng Trung theo lộ trình HSK bài bản"
      promoText="Đăng nhập để tiếp tục khoá học, làm bài kiểm tra chấm điểm và ôn từ vựng bằng flashcard."
      promoPoints={[
        'Bài học chuẩn giáo trình, đầy đủ file nghe & tài liệu gốc',
        'Quiz chấm điểm tự động, flashcard ôn từ vựng thông minh',
        'Giáo viên theo sát tiến độ từng lớp học',
      ]}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert-error">{error}</div>}

        <label>
          Tên đăng nhập hoặc email
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus required />
        </label>
        <label>
          Mật khẩu
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>

        <p className="login-sub">
          Chưa có tài khoản học viên? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
