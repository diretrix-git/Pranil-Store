import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME: Record<string, string> = { buyer: "/", admin: "/admin/dashboard" };

// Skeleton loader shown while Clerk + DB sync is in progress
function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-full max-w-md px-6 space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-xl w-1/2 mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-3/4 mx-auto" />
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

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthSkeleton />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AuthSkeleton />;
  if (user) return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  return <Outlet />;
}
