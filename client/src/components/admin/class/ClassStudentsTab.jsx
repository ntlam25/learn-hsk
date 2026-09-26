import { useCallback, useEffect, useState } from 'react';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../lib/format';
import Button from '../../ui/Button';
import BulkBar, { SelectAllCell, SelectCell } from '../../ui/BulkBar';
import useRowSelection from '../../../hooks/useRowSelection';
import CopyButton from './CopyButton';

const BULK_STATUS = {
  added: { label: 'Đã thêm', ok: true },
  exists: { label: 'Đã có trong lớp', ok: true },
  not_found: { label: 'Không tìm thấy tài khoản' },
  not_student: { label: 'Không phải tài khoản học viên' },
};

// "username, Họ tên, email" — mỗi dòng 1 học viên, phân cách bằng dấu phẩy / tab / dấu |
function parseAccounts(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [username = '', fullName = '', email = ''] = line.split(/\s*[,\t|]\s*/);
      return { username, fullName, email };
    });
}

function BulkAdd({ classId, onDone }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function submit() {
    const identifiers = text.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
    if (!identifiers.length) return;
    setBusy(true);
    try {
      const res = await api.post(`/admin/classes/${classId}/students/bulk`, { identifiers });
      setResults(res.data.results);
      const failed = res.data.results.filter((r) => !BULK_STATUS[r.status]?.ok);
      setText(failed.map((r) => r.identifier).join('\n')); // giữ lại các dòng lỗi để sửa
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm hàng loạt thất bại.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="class-tool">
      <p className="field-hint">Dán danh sách tên đăng nhập hoặc email của học viên đã có tài khoản, mỗi dòng một người.</p>
      <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={'an.nguyen\nbinh@gmail.com\n…'} />
      <div className="admin-table-actions">
        <Button variant="secondary" disabled={busy || !text.trim()} onClick={submit}>
          {busy ? 'Đang thêm…' : '+ Thêm vào lớp'}
        </Button>
      </div>
      {results && (
        <ul className="class-results">
          {results.map((r) => (
            <li key={r.identifier} className={BULK_STATUS[r.status]?.ok ? 'ok' : 'fail'}>
              <code>{r.identifier}</code> — {BULK_STATUS[r.status]?.label || r.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateAccounts({ classId, onDone }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const accounts = parseAccounts(text);

  async function submit() {
    if (!accounts.length) return;
    setBusy(true);
    try {
      const res = await api.post(`/admin/classes/${classId}/students/accounts`, { accounts });
      setResults(res.data.results);
      const failed = res.data.results.filter((r) => r.status !== 'created');
      setText(failed.map((r) => [r.username, r.fullName, r.email].filter(Boolean).join(', ')).join('\n'));
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tạo tài khoản thất bại.');
    } finally {
      setBusy(false);
    }
  }

  const created = (results || []).filter((r) => r.status === 'created');
  const sheet = created.map((r) => `${r.fullName || r.username}\tTên đăng nhập: ${r.username}\tMật khẩu: ${r.password}`).join('\n');

  return (
    <div className="class-tool">
      <p className="field-hint">
        Mỗi dòng một học viên: <code>tên đăng nhập, Họ tên, email</code> (email không bắt buộc). Hệ thống tạo mật khẩu tạm và thêm
        luôn vào lớp.
      </p>
      <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={'an.nguyen, Nguyễn Văn An\nbinh.tran, Trần Bình, binh@gmail.com'} />
      <div className="admin-table-actions">
        <Button variant="secondary" disabled={busy || !accounts.length} onClick={submit}>
          {busy ? 'Đang tạo…' : `Tạo ${accounts.length || ''} tài khoản`}
        </Button>
      </div>
      {results && (
        <>
          {created.length > 0 && (
            <div className="alert-success class-password-note">
              Mật khẩu tạm chỉ hiện <strong>một lần</strong> — hãy sao chép / in gửi học viên ngay.{' '}
              <CopyButton value={sheet}>Sao chép tất cả</CopyButton>
            </div>
          )}
          <table className="admin-table class-results-table">
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Họ tên</th>
                <th>Kết quả</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i}>
                  <td>
                    <code>{r.username || '—'}</code>
                  </td>
                  <td>{r.fullName}</td>
                  <td>
                    {r.status === 'created' ? (
                      <span className="class-password">
                        Mật khẩu: <code>{r.password}</code>
                      </span>
                    ) : (
                      <span className="field-error">{r.message}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default function ClassStudentsTab({ klass, onCountChange }) {
  const toast = useToast();
  const [students, setStudents] = useState(null);
  const [identifier, setIdentifier] = useState('');
  const [tool, setTool] = useState(null); // 'bulk' | 'accounts'
  const [bulkBusy, setBulkBusy] = useState(false);
  const selection = useRowSelection((students || []).map((e) => e.id));

  const load = useCallback(() => {
    api
      .get(`/admin/classes/${klass.id}/students`)
      .then((res) => {
        setStudents(res.data);
        onCountChange?.(res.data.length);
      })
      .catch(() => toast.error('Không tải được danh sách học viên.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [klass.id]);

  useEffect(load, [load]);

  async function addOne(e) {
    e.preventDefault();
    if (!identifier.trim()) return;
    try {
      await api.post(`/admin/classes/${klass.id}/students`, { identifier });
      setIdentifier('');
      toast.success('Đã thêm học viên vào lớp.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thêm học viên thất bại.');
    }
  }

  async function remove(enrollment) {
    const name = enrollment.student?.fullName || enrollment.student?.username;
    if (!confirm(`Xoá ${name} khỏi lớp? Tiến độ học vẫn được giữ nếu thêm lại sau.`)) return;
    await api.delete(`/admin/classes/${klass.id}/students/${enrollment.id}`);
    load();
  }

  async function removeSelected() {
    if (!confirm(`Xoá ${selection.count} học viên đã chọn khỏi lớp?
Tài khoản và tiến độ học vẫn được giữ nếu thêm lại sau.`)) return;
    setBulkBusy(true);
    try {
      const res = await api.post(`/admin/classes/${klass.id}/students/bulk-remove`, { enrollmentIds: selection.selected });
      toast.success(res.data.message);
      selection.clear();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá học viên thất bại.');
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <>
      <fieldset>
        <legend>Thêm học viên</legend>
        <form className="field-row" onSubmit={addOne}>
          <input placeholder="tên đăng nhập hoặc email học viên đã có tài khoản" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          <Button type="submit" variant="secondary" disabled={!identifier.trim()}>
            + Thêm vào lớp
          </Button>
        </form>
        <div className="admin-table-actions class-tool-switch">
          <Button variant={tool === 'bulk' ? 'secondary' : 'chip'} onClick={() => setTool(tool === 'bulk' ? null : 'bulk')}>
            Thêm hàng loạt
          </Button>
          <Button variant={tool === 'accounts' ? 'secondary' : 'chip'} onClick={() => setTool(tool === 'accounts' ? null : 'accounts')}>
            Tạo tài khoản cho học viên
          </Button>
        </div>
        {tool === 'bulk' && <BulkAdd classId={klass.id} onDone={load} />}
        {tool === 'accounts' && <CreateAccounts classId={klass.id} onDone={load} />}
        <p className="field-hint">Học viên cũng có thể tự vào lớp bằng mã {klass.joinCode} (tab Tổng quan).</p>
      </fieldset>

      {!students ? (
        <div className="page-loading">Đang tải…</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <SelectAllCell selection={selection} disabled={!students.length} />
              <th>Học viên</th>
              <th>Email</th>
              <th>Vào lớp</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {students.map((e) => (
              <tr key={e.id} className={selection.isSelected(e.id) ? 'row-selected' : ''}>
                <SelectCell selection={selection} id={e.id} />
                <td>
                  <div className="admin-table-zh">{e.student?.fullName || e.student?.username}</div>
                  <div className="admin-table-vi">@{e.student?.username}</div>
                </td>
                <td>{e.student?.email || '—'}</td>
                <td>
                  {formatDate(e.createdAt)}
                  {!e.enrolledBy ? <div className="admin-table-vi">tự vào bằng mã</div> : null}
                </td>
                <td className="admin-table-actions">
                  <Button variant="chip-danger" onClick={() => remove(e)}>
                    Xoá khỏi lớp
                  </Button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Lớp chưa có học viên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <BulkBar selection={selection} noun="học viên">
        <Button variant="chip-danger" onClick={removeSelected} disabled={bulkBusy}>
          {bulkBusy ? 'Đang xoá…' : `Xoá ${selection.count} học viên khỏi lớp`}
        </Button>
      </BulkBar>
    </>
  );
}
