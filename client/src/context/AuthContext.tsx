import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Clear auth header and user state on sign-out
      delete api.defaults.headers.common["Authorization"];
      setDbUser(null);
      return;
    }

    const sync = async () => {
      setSyncing(true);
      try {
        // Get Clerk session token and attach to all future axios requests
        const token = await getToken();
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const res = await api.get("/auth/me");
        const u = res.data.data?.user ?? null;
        setDbUser(u);
      } catch (err) {
        console.error("Auth sync failed:", err);
        setDbUser(null);
      } finally {
        setSyncing(false);
      }
    };

    sync();
  }, [isLoaded, isSignedIn, clerkUser?.id]);

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
