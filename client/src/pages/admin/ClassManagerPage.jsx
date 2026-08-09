import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import ClassFormModal from '../../components/admin/ClassFormModal';

export default function ClassManagerPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [studentsByClass, setStudentsByClass] = useState({});
  const [identifierByClass, setIdentifierByClass] = useState({});

  function loadClasses() {
    api.get('/admin/classes').then((res) => setClasses(res.data)).catch(() => setLoadError('Không tải được danh sách lớp.'));
  }

  useEffect(() => {
    api.get('/admin/courses').then((res) => setCourses(res.data)).catch(() => {});
    loadClasses();
  }, []);

  function openCreate() {
    setEditingClass(null);
    setModalOpen(true);
  }

  function openEdit(klass) {
    setEditingClass(klass);
    setModalOpen(true);
  }

  async function handleDeleteClass(klass) {
    if (!confirm(`Xoá lớp "${klass.name}"?`)) return;
    await api.delete(`/admin/classes/${klass.id}`);
    toast.success('Đã xoá lớp học.');
    loadClasses();
  }

  async function loadStudents(classId) {
    const res = await api.get(`/admin/classes/${classId}/students`);
    setStudentsByClass((m) => ({ ...m, [classId]: res.data }));
  }

  async function handleAddStudent(classId) {
    const identifier = identifierByClass[classId];
    if (!identifier) return;
    try {
      await api.post(`/admin/classes/${classId}/students`, { identifier });
      setIdentifierByClass((m) => ({ ...m, [classId]: '' }));
      toast.success('Đã thêm học viên vào lớp.');
      loadStudents(classId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm học viên thất bại.');
    }
  }

  async function handleRemoveStudent(classId, enrollmentId) {
    await api.delete(`/admin/classes/${classId}/students/${enrollmentId}`);
    loadStudents(classId);
  }

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Quản lý lớp học</h1>
        <div className="admin-header-actions">
          <Button onClick={openCreate}>+ Tạo lớp</Button>
        </div>
      </div>

      {loadError && <div className="alert-error">{loadError}</div>}

      {classes?.map((klass) => (
        <fieldset key={klass.id}>
          <legend>
            {klass.name} · {klass.courseTitle}
          </legend>
          <div className="admin-table-actions" style={{ marginBottom: 12 }}>
            <Link to={`/admin/classes/${klass.id}/report`} className="btn-chip">
              Xem báo cáo tiến độ
            </Link>
            {!studentsByClass[klass.id] && (
              <Button variant="chip" onClick={() => loadStudents(klass.id)}>
                Hiện danh sách học viên
              </Button>
            )}
            <Button variant="chip" onClick={() => openEdit(klass)}>
              Sửa
            </Button>
            <Button variant="chip-danger" onClick={() => handleDeleteClass(klass)}>
              Xoá lớp
            </Button>
          </div>

          {studentsByClass[klass.id] && (
            <>
              <div className="field-row">
                <input
                  placeholder="tên đăng nhập hoặc email học viên đã đăng ký"
                  value={identifierByClass[klass.id] || ''}
                  onChange={(e) => setIdentifierByClass((m) => ({ ...m, [klass.id]: e.target.value }))}
                />
                <Button variant="secondary" onClick={() => handleAddStudent(klass.id)}>
                  + Thêm vào lớp
                </Button>
              </div>
              <ul className="media-uploader-list">
                {studentsByClass[klass.id].map((e) => (
                  <li key={e.id}>
                    <span className="media-uploader-name">{e.student?.fullName || e.student?.username}</span>
                    <code className="media-uploader-url">
                      @{e.student?.username} · {e.student?.email}
                    </code>
                    <button className="btn-icon-danger" onClick={() => handleRemoveStudent(klass.id, e.id)}>
                      ×
                    </button>
                  </li>
                ))}
                {studentsByClass[klass.id].length === 0 && <div className="field-hint">Lớp chưa có học viên nào.</div>}
              </ul>
            </>
          )}
        </fieldset>
      ))}

      <ClassFormModal
        open={modalOpen}
        editing={editingClass}
        courses={courses}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          loadClasses();
        }}
      />
    </main>
  );
}
