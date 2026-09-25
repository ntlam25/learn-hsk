import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import ClassFormModal from '../../components/admin/ClassFormModal';
import ClassOverviewTab from '../../components/admin/class/ClassOverviewTab';
import ClassStudentsTab from '../../components/admin/class/ClassStudentsTab';
import ClassLessonsTab from '../../components/admin/class/ClassLessonsTab';
import ClassReportTab from '../../components/admin/class/ClassReportTab';
import { classStatus } from '../../lib/classStatus';

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'students', label: 'Học viên' },
  { key: 'lessons', label: 'Bài học' },
  { key: 'report', label: 'Báo cáo' },
];

// Trang quản lý 1 lớp: thông tin + mã mời, học viên, lịch mở bài, báo cáo tiến độ (tab nằm trên URL ?tab=)
export default function ClassDetailPage() {
  const { classId } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'overview';
  const [klass, setKlass] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    api
      .get(`/admin/classes/${classId}`)
      .then((res) => setKlass(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Không tải được lớp học.'));
    api.get('/admin/courses').then((res) => setCourses(res.data)).catch(() => {});
  }, [classId]);

  if (error) {
    return (
      <main className="page admin-dashboard-page">
        <div className="alert-error">{error}</div>
        <Link to="/admin/classes" className="btn-ghost">
          ← Danh sách lớp
        </Link>
      </main>
    );
  }
  if (!klass) return <div className="page-loading">Đang tải…</div>;

  const st = classStatus(klass);

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <div>
          <Link to="/admin/classes" className="admin-back-link">
            ← Danh sách lớp
          </Link>
          <h1>
            {klass.name} <span className={`class-status ${st.key}`}>{st.label}</span>
          </h1>
          <div className="admin-table-vi">{klass.courseTitle}</div>
        </div>
        <nav className="admin-nav-pills">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={`?tab=${t.key}`}
              className={t.key === tab ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                setParams({ tab: t.key });
              }}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>

      {tab === 'overview' && <ClassOverviewTab klass={klass} onChanged={setKlass} onEdit={() => setEditing(true)} />}
      {tab === 'students' && (
        <ClassStudentsTab klass={klass} onCountChange={(n) => setKlass((k) => (k.studentCount === n ? k : { ...k, studentCount: n }))} />
      )}
      {tab === 'lessons' && <ClassLessonsTab klass={klass} />}
      {tab === 'report' && <ClassReportTab klass={klass} />}

      <ClassFormModal
        open={editing}
        editing={klass}
        courses={courses}
        onClose={() => setEditing(false)}
        onSaved={(k) => {
          setEditing(false);
          setKlass(k);
        }}
      />
    </main>
  );
}
