import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import api from './api/client';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
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
import ClassManagerPage from './pages/admin/ClassManagerPage';
import ClassReportPage from './pages/admin/ClassReportPage';
import SettingsPage from './pages/admin/SettingsPage';
import UsersManagerPage from './pages/admin/UsersManagerPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => document.documentElement.setAttribute('data-mood', res.data.mood))
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      {!isAdminArea && <Navbar />}
      <Routes>
        <Route path="/" element={<LessonListPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/lessons/:id" element={<LessonViewPage />} />
        <Route path="/preview" element={<PreviewLessonsPage />} />

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

        <Route
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/courses" element={<CourseManagerPage />} />
          <Route path="/admin/classes" element={<ClassManagerPage />} />
          <Route path="/admin/classes/:classId/report" element={<ClassReportPage />} />
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

        <Route path="*" element={<div className="page-loading">Không tìm thấy trang.</div>} />
      </Routes>
    </div>
  );
}
