import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate('/me/courses', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      await register(username, email, password, fullName);
      navigate('/me/courses', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Bắt đầu học ngay"
      title="Đăng ký học viên"
      subtitle='Sau khi đăng ký, bạn cần được giáo viên/quản trị viên thêm vào lớp thì mới xem được các khoá học (trừ những bài "xem trước").'
      promoTitle="Gia nhập cộng đồng học tiếng Trung"
      promoText="Tạo tài khoản miễn phí để lưu tiến độ học tập, làm bài kiểm tra và ôn từ vựng mọi lúc mọi nơi."
      promoPoints={[
        'Miễn phí đăng ký, không cần thẻ thanh toán',
        'Xem trước một số bài học ngay cả khi chưa vào lớp',
        'Được giáo viên thêm vào đúng lớp theo trình độ HSK',
      ]}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="alert-error">{error}</div>}

        <label>
          Họ tên
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
        </label>
        <label>
          Tên đăng nhập
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[a-z0-9_.]{3,32}"
            title="3-32 ký tự, chỉ gồm chữ thường, số, dấu chấm và gạch dưới"
            required
          />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Mật khẩu
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </label>
        <label>
          Nhập lại mật khẩu
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
        </label>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Đang đăng ký…' : 'Đăng ký'}
        </button>

        <p className="login-sub">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
