import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission } from '../utils/permissions.js';

/**
 * A wrapper component that conditionally displays its children based on permissions.
 * 
 * @param {string} module - The module name.
 * @param {string} action - The action level ('read', 'create', 'update', 'delete').
 * @param {React.ReactNode} fallback - Custom fallback to render when access is denied.
 * @param {React.ReactNode} children - Children to display if permission is granted.
 */
export function PermissionGuard({ module, action = 'read', fallback = null, children }) {
  const { user } = useAuth();
  if (hasPermission(user, module, action)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
