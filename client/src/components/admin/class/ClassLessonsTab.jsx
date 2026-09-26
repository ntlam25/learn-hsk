import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';
import Checkbox from '../../ui/Checkbox';

// ISO ↔ giá trị ô <input type="datetime-local"> (giờ máy người dùng)
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);

export default function ClassLessonsTab({ klass }) {
  const toast = useToast();
  const [lessons, setLessons] = useState(null);
  const [busy, setBusy] = useState(false);
  const [upTo, setUpTo] = useState('');

  useEffect(() => {
    api
      .get(`/admin/classes/${klass.id}/lessons`)
      .then((res) => setLessons(res.data))
      .catch(() => toast.error('Không tải được danh sách bài.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id]);

  async function save(items, message) {
    setBusy(true);
    try {
      const res = await api.put(`/admin/classes/${klass.id}/lessons`, { items });
      setLessons(res.data);
      if (message) toast.success(message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setBusy(false);
    }
  }

  const item = (l, patch) => ({ lessonId: l.id, released: l.released, releaseAt: l.releaseAt, ...patch });

  function openUpTo() {
    const n = Number(upTo);
    if (!n) return;
    const items = lessons.filter((l) => l.lessonNumber <= n && !l.released).map((l) => item(l, { released: true }));
    if (!items.length) return toast.success(`Các bài đến bài ${n} đều đã mở.`);
    save(items, `Đã mở các bài đến bài ${n}.`);
  }

  if (!lessons) return <div className="page-loading">Đang tải…</div>;

  const openCount = lessons.filter((l) => l.open).length;

  return (
    <>
      <fieldset>
        <legend>Mở bài cho lớp</legend>
        <p className="field-hint">
          Học viên chỉ xem được bài đã mở. Bật "Mở ngay", hoặc hẹn ngày giờ để bài tự mở. Bài mới thêm vào khoá sẽ ở trạng thái khoá
          cho tới khi bạn mở. Đang mở {openCount}/{lessons.length} bài.
        </p>
        <div className="field-row class-open-upto">
          <label>
            Mở tất cả các bài đến bài số
            <input type="number" min={1} value={upTo} onChange={(e) => setUpTo(e.target.value)} placeholder="VD: 5" />
          </label>
          <Button variant="secondary" disabled={busy || !upTo} onClick={openUpTo}>
            Mở đến bài {upTo || 'N'}
          </Button>
          <Button
            variant="chip"
            disabled={busy}
            onClick={() => save(lessons.filter((l) => !l.released).map((l) => item(l, { released: true })), 'Đã mở tất cả bài.')}
          >
            Mở tất cả
          </Button>
        </div>
      </fieldset>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Bài</th>
            <th>Mở ngay</th>
            <th>Hẹn ngày mở</th>
            <th>Trạng thái với học viên</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((l) => (
            <tr key={l.id}>
              <td>
                <div className="admin-table-zh">
                  Bài {l.lessonNumber} · {l.titleZh}
                </div>
                <div className="admin-table-vi">
                  {l.titleVi}
                  {!l.published && ' · (bài chưa publish — học viên chưa thấy dù đã mở)'}
                </div>
              </td>
              <td>
                <Checkbox checked={l.released} disabled={busy} onChange={(e) => save([item(l, { released: e.target.checked })])} />
              </td>
              <td>
                {/* Lưu khi rời ô (chọn ngày giờ xong) thay vì mỗi lần đổi từng phần ngày/giờ */}
                <input
                  key={l.releaseAt || 'none'}
                  type="datetime-local"
                  className="class-release-input"
                  disabled={busy || l.released}
                  defaultValue={toLocalInput(l.releaseAt)}
                  onBlur={(e) => {
                    const next = fromLocalInput(e.target.value);
                    if (next !== (l.releaseAt ? new Date(l.releaseAt).toISOString() : null)) save([item(l, { releaseAt: next })]);
                  }}
                  title={l.released ? 'Bài đã mở ngay, không cần hẹn ngày' : 'Bài tự mở vào thời điểm này'}
                />
              </td>
              <td>
                <span className={'class-status ' + (l.open && l.published ? 'active' : 'archived')}>
                  {!l.published ? 'Ẩn (chưa publish)' : l.open ? 'Đang mở' : l.releaseAt ? 'Chờ tới ngày mở' : 'Khoá'}
                </span>{' '}
                <Link to={`/lessons/${l.id}?course=${klass.courseId}`} className="btn-chip">
                  Xem
                </Link>
              </td>
            </tr>
          ))}
          {lessons.length === 0 && (
            <tr>
              <td colSpan={4} className="empty-state">
                Khoá học chưa có bài nào.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
