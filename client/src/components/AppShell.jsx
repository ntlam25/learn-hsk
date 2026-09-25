import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';
import Brand from './Brand';
import ThemeToggle from './ThemeToggle';
import { IconChevronRight, IconCollapse, IconExpand, IconHome, IconMenu } from './icons';

const MOBILE_QUERY = '(max-width: 991px)';

function pageTitle(rules, pathname) {
  const match = rules.find((r) => (r.exact ? pathname === r.prefix : pathname.startsWith(r.prefix)));
  return match?.label || '';
}

// Khung giao diện có sidebar dùng chung cho cổng quản trị và cổng học viên.
// Khi đổi trang chỉ phần <Outlet /> (nội dung) thay đổi — sidebar/topbar giữ nguyên, không dựng lại.
//  • navItems: [{ to, icon, label, end?, alsoActive?: ['/tiền-tố/'] }] — alsoActive: mục vẫn sáng ở các trang con khác   • extraNav: phần tử thêm dưới menu (VD: danh sách lớp của học viên)
//  • titleRules: [{ prefix, label, exact? }] cho breadcrumb (khớp theo thứ tự)
export default function AppShell({ brand, navItems, extraNav = null, footer, subtitle, titleRules, homePath, accountPath }) {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Đổi trang trên mobile thì đóng sidebar
  useEffect(() => setMobileOpen(false), [location.pathname]);

  function handleToggle() {
    if (window.matchMedia(MOBILE_QUERY).matches) setMobileOpen((o) => !o);
    else setCollapsed((c) => !c);
  }

  const shellClass = 'admin-shell' + (collapsed ? ' collapsed' : '') + (mobileOpen ? ' mobile-open' : '');

  return (
    <div className={shellClass}>
      <aside className="admin-sidebar">
        <Link to={homePath} className="admin-sidebar-brand">
          <Brand eyebrow={brand.eyebrow} name={brand.name} />
        </Link>
        <nav className="admin-sidebar-nav">
          {navItems.map(({ to, end, label, alsoActive, icon: NavIcon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) => (isActive || alsoActive?.some((p) => location.pathname.startsWith(p)) ? 'active' : undefined)}
            >
              <span className="admin-sidebar-icon">
                <NavIcon />
              </span>
              <span className="admin-sidebar-label">{label}</span>
            </NavLink>
          ))}
          {extraNav}
        </nav>
        <div className="admin-sidebar-footer">{footer}</div>
      </aside>
      <div className="admin-sidebar-backdrop" onClick={() => setMobileOpen(false)} />

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="icon-btn"
              onClick={handleToggle}
              title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
              aria-label="Thu gọn/mở rộng menu"
            >
              <span className="icon-desktop-only">{collapsed ? <IconExpand /> : <IconCollapse />}</span>
              <span className="icon-mobile-only">
                <IconMenu />
              </span>
            </button>
            <div className="admin-greeting">
              <h2>Xin chào, {user?.fullName || user?.username}!</h2>
              <span>{subtitle}</span>
            </div>
          </div>
          <div className="admin-topbar-right">
            <ThemeToggle />
            <UserMenu accountPath={accountPath} />
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-breadcrumb">
            <Link to={homePath} aria-label="Trang chủ">
              <IconHome />
            </Link>
            <IconChevronRight />
            <strong>{pageTitle(titleRules, location.pathname)}</strong>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
