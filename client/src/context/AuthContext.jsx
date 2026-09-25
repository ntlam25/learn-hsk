import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hanzi_token';
const USER_KEY = 'hanzi_user';

// Thông tin người dùng lần đăng nhập trước: dùng để dựng ngay khung giao diện (sidebar, topbar) khi tải lại
// trang thay vì chờ /auth/me; /auth/me vẫn chạy nền để xác nhận / cập nhật.
function readCachedUser() {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function cacheUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // bỏ qua
  }
}

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(readCachedUser);
  // Có bản nhớ thì không cần màn "đang kiểm tra đăng nhập"
  const [loading, setLoading] = useState(() => !readCachedUser() && !!localStorage.getItem(TOKEN_KEY));

  function setUser(next) {
    setUserState(next);
    cacheUser(next);
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        // Chỉ đăng xuất khi token thật sự hỏng/hết hạn, mất mạng thì giữ phiên
        if (err.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(identifier, password) {
    const res = await api.post('/auth/login', { identifier, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(username, email, password, fullName) {
    const res = await api.post('/auth/register', { username, email, password, fullName });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  async function updateProfile(fullName) {
    const res = await api.put('/auth/me', { fullName });
    setUser(res.data.user);
    return res.data.user;
  }

  async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/auth/me/avatar', formData);
    setUser(res.data.user);
    return res.data.user;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng trong <AuthProvider>');
  return ctx;
}
