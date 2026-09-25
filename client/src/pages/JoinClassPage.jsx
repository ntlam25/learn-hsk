import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { withNext } from '../lib/nextPath';
import { notifyClassesChanged } from '../lib/events';

// Link mời /join/MÃ: chưa đăng nhập thì đi đăng nhập/đăng ký rồi quay lại đây, sau đó tự vào lớp.
export default function JoinClassPage() {
  const { code } = useParams();
  const { user, loading } = useAuth();
  const [state, setState] = useState({ status: 'joining' });
  const started = useRef(false);

  useEffect(() => {
    if (!user || user.role !== 'student' || started.current) return;
    started.current = true;
    api
      .post('/me/classes/join', { code })
      .then((res) => {
        setState({ status: 'done', ...res.data });
        notifyClassesChanged();
      })
      .catch((err) => setState({ status: 'error', message: err.response?.data?.message || 'Không vào được lớp.' }));
  }, [user, code]);

  if (loading) return <div className="page-loading">Đang kiểm tra đăng nhập…</div>;
  if (!user) return <Navigate to={withNext('/login', `/join/${code}`)} replace />;

  return (
    <main className="page lesson-list-page">
      <header className="page-hero">
        <div className="page-hero-seal">入</div>
        <h1>Vào lớp học</h1>
        <p>
          Mã lớp: <strong>{String(code).toUpperCase()}</strong>
        </p>
      </header>

      {user.role !== 'student' ? (
        <div className="empty-state">Chỉ tài khoản học viên mới vào lớp bằng mã. Bạn đang đăng nhập với quyền quản trị/giáo viên.</div>
      ) : state.status === 'joining' ? (
        <div className="page-loading">Đang vào lớp…</div>
      ) : state.status === 'error' ? (
        <div className="empty-state">
          <div className="alert-error">{state.message}</div>
          <Link to="/me/courses">← Về khoá học của tôi</Link>
        </div>
      ) : (
        <div className="empty-state">
          <div className="alert-success">
            {state.alreadyEnrolled ? 'Bạn đã ở trong lớp' : 'Đã vào lớp'} <strong>{state.class.name}</strong> · {state.class.courseTitle}
          </div>
          <div className="join-class-actions">
            <Link to={`/courses/${state.class.courseId}`} className="btn-primary">
              Vào khoá học
            </Link>
            <Link to="/me/courses" className="btn-secondary">
              Khoá học của tôi
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
