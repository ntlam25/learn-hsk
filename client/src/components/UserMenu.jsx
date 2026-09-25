import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLogout, IconUser } from './icons';

const ROLE_LABEL = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học viên' };

export function Avatar({ user, size = 36 }) {
  const initial = (user?.fullName || user?.username || '?').trim().charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className="user-avatar" style={style} />;
  }
  return (
    <div className="user-avatar user-avatar-fallback" style={style}>
      {initial}
    </div>
  );
}

export default function UserMenu({ accountPath = '/account' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!user) return null;

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/');
  }

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="user-menu-avatar">
          <Avatar user={user} />
        </span>
        <span className="user-menu-info">
          <strong>{user.fullName || user.username}</strong>
          <span>{ROLE_LABEL[user.role] || user.role}</span>
        </span>
        <span className={'user-menu-chevron' + (open ? ' open' : '')}>▾</span>
      </button>
      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-head">
            <strong>{user.fullName || user.username}</strong>
            <span>{user.email || '@' + user.username}</span>
          </div>
          <Link to={accountPath} onClick={() => setOpen(false)} className="user-menu-item">
            <IconUser /> Tài khoản của tôi
          </Link>
          <div className="user-menu-divider" />
          <button type="button" className="user-menu-item user-menu-logout" onClick={handleLogout}>
            <IconLogout /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
