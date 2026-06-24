import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new ApiError(401, 'Not authorized');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) throw new ApiError(401, 'User not authorized');

  const role = await Role.findOne({ slug: user.role });
  if (role && !role.isActive) throw new ApiError(401, 'Role is inactive');
  if ((user.permissionVersion || 0) !== (decoded.permissionVersion || 0)) {
    throw new ApiError(401, 'Permissions changed. Please sign in again.');
  }

  req.user = user;
  req.role = role;
  next();
});

export const authorize = (...permissions) => (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  const allowed = permissions.every((permission) => req.user.permissions.includes(permission));
  if (!allowed) throw new ApiError(403, 'Permission denied');
  next();
};


