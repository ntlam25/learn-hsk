import { useAuth } from '../context/AuthContext';
import AppShell from './AppShell';
import { IconClass, IconCourse, IconLesson, IconSettings, IconUsers } from './icons';

const NAV_ITEMS = [
  { to: '/admin', icon: IconLesson, label: 'Bài học', end: true },
  { to: '/admin/courses', icon: IconCourse, label: 'Khoá học', alsoActive: ['/lessons/'] }, // đang xem bài cũng sáng mục Khoá học
  { to: '/admin/classes', icon: IconClass, label: 'Lớp học' },
  { to: '/admin/users', icon: IconUsers, label: 'Người dùng', adminOnly: true },
  { to: '/admin/settings', icon: IconSettings, label: 'Cài đặt', adminOnly: true },
];

const TITLE_RULES = [
  { prefix: '/admin/lessons/new', label: 'Tạo bài học mới' },
  { prefix: '/admin/lessons', label: 'Sửa bài học' },
  { prefix: '/admin/courses/', label: 'Chi tiết khoá học' },
  { prefix: '/admin/courses', label: 'Quản lý khoá học' },
  { prefix: '/admin/classes', label: 'Quản lý lớp học' },
  { prefix: '/admin/users', label: 'Quản lý người dùng' },
  { prefix: '/admin/settings', label: 'Cài đặt hệ thống' },
  { prefix: '/admin/account', label: 'Tài khoản của tôi' },
  { prefix: '/lessons/', label: 'Xem bài học' },
  { prefix: '/admin', label: 'Quản trị bài học' },
];

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <AppShell
      brand={{ eyebrow: 'Hán Ngữ', name: 'LMS Quản trị' }}
      navItems={NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin')}
      footer={`Cổng quản trị · ${user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}`}
      subtitle="Bảng quản trị Giáo trình Hán ngữ"
      titleRules={TITLE_RULES}
      homePath="/admin"
      accountPath="/admin/account"
    />
  );
}
