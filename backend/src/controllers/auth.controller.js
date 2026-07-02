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

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  if (req.body.name !== undefined) user.name = String(req.body.name || '').trim();
  if (req.body.phone !== undefined) user.phone = String(req.body.phone || '').trim();
  if (req.body.city !== undefined) user.city = String(req.body.city || '').trim();
  if (req.body.location !== undefined) user.location = String(req.body.location || '').trim();
  if (req.body.profilePhoto !== undefined) user.profilePhoto = String(req.body.profilePhoto || '').trim();
  if (req.body.correspondenceAddress !== undefined) user.correspondenceAddress = String(req.body.correspondenceAddress || '').trim();
  if (req.body.permanentAddress !== undefined) user.permanentAddress = String(req.body.permanentAddress || '').trim();
  if (req.body.gender !== undefined) user.gender = String(req.body.gender || '').trim();
  if (req.body.age !== undefined) user.age = req.body.age ? Number(req.body.age) : null;

  if (typeof req.body.password === 'string' && req.body.password.trim()) {
    user.password = req.body.password.trim();
    user.permissionVersion = (user.permissionVersion || 0) + 1;
  }

  await user.save();
  const updatedUser = await User.findById(user._id).select('-password');
  res.json(sanitizeUser(updatedUser));
});


