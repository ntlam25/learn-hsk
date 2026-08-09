import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client';

export default function ClassReportPage() {
  const { classId } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/admin/classes/${classId}/report`)
      .then((res) => setReport(res.data))
      .catch(() => setError('Không tải được báo cáo lớp.'));
  }, [classId]);

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Báo cáo tiến độ {report ? `· ${report.class.name}` : ''}</h1>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {!report && !error && <div className="page-loading">Đang tải…</div>}

      {report && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Học viên</th>
              <th>Bài đã hoàn thành</th>
              <th>Điểm quiz</th>
              <th>Câu đúng</th>
              <th>Flashcard đã thuộc</th>
            </tr>
          </thead>
          <tbody>
            {report.students.map((s) => (
              <tr key={s.student?.id}>
                <td>
                  <div className="admin-table-zh">{s.student?.fullName || s.student?.username}</div>
                  <div className="admin-table-vi">
                    @{s.student?.username} · {s.student?.email}
                  </div>
                </td>
                <td>
                  {s.lessonsCompleted}/{s.lessonsTotal}
                </td>
                <td>{s.quizPoints}</td>
                <td>
                  {s.quizCorrectCount}/{s.quizSubmittedCount}
                </td>
                <td>
                  {s.flashcardKnown}/{s.flashcardTotal}
                </td>
              </tr>
            ))}
            {report.students.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Lớp chưa có học viên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
