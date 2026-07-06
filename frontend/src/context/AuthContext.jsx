import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiGet('/api/auth/me')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('momo_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await apiPost('/api/auth/login', { email, password });
    localStorage.setItem('momo_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    const data = await apiPost('/api/auth/register', { name, email, password });
    localStorage.setItem('momo_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('momo_token');
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAuthenticated: !!user }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
