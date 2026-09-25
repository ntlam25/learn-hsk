import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import ClassFormModal from '../../components/admin/ClassFormModal';
import { formatDate } from '../../lib/format';
import { classStatus } from '../../lib/classStatus';

export default function ClassManagerPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    api.get('/admin/courses').then((res) => setCourses(res.data)).catch(() => {});
    api
      .get('/admin/classes')
      .then((res) => setClasses(res.data))
      .catch(() => setLoadError('Không tải được danh sách lớp.'));
  }, []);

  const visible = (classes || []).filter((c) => showArchived || !c.archived);
  const archivedCount = (classes || []).filter((c) => c.archived).length;

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Quản lý lớp học</h1>
        <div className="admin-header-actions">
          {archivedCount > 0 && (
            <Button variant="chip" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Ẩn lớp đã lưu trữ' : `Hiện lớp đã lưu trữ (${archivedCount})`}
            </Button>
          )}
          <Button onClick={() => setModalOpen(true)}>+ Tạo lớp</Button>
        </div>
      </div>

      <p className="field-hint">
        Luồng học: <strong>Khoá học</strong> (nội dung bài) → <strong>Lớp học</strong> (giáo viên, học viên, lịch mở bài) →
        học viên vào lớp bằng <strong>mã lớp</strong> hoặc được giáo viên thêm / tạo tài khoản.
      </p>

      {loadError && <div className="alert-error">{loadError}</div>}
      {!classes && !loadError && <div className="page-loading">Đang tải…</div>}

      {classes && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Lớp</th>
              <th>Giáo viên</th>
              <th>Học viên</th>
              <th>Thời gian</th>
              <th>Mã lớp</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const st = classStatus(c);
              return (
                <tr key={c.id}>
                  <td>
                    <div className="admin-table-zh">{c.name}</div>
                    <div className="admin-table-vi">{c.courseTitle}</div>
                  </td>
                  <td>{c.teacher ? c.teacher.fullName || c.teacher.username : '—'}</td>
                  <td>{c.studentCount ?? '—'}</td>
                  <td>
                    {c.startDate || c.endDate ? `${formatDate(c.startDate) || '…'} – ${formatDate(c.endDate) || '…'}` : '—'}
                  </td>
                  <td>
                    <code className={'class-code' + (c.joinEnabled ? '' : ' off')} title={c.joinEnabled ? 'Đang nhận học viên bằng mã' : 'Đã tắt nhận bằng mã'}>
                      {c.joinCode}
                    </code>
                  </td>
                  <td>
                    <span className={`class-status ${st.key}`}>{st.label}</span>
                  </td>
                  <td className="admin-table-actions">
                    <Link to={`/admin/classes/${c.id}`} className="btn-chip">
                      Quản lý
                    </Link>
                    <Link to={`/admin/classes/${c.id}?tab=report`} className="btn-chip">
                      Báo cáo
                    </Link>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  Chưa có lớp học nào. Bấm "+ Tạo lớp" để bắt đầu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <ClassFormModal
        open={modalOpen}
        editing={null}
        courses={courses}
        onClose={() => setModalOpen(false)}
        onSaved={(klass) => {
          setModalOpen(false);
          navigate(`/admin/classes/${klass.id}?tab=lessons`);
        }}
      />
    </main>
  );
}
