import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const isMyArea = location.pathname.startsWith('/me');
  const isAuthPage = ['/login', '/register'].includes(location.pathname) || isAdminArea;

  return (
    <header className="topnav">
      <Link to="/" className="topnav-brand">
        <Brand eyebrow="Hán Ngữ" name="Giáo trình Hán ngữ" />
      </Link>
      <nav className="topnav-links">
        <Link to="/" className={!isAuthPage && !isMyArea && location.pathname !== '/preview' ? 'active' : ''}>
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
        {!user && (
          <>
            <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>
              Đăng ký
            </Link>
            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
              Đăng nhập
            </Link>
          </>
        )}
      </nav>
      <div className="topnav-actions">
        <ThemeToggle />
        {user && <UserMenu accountPath="/account" />}
      </div>
    </header>
  );
}
