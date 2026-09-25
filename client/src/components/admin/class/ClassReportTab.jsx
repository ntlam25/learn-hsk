import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { formatDate } from '../../../lib/format';
import Button from '../../ui/Button';

const STATUS_LABEL = { completed: 'Hoàn thành', in_progress: 'Đang học', not_started: 'Chưa học' };

function cellText(cell, lesson) {
  if (cell.status === 'completed') return '✓';
  if (cell.status === 'in_progress') return lesson.vocabTotal ? `${Math.round((cell.knownCount / lesson.vocabTotal) * 100)}%` : '…';
  return '–';
}

function cellTitle(cell, lesson) {
  const parts = [`Bài ${lesson.lessonNumber}: ${STATUS_LABEL[cell.status] || cell.status}`];
  if (lesson.vocabTotal) parts.push(`Từ đã thuộc: ${cell.knownCount}/${lesson.vocabTotal}`);
  if (lesson.quizTotal) parts.push(`Quiz đúng: ${cell.quizCorrect}/${lesson.quizTotal} (đã làm ${cell.quizAttempted})`);
  if (cell.lastViewedAt) parts.push(`Xem gần nhất: ${formatDate(cell.lastViewedAt, { withTime: true })}`);
  return parts.join('\n');
}

function downloadCsv(report) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Học viên', 'Tên đăng nhập', 'Email', 'Bài hoàn thành', 'Điểm quiz', 'Câu đúng', 'Flashcard đã thuộc', 'Hoạt động gần nhất'];
  report.lessons.forEach((l) => head.push(`Bài ${l.lessonNumber}`));
  const rows = report.students.map((s) => [
    s.student?.fullName || '',
    s.student?.username || '',
    s.student?.email || '',
    `${s.lessonsCompleted}/${s.lessonsOpen}`,
    s.quizPoints,
    `${s.quizCorrect}/${s.quizTotal}`,
    `${s.flashcardKnown}/${s.flashcardTotal}`,
    formatDate(s.lastActiveAt, { withTime: true }),
    ...report.lessons.map((l) => {
      const c = s.cells[l.id];
      return c.status === 'completed' ? 'Hoàn thành' : c.status === 'in_progress' ? `Đang học (${c.knownCount}/${l.vocabTotal} từ)` : '';
    }),
  ]);
  const csv = '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n'); // BOM để Excel đọc đúng tiếng Việt
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `bao-cao-${report.class.name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ClassReportTab({ klass }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/admin/classes/${klass.id}/report`)
      .then((res) => setReport(res.data))
      .catch(() => setError('Không tải được báo cáo lớp.'));
  }, [klass.id]);

  if (error) return <div className="alert-error">{error}</div>;
  if (!report) return <div className="page-loading">Đang tải…</div>;

  return (
    <>
      <div className="admin-header">
        <p className="field-hint">
          ✓ hoàn thành · % = tỉ lệ từ đã thuộc của bài đang học · – chưa học. Rê chuột vào ô để xem chi tiết. Cột mờ là bài chưa mở.
        </p>
        <Button variant="secondary" disabled={!report.students.length} onClick={() => downloadCsv(report)}>
          Xuất CSV
        </Button>
      </div>

      <div className="report-scroll">
        <table className="admin-table report-table">
          <thead>
            <tr>
              <th className="report-sticky">Học viên</th>
              <th>Hoàn thành</th>
              <th>Điểm quiz</th>
              <th>Câu đúng</th>
              <th>Flashcard</th>
              <th>Hoạt động</th>
              {report.lessons.map((l) => (
                <th key={l.id} className={'report-lesson' + (l.open ? '' : ' locked')} title={`${l.titleZh} · ${l.titleVi}${l.open ? '' : ' (chưa mở)'}`}>
                  B{l.lessonNumber}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.students.map((s) => (
              <tr key={s.enrollmentId}>
                <td className="report-sticky">
                  <div className="admin-table-zh">{s.student?.fullName || s.student?.username}</div>
                  <div className="admin-table-vi">@{s.student?.username}</div>
                </td>
                <td>
                  {s.lessonsCompleted}/{s.lessonsOpen}
                </td>
                <td>{s.quizPoints}</td>
                <td>
                  {s.quizCorrect}/{s.quizTotal}
                </td>
                <td>
                  {s.flashcardKnown}/{s.flashcardTotal}
                </td>
                <td>{s.lastActiveAt ? formatDate(s.lastActiveAt) : '—'}</td>
                {report.lessons.map((l) => {
                  const c = s.cells[l.id];
                  return (
                    <td key={l.id} className={`report-cell ${c.status}` + (l.open ? '' : ' locked')} title={cellTitle(c, l)}>
                      {cellText(c, l)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {report.students.length === 0 && (
              <tr>
                <td colSpan={6 + report.lessons.length} className="empty-state">
                  Lớp chưa có học viên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
