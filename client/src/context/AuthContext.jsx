import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axiosInstance';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => {
        const u = res.data.data?.user ?? res.data.user ?? null;
        setUser(u);
      })
      .catch(() => {
        // Any error (401, network, etc.) — just not logged in
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
