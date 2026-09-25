import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="page-loading">Đang kiểm tra đăng nhập…</div>;

  const isAdminArea = allowedRoles && !allowedRoles.includes('student');

  // Giữ trang đang mở để đăng nhập xong quay lại đúng chỗ
  if (!user) return <Navigate to={isAdminArea ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
