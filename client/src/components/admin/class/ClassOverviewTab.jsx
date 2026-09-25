import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../lib/format';
import { classStatus } from '../../../lib/classStatus';
import Button from '../../ui/Button';
import Checkbox from '../../ui/Checkbox';
import CopyButton from './CopyButton';

export default function ClassOverviewTab({ klass, onChanged, onEdit }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const joinLink = `${window.location.origin}/join/${klass.joinCode}`;
  const st = classStatus(klass);

  async function run(fn, success) {
    setBusy(true);
    try {
      const res = await fn();
      if (success) toast.success(success);
      if (res?.data?.id) onChanged(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  }

  function regenerate() {
    if (!confirm('Đổi mã lớp? Mã và link mời cũ sẽ không dùng được nữa.')) return;
    run(() => api.post(`/admin/classes/${klass.id}/join-code`), 'Đã đổi mã lớp.');
  }

  async function removeClass() {
    if (!confirm(`Xoá hẳn lớp "${klass.name}"? Danh sách học viên và lịch mở bài của lớp sẽ mất (tiến độ học của học viên vẫn giữ).`)) return;
    try {
      await api.delete(`/admin/classes/${klass.id}`);
      toast.success('Đã xoá lớp học.');
      navigate('/admin/classes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá lớp thất bại.');
    }
  }

  return (
    <>
      <fieldset>
        <legend>Thông tin lớp</legend>
        <dl className="class-info">
          <dt>Khoá học</dt>
          <dd>{klass.courseTitle}</dd>
          <dt>Giáo viên</dt>
          <dd>{klass.teacher ? `${klass.teacher.fullName || klass.teacher.username} · @${klass.teacher.username}` : '—'}</dd>
          <dt>Thời gian</dt>
          <dd>{klass.startDate || klass.endDate ? `${formatDate(klass.startDate) || '…'} – ${formatDate(klass.endDate) || '…'}` : 'Chưa đặt'}</dd>
          <dt>Học viên</dt>
          <dd>{klass.studentCount ?? 0}</dd>
          <dt>Trạng thái</dt>
          <dd>
            <span className={`class-status ${st.key}`}>{st.label}</span>
          </dd>
        </dl>
        <div className="admin-table-actions">
          <Button variant="secondary" onClick={onEdit}>
            Sửa thông tin
          </Button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Mời học viên bằng mã lớp</legend>
        <div className="class-join-box">
          <code className={'class-code big' + (klass.joinEnabled ? '' : ' off')}>{klass.joinCode}</code>
          <div className="class-join-detail">
            <div className="class-join-link">
              <code>{joinLink}</code>
              <CopyButton value={joinLink}>Sao chép link</CopyButton>
              <CopyButton value={klass.joinCode}>Sao chép mã</CopyButton>
            </div>
            <div className="field-hint">
              Gửi mã hoặc link cho học viên. Học viên đăng nhập (hoặc đăng ký) rồi nhập mã ở trang "Khoá học của tôi" là vào lớp.
            </div>
            <div className="admin-table-actions">
              <Checkbox
                checked={klass.joinEnabled}
                disabled={busy}
                onChange={(e) => run(() => api.put(`/admin/classes/${klass.id}`, { joinEnabled: e.target.checked }), 'Đã cập nhật.')}
                label="Cho phép vào lớp bằng mã"
              />
              <Button variant="chip" disabled={busy} onClick={regenerate}>
                Đổi mã mới
              </Button>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Kết thúc / lưu trữ</legend>
        <p className="field-hint">
          Lưu trữ khi lớp học xong: học viên vẫn xem lại bài nhưng không nộp bài, không vào lớp bằng mã; lớp ẩn khỏi danh sách.
        </p>
        <div className="admin-table-actions">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run(
                () => api.put(`/admin/classes/${klass.id}`, { archived: !klass.archived }),
                klass.archived ? 'Đã mở lại lớp.' : 'Đã lưu trữ lớp.'
              )
            }
          >
            {klass.archived ? 'Mở lại lớp' : 'Lưu trữ lớp'}
          </Button>
          <Button variant="chip-danger" disabled={busy} onClick={removeClass}>
            Xoá lớp
          </Button>
        </div>
      </fieldset>
    </>
  );
}
