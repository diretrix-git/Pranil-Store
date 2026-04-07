import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME: Record<string, string> = { buyer: "/", admin: "/admin/dashboard" };

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user) return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  return <Outlet />;
}
