import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/UserMenu';

const ROLE_LABEL = { admin: 'Quản trị viên', teacher: 'Giáo viên', student: 'Học viên' };

export default function AccountPage() {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const fileRef = useRef(null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  async function handleSaveProfile(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setSavingProfile(true);
    try {
      await updateProfile(fullName);
      setMessage('Đã cập nhật thông tin tài khoản.');
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setMessage('');
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      setMessage('Đã cập nhật ảnh đại diện.');
    } catch (err) {
      setError(err.response?.data?.message || 'Tải ảnh đại diện thất bại.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <main className="page account-page">
      <h1>Tài khoản của tôi</h1>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      <div className="account-card">
        <div className="account-avatar-row">
          <Avatar user={user} size={84} />
          <div>
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}>
              {uploadingAvatar ? 'Đang tải lên…' : 'Đổi ảnh đại diện'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            <p className="field-hint">Ảnh PNG/JPEG/WebP, tối đa 15MB.</p>
          </div>
        </div>

        <div className="account-info-grid">
          <div>
            <span className="field-hint">Tên đăng nhập</span>
            <div className="admin-table-zh">{user.username}</div>
          </div>
          <div>
            <span className="field-hint">Email</span>
            <div className="admin-table-zh">{user.email}</div>
          </div>
          <div>
            <span className="field-hint">Vai trò</span>
            <div className="admin-table-zh">{ROLE_LABEL[user.role] || user.role}</div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="lesson-form">
          <label>
            Họ tên hiển thị
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? 'Đang lưu…' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </main>
  );
}
