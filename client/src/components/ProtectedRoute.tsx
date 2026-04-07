import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "@clerk/react";
import { useAuth } from "../context/AuthContext";

const ROLE_HOME: Record<string, string> = { buyer: "/", admin: "/admin/dashboard" };

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

// Protects routes that require login + optional role check
export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isLoaded, isSignedIn } = useUser();
  const { user, loading } = useAuth();

  // Wait for Clerk to load
  if (!isLoaded || loading) return <AuthSkeleton />;

  // Not signed in at all → send to Clerk sign-in
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;

  // Signed in but DB sync still in progress → wait
  if (!user) return <AuthSkeleton />;

  // Wrong role → redirect to their home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}

// Blocks /sign-in and /sign-up when already signed in
export function GuestRoute() {
  const { isLoaded, isSignedIn } = useUser();
  const { user, loading } = useAuth();

  if (!isLoaded) return <AuthSkeleton />;

  // Already signed in and DB user resolved → redirect to their home
  if (isSignedIn && !loading && user) {
    return <Navigate to={ROLE_HOME[user.role] ?? "/"} replace />;
  }

  return <Outlet />;
}
