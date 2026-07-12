import { ApiError } from '../utils/apiError.js';

export const requireSuperAdmin = (req, res, next) => {
  // User must be authenticated, have super_admin role, and belong to the Master Database (tenantId is null)
  if (!req.user || req.user.role !== 'super_admin' || req.user.tenantId !== null) {
    throw new ApiError(403, 'Access denied: Super Admin privileges required.');
  }
  next();
};
