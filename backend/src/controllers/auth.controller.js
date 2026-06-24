import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, permissionVersion: user.permissionVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

export const register = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ user: sanitizeUser(user), token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(401, 'Your account has been deactivated. Please contact your administrator.');
  if (!(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  res.json({ user: sanitizeUser(user), token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});


