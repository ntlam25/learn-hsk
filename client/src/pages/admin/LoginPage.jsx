import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from '../../components/AuthLayout';
import PasswordInput from '../../components/PasswordInput';

export default function AdminLoginPage() {
  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user && (user.role === 'admin' || user.role === 'teacher')) {
    navigate('/admin', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(identifier, password);
      if (loggedInUser.role !== 'admin' && loggedInUser.role !== 'teacher') {
        logout();
        setError('Tài khoản này không có quyền truy cập cổng quản trị.');
        return;
      }
      const dest = location.state?.from?.pathname || '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Cổng quản trị"
      title="Đăng nhập quản trị"
      subtitle="Dành riêng cho giáo viên và quản trị viên trung tâm."
      promoTitle="Quản lý khoá học, lớp học và tiến độ học viên"
      promoText="Soạn bài giảng, tạo lớp học, thêm học viên và theo dõi kết quả học tập ở một nơi duy nhất."
      promoPoints={[
        'Soạn bài học đầy đủ tab Từ mới / Bài khóa / Ngữ pháp / Luyện tập',
        'Tạo lớp học, ghi danh học viên bằng email',
        'Xem báo cáo tiến độ và điểm số theo từng lớp',
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
          Là học viên? <Link to="/login">Đăng nhập tại đây</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
