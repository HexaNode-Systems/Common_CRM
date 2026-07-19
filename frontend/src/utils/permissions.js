/**
 * Check if the current user has access to a specific module and action.
 * 
 * @param {object} user - The user object from the AuthContext.
 * @param {string} moduleName - The name of the module.
 * @param {string} action - The action: 'read', 'create', 'update', or 'delete'.
 * @returns {boolean} - True if access is allowed, false otherwise.
 */
export function hasPermission(user, moduleName, action = 'read') {
  if (!user) return false;
  if (user.role === 'super_admin') return true;

  // Manual fallback checks / special mappings
  if (moduleName === 'dashboard') {
    return (
      user.permissions?.includes('reports:read') ||
      user.permissions?.includes('dashboard:read')
    );
  }

  if (moduleName === 'settings') {
    return (
      user.permissions?.includes('settings:read') ||
      user.permissions?.includes('settings:update')
    );
  }

  return user.permissions?.includes(`${moduleName}:${action}`);
}
