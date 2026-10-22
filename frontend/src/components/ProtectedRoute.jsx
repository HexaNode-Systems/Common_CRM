import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';
import Loader from './Loader.jsx';

export default function ProtectedRoute({ children, permission, platform = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader fill delay={300} />;
  if (!user) return <Navigate to="/login" replace />;

  // SaaS platform pages: only the platform owner, never a company's own Super Admin.
  if (platform && (user.role !== 'super_admin' || user.tenantId)) {
    return <Navigate to="/forbidden" replace />;
  }

  if (permission) {
    const alternatives = permission.split('|');
    const hasAny = alternatives.some((p) => {
      const [moduleName, action] = p.split(':');
      return hasPermission(user, moduleName, action || 'read');
    });
    if (!hasAny) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return children;
}

