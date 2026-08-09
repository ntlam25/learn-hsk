import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';

const NAV_ITEMS = [
  { to: '/admin', icon: '📄', label: 'Bài học', end: true },
  { to: '/admin/courses', icon: '📚', label: 'Khoá học' },
  { to: '/admin/classes', icon: '🏫', label: 'Lớp học' },
  { to: '/admin/users', icon: '👤', label: 'Người dùng', adminOnly: true },
  { to: '/admin/settings', icon: '⚙️', label: 'Cài đặt', adminOnly: true },
];

const TITLE_RULES = [
  { prefix: '/admin/lessons/new', label: 'Tạo bài học mới' },
  { prefix: '/admin/lessons', label: 'Sửa bài học' },
  { prefix: '/admin/courses', label: 'Quản lý khoá học' },
  { prefix: '/admin/classes', label: 'Quản lý lớp học' },
  { prefix: '/admin/users', label: 'Quản lý người dùng' },
  { prefix: '/admin/settings', label: 'Cài đặt hệ thống' },
  { prefix: '/admin/account', label: 'Tài khoản của tôi' },
  { prefix: '/admin', label: 'Quản trị bài học' },
];

function pageTitle(pathname) {
  const match = TITLE_RULES.find((r) => pathname.startsWith(r.prefix));
  return match?.label || 'Quản trị';
}

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar-brand">
          <span className="topnav-seal">汉</span>
          <span>Hán Ngữ LMS</span>
        </Link>
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin').map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              <span className="admin-sidebar-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">Cổng quản trị · {user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}</div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <Link to="/" className="admin-breadcrumb-home">
              🏠
            </Link>
            <span>›</span>
            <strong>{pageTitle(location.pathname)}</strong>
          </div>
          <UserMenu accountPath="/admin/account" />
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
