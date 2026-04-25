import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@clerk/react";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME: Record<string, string> = { buyer: "/", admin: "/admin/dashboard" };

function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md px-6 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/2 mx-auto" />
        <div className="bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-100 rounded-xl" />
          <div className="h-10 bg-violet-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function SyncErrorScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Connection issue</h2>
        <p className="text-slate-500 text-sm mb-6">Could not reach the server. Please check your connection and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isLoaded, isSignedIn } = useUser();
  const { user, loading, syncFailed } = useAuth();

  // Clerk not ready yet
  if (!isLoaded) return <AuthSkeleton />;

  // Not signed in → go to sign-in
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  // Sync failed (server down / cold start) — show retry screen instead of blank/redirect
  if (syncFailed && !user) return <SyncErrorScreen />;

  // Signed in but DB sync in progress — show skeleton
  if (loading || !user) return <AuthSkeleton />;

  // Wrong role → redirect to their correct home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isLoaded, isSignedIn } = useUser();
  const { user, loading } = useAuth();

  if (!isLoaded || loading) return <AuthSkeleton />;

  // Already signed in with resolved role → redirect to their home
  if (isSignedIn && user) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}
