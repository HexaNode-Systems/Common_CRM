import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { MasterUser } from '../models/master/MasterUser.js';
import { Tenant } from '../models/master/Tenant.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';
import { createUser } from './user.controller.js';

function signToken(user, tenantId = null, dbName = null) {
  return jwt.sign(
    { 
      id: user._id, 
      role: user.role, 
      permissionVersion: user.permissionVersion || 0,
      tenantId,
      dbName
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
}

function sanitizeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

// Kept for old API clients. It used to save the raw request body (any role, including Super Admin)
// and hand back a login token without a company, which opened the SaaS platform panel.
// It now follows exactly the same rules as "Add user" on the Users page and returns no token.
export const register = createUser;

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Look up user in Master Database
  const masterUser = await MasterUser.findOne({ email: normalizedEmail });
  if (!masterUser) throw new ApiError(401, 'Invalid email or password');
  if (!masterUser.isActive) throw new ApiError(401, 'Your account has been deactivated. Please contact your administrator.');

  let user = null;
  let tenantId = null;
  let dbName = null;

  if (masterUser.tenantId) {
    // Tenant user: look up tenant status and database name
    const tenant = await Tenant.findOne({ tenantId: masterUser.tenantId });
    if (!tenant) throw new ApiError(401, 'Company associated with this account not found.');
    if (tenant.status !== 'active') {
      throw new ApiError(403, `Your company account is currently ${tenant.status}. Please contact support.`);
    }

    tenantId = tenant.tenantId;
    dbName = tenant.dbName;

    const connection = getTenantDbConnection(dbName);
    
    // Retrieve user in tenant connection context
    await tenantStorage.run({ connection, tenantId, dbName }, async () => {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    });
  } else {
    // Global Super Admin: check user on default (Master DB) connection
    user = await User.findOne({ email: normalizedEmail }).select('+password');
  }

  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(401, 'Your account has been deactivated. Please contact your administrator.');

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid email or password');

  // Update login timestamp
  masterUser.lastLoginAt = new Date();
  await masterUser.save();

  // Dynamically load permissions
  const { Role } = await import('../models/Role.js');
  const { getPermissionStringsForRole } = await import('../utils/roles.js');
  const roleObj = await Role.findOne({ slug: user.role, isDeleted: { $ne: true } });
  if (roleObj) {
    user.permissions = await getPermissionStringsForRole(roleObj._id, roleObj.slug);
    await User.updateOne({ _id: user._id }, { $set: { permissions: user.permissions } });
  } else if (user.role === 'super_admin') {
    user.permissions = await getPermissionStringsForRole(null, 'super_admin');
    await User.updateOne({ _id: user._id }, { $set: { permissions: user.permissions } });
  }

  res.json({
    // tenantId lets the app tell a company admin apart from the platform owner straight after sign-in.
    user: { ...sanitizeUser(user), tenantId },
    token: signToken(user, tenantId, dbName)
  });
});

export const me = asyncHandler(async (req, res) => {
  const { Role } = await import('../models/Role.js');
  const { getPermissionStringsForRole } = await import('../utils/roles.js');
  
  const roleObj = await Role.findOne({ slug: req.user.role, isDeleted: { $ne: true } });
  let permissions = [];
  if (roleObj) {
    permissions = await getPermissionStringsForRole(roleObj._id, roleObj.slug);
  } else if (req.user.role === 'super_admin') {
    permissions = await getPermissionStringsForRole(null, 'super_admin');
  } else {
    permissions = req.user.permissions;
  }
  
  const updatedUser = { ...req.user, permissions };
  res.json(updatedUser);
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
    // A platform admin using "Login as company" must not take over the client's own password.
    if (req.user.impersonatorId) throw new ApiError(403, 'Passwords cannot be changed during a support session.');
    if (req.body.password.trim().length < 8) throw new ApiError(400, 'Password must be at least 8 characters.');
    user.password = req.body.password.trim();
    user.permissionVersion = (user.permissionVersion || 0) + 1;
  }

  await user.save();
  const updatedUser = await User.findById(user._id).select('-password');
  res.json(sanitizeUser(updatedUser));
});


