import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendWhatsAppMessage } from '../services/whatsapp.service.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function serializeUser(user, roleMap = new Map()) {
  const plain = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  const role = roleMap.get(plain.role) || null;

  return {
    ...plain,
    roleLabel: role?.name || plain.role,
    roleSlug: plain.role,
    roleId: role?._id || null
  };
}

async function buildRoleMap() {
  const roles = await Role.find().select('name slug isActive').sort({ isSystem: -1, name: 1 });
  return new Map(roles.map((role) => [role.slug, role]));
}

async function resolveRole(roleValue) {
  const role = await Role.findOne({ slug: roleValue });
  if (!role) throw new ApiError(400, 'Selected role is not available.');
  if (!role.isActive) throw new ApiError(400, 'Selected role is inactive.');
  return role;
}

async function ensureUniqueEmail(email, userId = null) {
  const existing = await User.findOne({ email, ...(userId ? { _id: { $ne: userId } } : {}) }).select('_id');
  if (existing) throw new ApiError(409, 'This User ID/Email is already registered.');
}

export async function bumpUserPermissionVersion(user, shouldPersist = true) {
  user.permissionVersion = (user.permissionVersion || 0) + 1;
  if (shouldPersist) await user.save();
}

async function mutateUser(user, body) {
  let invalidatesTokens = false;

  if (body.name !== undefined) user.name = String(body.name || '').trim();
  if (body.phone !== undefined) user.phone = String(body.phone || '').trim();

  if (body.email !== undefined) {
    const email = normalizeEmail(body.email);
    await ensureUniqueEmail(email, user._id);
    user.email = email;
  }

  if (body.role !== undefined) {
    const role = await resolveRole(String(body.role || '').trim());
    if (user.role !== role.slug) invalidatesTokens = true;
    user.role = role.slug;
  }

  if (body.isActive !== undefined) {
    const nextActive = body.isActive === true || body.isActive === 'true';
    if (user.isActive !== nextActive) invalidatesTokens = true;
    user.isActive = nextActive;
  }

  if (body.joiningDate !== undefined) user.joiningDate = body.joiningDate ? new Date(body.joiningDate) : null;
  if (body.employmentClassification !== undefined) user.employmentClassification = body.employmentClassification;
  if (body.baseSalary !== undefined) user.baseSalary = Number(body.baseSalary || 0);
  if (body.monthlyLeaveQuota !== undefined) user.monthlyLeaveQuota = Number(body.monthlyLeaveQuota || 2);
  
  if (body.profilePhoto !== undefined) user.profilePhoto = String(body.profilePhoto || '').trim();
  if (body.city !== undefined) user.city = String(body.city || '').trim();
  if (body.location !== undefined) user.location = String(body.location || '').trim();
  if (body.correspondenceAddress !== undefined) user.correspondenceAddress = String(body.correspondenceAddress || '').trim();
  if (body.permanentAddress !== undefined) user.permanentAddress = String(body.permanentAddress || '').trim();
  if (body.gender !== undefined) user.gender = String(body.gender || '').trim();
  if (body.age !== undefined) user.age = body.age ? Number(body.age) : null;

  if (typeof body.password === 'string' && body.password.trim()) {
    user.password = body.password.trim();
    invalidatesTokens = true;
  }

  if (invalidatesTokens) {
    user.permissionVersion = (user.permissionVersion || 0) + 1;
  }

  await user.save();
  return user;
}

export const listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;

  const [roleMap, items, total] = await Promise.all([
    buildRoleMap(),
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    User.countDocuments()
  ]);

  res.json({
    items: items.map((item) => serializeUser(item, roleMap)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '').trim();
  const roleValue = String(req.body.role || '').trim();
  const isActive = req.body.isActive === true || req.body.isActive === 'true';

  if (!name) throw new ApiError(400, 'Full name is required.');
  if (!email) throw new ApiError(400, 'User ID/Email is required.');
  if (!password) throw new ApiError(400, 'Password is required.');
  if (!roleValue) throw new ApiError(400, 'Role is required.');

  await ensureUniqueEmail(email);
  const role = await resolveRole(roleValue);

  const user = await User.create({
    name,
    email,
    password,
    phone: req.body.phone ? String(req.body.phone).trim() : undefined,
    role: role.slug,
    isActive,
    joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : undefined,
    employmentClassification: req.body.employmentClassification || 'regular_employee',
    baseSalary: Number(req.body.baseSalary || 0),
    monthlyLeaveQuota: Number(req.body.monthlyLeaveQuota || 2),
    profilePhoto: req.body.profilePhoto ? String(req.body.profilePhoto).trim() : undefined,
    city: req.body.city ? String(req.body.city).trim() : undefined,
    location: req.body.location ? String(req.body.location).trim() : undefined,
    correspondenceAddress: req.body.correspondenceAddress ? String(req.body.correspondenceAddress).trim() : undefined,
    permanentAddress: req.body.permanentAddress ? String(req.body.permanentAddress).trim() : undefined,
    gender: req.body.gender ? String(req.body.gender).trim() : undefined,
    age: req.body.age ? Number(req.body.age) : undefined
  });

  if (user.phone) {
    const welcomeMessage = `Hello *${user.name}*,\n\nWelcome to *Common CRM*! Your account has been created successfully.\n\n*Username/Email:* ${user.email}\n*Role:* ${role.name}\n\nYou can now log in to the CRM.`;
    void sendWhatsAppMessage(user.phone, welcomeMessage);
  }

  const roleMap = await buildRoleMap();
  res.status(201).json(serializeUser(user, roleMap));
});

export const getUser = asyncHandler(async (req, res) => {
  const [roleMap, user] = await Promise.all([
    buildRoleMap(),
    User.findById(req.params.id).select('-password')
  ]);

  if (!user) throw new ApiError(404, 'User not found');
  res.json(serializeUser(user, roleMap));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  await mutateUser(user, req.body);

  const roleMap = await buildRoleMap();
  const updatedUser = await User.findById(user._id).select('-password');
  res.json(serializeUser(updatedUser, roleMap));
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const nextActive = req.body.isActive === true || req.body.isActive === 'true';
  if (user.isActive !== nextActive) {
    user.isActive = nextActive;
    user.permissionVersion = (user.permissionVersion || 0) + 1;
    await user.save();
  }

  const roleMap = await buildRoleMap();
  const updatedUser = await User.findById(user._id).select('-password');
  res.json(serializeUser(updatedUser, roleMap));
});
