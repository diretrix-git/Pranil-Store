import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/react";
import api from "../api/axiosInstance";
import { IUser } from "../types";

interface AuthContextValue {
  user: IUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const [dbUser, setDbUser] = useState<IUser | null>(null);
  const [syncing, setSyncing] = useState(false);

  const syncUser = useCallback(async () => {
    setSyncing(true);
    try {
      // Retry getting token up to 5 times — Clerk session can take a moment
      let token: string | null = null;
      for (let i = 0; i < 5; i++) {
        token = await getToken();
        if (token) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!token) {
        console.warn("Clerk token unavailable after retries");
        setDbUser(null);
        return;
      }

      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      const res = await api.get("/auth/me");
      const u = res.data.data?.user ?? null;
      setDbUser(u);
    } catch (err: any) {
      console.error("Auth sync failed:", err?.response?.data ?? err.message);
      setDbUser(null);
    } finally {
      setSyncing(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      delete api.defaults.headers.common["Authorization"];
      setDbUser(null);
      return;
    }

    syncUser();
  }, [isLoaded, isSignedIn, clerkUser?.id, syncUser]);

  return (
    <AuthContext.Provider value={{ user: dbUser, loading: !isLoaded || syncing }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
