import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Module } from '../models/Module.js';
import { RolePermission } from '../models/RolePermission.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PermissionLevels } from '../utils/permissions.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new ApiError(401, 'Not authorized');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
  }

  req.user = userObj;
  req.role = role;
  next();
});

export const authorize = (...permissions) => asyncHandler(async (req, res, next) => {
  if (req.user.role === 'super_admin') return next();

  if (!permissions || permissions.length === 0) {
    throw new ApiError(403, 'Permission denied');
  }

  const role = await Role.findOne({ slug: req.user.role, isDeleted: { $ne: true } });
  if (!role || !role.isActive) {
    throw new ApiError(403, 'Role is inactive or deleted');
  }

  for (const permission of permissions) {
    const [moduleName, action] = permission.split(':');
    if (!moduleName) throw new ApiError(403, 'Permission denied');

    let targetModuleName = moduleName;
    let mod = await Module.findOne({ name: targetModuleName, isActive: true });
    
    // Fallback for dashboard/reports
    if (!mod && moduleName === 'reports') {
      mod = await Module.findOne({ name: 'dashboard', isActive: true });
    }

    if (!mod) {
      throw new ApiError(403, 'Permission denied');
    }

    const rp = await RolePermission.findOne({ roleId: role._id, moduleId: mod._id });
    const permissionLevel = rp ? rp.permission : PermissionLevels.NO_ACCESS;

    let isAllowed = false;
    if (action === 'read') {
      isAllowed = permissionLevel >= PermissionLevels.VIEW_ONLY;
    } else if (action === 'create' || action === 'update') {
      isAllowed = permissionLevel >= PermissionLevels.UPDATE_ONLY;
    } else if (action === 'delete') {
      isAllowed = permissionLevel >= PermissionLevels.FULL_ACCESS;
    } else {
      isAllowed = permissionLevel >= PermissionLevels.UPDATE_ONLY;
    }

    if (!isAllowed) {
      throw new ApiError(403, 'Permission denied');
    }
  }

  next();
});
