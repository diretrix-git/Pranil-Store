import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/react";
import api from "../api/axiosInstance";
import { IUser } from "../types";

interface AuthContextValue {
  user: IUser | null;
  loading: boolean;
  syncFailed: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const [dbUser, setDbUser] = useState<IUser | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  const syncUser = useCallback(async () => {
    setSyncing(true);
    setSyncFailed(false);
    try {
      // Wait for a valid token — Clerk session can take a moment after isLoaded
      let token: string | null = null;
      for (let i = 0; i < 8; i++) {
        token = await getToken();
        if (token) break;
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!token) {
        setDbUser(null);
        setSyncFailed(true);
        return;
      }

      // Explicitly set header for this call (interceptor may not have token yet)
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDbUser(res.data.data?.user ?? null);
      setSyncFailed(false);
    } catch (err: any) {
      console.error("Auth sync failed:", err?.response?.status, err?.response?.data?.message ?? err.message);
      setDbUser(null);
      setSyncFailed(true);
    } finally {
      setSyncing(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setDbUser(null);
      setSyncFailed(false);
      return;
    }
    syncUser();
  }, [isLoaded, isSignedIn, clerkUser?.id, syncUser]);

  return (
    <AuthContext.Provider value={{ user: dbUser, loading: !isLoaded || syncing, syncFailed }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
