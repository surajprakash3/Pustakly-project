import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const roleDestination = (role) => (role === 'admin' ? '/admin/dashboard' : '/user/dashboard');

export function AppSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold shadow-sm">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/10 border-t-black" />
        {label}
      </div>
    </div>
  );
}

export function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppSpinner label="Checking session" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export function PublicOnly({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppSpinner label="Preparing login" />;
  }

  if (user) {
    return <Navigate to={roleDestination(user.role)} replace />;
  }

  return children;
}

export function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppSpinner label="Redirecting" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={roleDestination(user.role)} replace />;
}

export function LogoutRoute() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  return <AppSpinner label="Signing out" />;
}
