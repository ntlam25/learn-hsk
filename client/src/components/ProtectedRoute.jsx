import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Đang kiểm tra đăng nhập…</div>;

  const isAdminArea = allowedRoles && !allowedRoles.includes('student');

  if (!user) return <Navigate to={isAdminArea ? '/admin/login' : '/login'} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
