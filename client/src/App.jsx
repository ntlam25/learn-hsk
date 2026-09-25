import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import api from './api/client';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import StudentLayout from './components/StudentLayout';
import { useAuth } from './context/AuthContext';
import LessonListPage from './pages/LessonListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonViewPage from './pages/LessonViewPage';
import PreviewLessonsPage from './pages/PreviewLessonsPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MyCoursesPage from './pages/MyCoursesPage';
import AccountPage from './pages/AccountPage';
import AdminLoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import LessonEditorPage from './pages/admin/LessonEditorPage';
import CourseManagerPage from './pages/admin/CourseManagerPage';
import AdminCourseDetailPage from './pages/admin/CourseDetailPage';
import ClassManagerPage from './pages/admin/ClassManagerPage';
import ClassDetailPage from './pages/admin/ClassDetailPage';
import JoinClassPage from './pages/JoinClassPage';
import SettingsPage from './pages/admin/SettingsPage';
import UsersManagerPage from './pages/admin/UsersManagerPage';
import ProtectedRoute from './components/ProtectedRoute';

// Link cũ /admin/classes/:id/report → tab Báo cáo của trang lớp
function ClassReportRedirect() {
  const { classId } = useParams();
  return <Navigate to={`/admin/classes/${classId}?tab=report`} replace />;
}

// Các trang chung:
//  • học viên đã đăng nhập → khung sidebar học viên (StudentLayout)
//  • GV / admin xem bài học (từ trang quản trị) → vẫn trong khung sidebar quản trị (AdminLayout)
//  • còn lại (khách, GV / admin ở trang công khai) → thanh điều hướng trên cùng
function PublicLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  if (user?.role === 'student') return <StudentLayout />;
  if ((user?.role === 'admin' || user?.role === 'teacher') && pathname.startsWith('/lessons/')) return <AdminLayout />;
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  useEffect(() => {
    api
      .get('/settings')
      .then((res) => document.documentElement.setAttribute('data-mood', res.data.mood))
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/lessons/:id" element={<LessonViewPage />} />
          <Route path="/" element={<LessonListPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/preview" element={<PreviewLessonsPage />} />
          <Route path="/join/:code" element={<JoinClassPage />} />

          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/me/courses"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <MyCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<div className="page-loading">Không tìm thấy trang.</div>} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/courses" element={<CourseManagerPage />} />
          <Route path="/admin/courses/:courseId" element={<AdminCourseDetailPage />} />
          <Route path="/admin/classes" element={<ClassManagerPage />} />
          <Route path="/admin/classes/:classId" element={<ClassDetailPage />} />
          <Route path="/admin/classes/:classId/report" element={<ClassReportRedirect />} />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UsersManagerPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/lessons/new" element={<LessonEditorPage mode="create" />} />
          <Route path="/admin/lessons/:id/edit" element={<LessonEditorPage mode="edit" />} />
          <Route path="/admin/account" element={<AccountPage />} />
        </Route>
      </Routes>
    </div>
  );
}
