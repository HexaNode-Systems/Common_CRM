import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (permission) {
    const [moduleName, action] = permission.split(':');
    if (!hasPermission(user, moduleName, action || 'read')) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children;
}

