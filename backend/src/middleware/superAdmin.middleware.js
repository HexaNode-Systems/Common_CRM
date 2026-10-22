import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { MasterUser } from '../models/master/MasterUser.js';

// Platform (SaaS owner) pages. A company's own "Super Admin" must never pass this check.
export const requireSuperAdmin = asyncHandler(async (req, res, next) => {
  const denied = () => new ApiError(403, 'Access denied: Super Admin privileges required.');

  if (!req.user || req.user.role !== 'super_admin' || req.user.tenantId !== null) throw denied();
  // Support sessions ("Login as company") are company sessions, never platform ones.
  if (req.user.impersonatorId) throw denied();
  // The request must run against the platform database, not a company database.
  if (tenantStorage.getStore()?.dbName) throw denied();

  // And the platform registry must agree this is a platform account.
  const master = await MasterUser.findOne({
    email: String(req.user.email || '').toLowerCase(),
    tenantId: null,
    role: 'super_admin',
    isActive: true
  });
  if (!master) throw denied();

  next();
});
