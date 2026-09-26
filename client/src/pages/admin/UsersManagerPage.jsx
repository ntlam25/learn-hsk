import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import BulkBar, { SelectAllCell, SelectCell } from '../../components/ui/BulkBar';
import useRowSelection from '../../hooks/useRowSelection';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'teacher', label: 'Giáo viên' },
  { value: 'student', label: 'Học viên' },
];

const ROLE_FILTER_OPTIONS = [{ value: '', label: 'Tất cả vai trò' }, ...ROLE_OPTIONS];

const ROLE_LABEL = Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.label]));

export default function UsersManagerPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const selection = useRowSelection((users || []).filter((u) => u.id !== currentUser?.id).map((u) => u.id));

  function load() {
    api
      .get('/admin/users/all', { params: { search: search || undefined, role: roleFilter || undefined } })
      .then((res) => setUsers(res.data))
      .catch(() => setError('Không tải được danh sách người dùng.'));
  }

  useEffect(load, [roleFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load();
  }

  async function handleRoleChange(u, role) {
    if (role === u.role) return;
    try {
      await api.put(`/admin/users/${u.id}/role`, { role });
      toast.success('Đã cập nhật quyền.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  }

  async function handleDelete(u) {
    if (!confirm(`Xoá tài khoản "${u.username}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success('Đã xoá người dùng.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Xoá ${selection.count} tài khoản đã chọn?
Toàn bộ tiến độ học, bài nộp của các tài khoản này cũng bị xoá. Hành động này không thể hoàn tác.`)) return;
    setBulkBusy(true);
    try {
      const res = await api.post('/admin/users/bulk-delete', { ids: selection.selected });
      toast.success(res.data.message);
      selection.clear();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xoá thất bại.');
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-header">
        <h1>Quản lý người dùng</h1>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} className="admin-filter-field">
          <span>Tìm kiếm</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              placeholder="Tên đăng nhập, email, họ tên…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              Tìm
            </Button>
          </div>
        </form>
        <div className="admin-filter-field">
          <span>Lọc theo vai trò</span>
          <Select value={roleFilter} onChange={setRoleFilter} options={ROLE_FILTER_OPTIONS} />
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {!users && !error && <div className="page-loading">Đang tải…</div>}

      {users && (
        <table className="admin-table">
          <thead>
            <tr>
              <SelectAllCell selection={selection} disabled={users.length === 0} />
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th>Họ tên</th>
              <th>Vai trò</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} className={selection.isSelected(u.id) ? 'row-selected' : ''}>
                  <SelectCell selection={selection} id={u.id} disabled={isSelf} title={isSelf ? 'Không thể xoá tài khoản của chính bạn' : undefined} />
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.fullName || '—'}</td>
                  <td>
                    {isSelf ? (
                      <span className="status-pill published">
                        <span className="status-pill-dot" />
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    ) : (
                      <Select
                        value={u.role}
                        onChange={(role) => handleRoleChange(u, role)}
                        options={ROLE_OPTIONS}
                      />
                    )}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="admin-table-actions">
                    {!isSelf && (
                      <Button variant="chip-danger" onClick={() => handleDelete(u)}>
                        Xoá
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  Không tìm thấy người dùng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <BulkBar selection={selection} noun="tài khoản">
        <Button variant="chip-danger" onClick={handleBulkDelete} disabled={bulkBusy}>
          {bulkBusy ? 'Đang xoá…' : `Xoá ${selection.count} tài khoản`}
        </Button>
      </BulkBar>
    </main>
  );
}
