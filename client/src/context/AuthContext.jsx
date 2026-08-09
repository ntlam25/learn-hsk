import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hanzi_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
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
