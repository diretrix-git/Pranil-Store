import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = {
  buyer: '/',
  seller: '/seller/dashboard',
  superadmin: '/admin/dashboard',
};

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  // Wait for auth check to complete before making any redirect decision
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARDS[user.role] ?? '/'} replace />;
  }

  return <Outlet />;
}
