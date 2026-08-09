import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const isMyArea = location.pathname.startsWith('/me');

  return (
    <header className="topnav">
      <Link to="/" className="topnav-brand">
        <span className="topnav-seal">汉</span>
        <span>Giáo trình Hán ngữ</span>
      </Link>
      <nav className="topnav-links">
        <Link to="/" className={!isAdminArea && !isMyArea ? 'active' : ''}>
          Khoá học
        </Link>
        <Link to="/preview" className={location.pathname === '/preview' ? 'active' : ''}>
          Xem trước
        </Link>
        {user?.role === 'student' && (
          <Link to="/me/courses" className={isMyArea ? 'active' : ''}>
            Khoá học của tôi
          </Link>
        )}
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Link to="/admin" className={isAdminArea ? 'active' : ''}>
            Quản trị
          </Link>
        )}
        {user ? (
          <UserMenu accountPath="/account" />
        ) : (
          <>
            <Link to="/register">Đăng ký</Link>
            <Link to="/login">Đăng nhập</Link>
          </>
        )}
      </nav>
    </header>
  );
}
