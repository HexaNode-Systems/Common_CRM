import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
  if (!token) throw new ApiError(401, 'Not authorized');

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) throw new ApiError(401, 'User not authorized');

  req.user = user;
  next();
});

export const authorize = (...permissions) => (req, res, next) => {
  if (req.user.role === 'super_admin') return next();
  const allowed = permissions.every((permission) => req.user.permissions.includes(permission));
  if (!allowed) throw new ApiError(403, 'Permission denied');
  next();
};

