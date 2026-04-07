import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import api from "../api/axiosInstance";
import { IUser } from "../types";

interface AuthContextValue {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => {
        const u = res.data.data?.user ?? res.data.user ?? null;
        setUser(u);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async (): Promise<void> => {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
