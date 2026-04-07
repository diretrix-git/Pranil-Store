import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/react";
import api from "../api/axiosInstance";
import { IUser } from "../types";

interface AuthContextValue {
  user: IUser | null;
  loading: boolean;
  clerkLoaded: boolean;
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
      setDbUser(null);
      return;
    }

    // Sync Clerk user into MongoDB and get role
    const sync = async () => {
      setSyncing(true);
      try {
        const token = await getToken();
        const res = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const u = res.data.data?.user ?? null;
        setDbUser(u);
      } catch {
        setDbUser(null);
      } finally {
        setSyncing(false);
      }
    };

    sync();
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  return (
    <AuthContext.Provider
      value={{
        user: dbUser,
        loading: !isLoaded || syncing,
        clerkLoaded: isLoaded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
