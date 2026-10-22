import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Module } from '../models/Module.js';
import { RolePermission } from '../models/RolePermission.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PermissionLevels } from '../utils/permissions.js';
import { Tenant } from '../models/master/Tenant.js';
import { ImpersonationLog } from '../models/master/SystemLogs.js';
import { tenantStorage } from '../utils/tenantStorage.js';

// Company status is checked on every request; cached briefly so it costs one lookup per company per few seconds.
const TENANT_STATUS_TTL_MS = 10000;
const tenantStatusCache = new Map(); // tenantId -> { status, at }

export function clearTenantStatusCache(tenantId) {
  if (tenantId) tenantStatusCache.delete(String(tenantId));
  else tenantStatusCache.clear();
}

async function tenantStatus(tenantId) {
  const key = String(tenantId);
  const hit = tenantStatusCache.get(key);
  if (hit && Date.now() - hit.at < TENANT_STATUS_TTL_MS) return hit.status;
  const tenant = await Tenant.findOne({ tenantId: key }).select('status');
  const status = tenant?.status || 'missing';
  tenantStatusCache.set(key, { status, at: Date.now() });
  return status;
}

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new ApiError(401, 'Not authorized');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  // The database this request runs against must be the one the token was issued for.
  // (Stops a token without a company being replayed against a company via x-tenant-id / subdomain.)
  const contextDb = tenantStorage.getStore()?.dbName || null;
  if ((decoded.dbName || null) !== contextDb) {
    throw new ApiError(401, 'This session belongs to a different company. Please sign in again.');
  }

  // Suspended or deleted companies are signed out straight away, not when their token expires.
  if (decoded.tenantId) {
    const status = await tenantStatus(decoded.tenantId);
    if (status !== 'active') {
      throw new ApiError(401, status === 'missing' ? 'Company account not found.' : `Your company account is ${status}. Please contact support.`);
    }
  }

  // "Login as company" sessions end when the platform admin leaves them.
  if (decoded.impersonationId) {
    const log = await ImpersonationLog.findById(decoded.impersonationId).select('endedAt');
    if (!log || log.endedAt) throw new ApiError(401, 'This support session has ended.');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) throw new ApiError(401, 'User not authorized');

  const role = await Role.findOne({ slug: user.role, isDeleted: { $ne: true } });
  if (role && !role.isActive) throw new ApiError(401, 'Role is inactive');
  if ((user.permissionVersion || 0) !== (decoded.permissionVersion || 0)) {
    throw new ApiError(401, 'Permissions changed. Please sign in again.');
  }

  const userObj = user.toObject();
  userObj.tenantId = decoded.tenantId || null;
  if (decoded.impersonatorId) {
    userObj.impersonatorId = decoded.impersonatorId;
    userObj.impersonatorName = decoded.impersonatorName;
    userObj.impersonationId = decoded.impersonationId || null;
  }

  req.user = userObj;
  req.role = role;
  next();
});

// True if the signed-in user's role allows `permission` ("module:action"). Super admin always passes.
export async function hasAccess(user, permission) {
  if (!user) return false;
  if (user.role === 'super_admin') return true;

  const role = await Role.findOne({ slug: user.role, isDeleted: { $ne: true } });
  if (!role || !role.isActive) return false;

  const [moduleName, action] = String(permission).split(':');
  if (!moduleName) return false;

  let mod = await Module.findOne({ name: moduleName, isActive: true });
  // Fallback for dashboard/reports
  if (!mod && moduleName === 'reports') {
    mod = await Module.findOne({ name: 'dashboard', isActive: true });
  }
  if (!mod) return false;

  const rp = await RolePermission.findOne({ roleId: role._id, moduleId: mod._id });
  const permissionLevel = rp ? rp.permission : PermissionLevels.NO_ACCESS;

  if (action === 'read') return permissionLevel >= PermissionLevels.VIEW_ONLY;
  if (action === 'delete') return permissionLevel >= PermissionLevels.FULL_ACCESS;
  return permissionLevel >= PermissionLevels.UPDATE_ONLY;
}

export const authorize = (...permissions) => asyncHandler(async (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  if (!permissions || permissions.length === 0) throw new ApiError(403, 'Permission denied');

  for (const permission of permissions) {
    if (!(await hasAccess(req.user, permission))) throw new ApiError(403, 'Permission denied');
  }

  next();
});
