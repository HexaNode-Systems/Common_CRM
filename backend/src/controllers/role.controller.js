import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPermissionMatrix, defaultRoleNames, matrixToPermissionStrings } from '../utils/roles.js';

function slugifyRoleName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function sanitizePermissions(permissions = []) {
  const fallback = buildPermissionMatrix('view');
  return fallback.map((moduleDef) => {
    const provided = permissions.find((item) => item.module === moduleDef.module);
    return {
      ...moduleDef,
      access: ['none', 'view', 'update', 'full'].includes(provided?.access) ? provided.access : moduleDef.access
    };
  });
}

async function syncUsersForRole(role) {
  const permissionStrings = matrixToPermissionStrings(role.permissions);
  await User.updateMany(
    { role: role.slug },
    { $set: { permissions: permissionStrings }, $inc: { permissionVersion: 1 } }
  );
}

async function assertRoleCanBeInactivated(role) {
  if (role.isSystem || role.slug === 'super_admin') {
    throw new ApiError(400, 'System roles cannot be set to Inactive to prevent lockouts.');
  }

  const activeBoundUsers = await User.countDocuments({ role: role.slug, isActive: true });
  if (activeBoundUsers > 0) {
    throw new ApiError(409, 'Role is assigned to active administrators. Reassign those users before setting it Inactive.');
  }
}

async function ensureDefaultRoles() {
  await Promise.all(defaultRoleNames.map((role) => Role.findOneAndUpdate(
    { slug: role.slug },
    {
      $setOnInsert: {
        name: role.name,
        slug: role.slug,
        isActive: true,
        isSystem: Boolean(role.isSystem),
        permissions: buildPermissionMatrix(role.defaultAccess)
      }
    },
    { upsert: true, new: true }
  )));
}

export const listRoles = asyncHandler(async (_req, res) => {
  await ensureDefaultRoles();
  const items = await Role.find().sort({ isSystem: -1, name: 1 });
  res.json({ items });
});

export const createRole = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new ApiError(400, 'Role name is required');

  const slug = slugifyRoleName(req.body.slug || name);
  if (!slug) throw new ApiError(400, 'Role slug is required');

  const role = await Role.create({
    name,
    slug,
    isActive: true,
    isSystem: false,
    permissions: sanitizePermissions(req.body.permissions)
  });

  res.status(201).json(role);
});

export const updateRoleStatus = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, 'Role not found');

  const isActive = Boolean(req.body.isActive);
  if (!isActive && role.isActive) await assertRoleCanBeInactivated(role);

  role.isActive = isActive;
  role.tokenVersion += 1;
  await role.save();

  await User.updateMany({ role: role.slug }, { $inc: { permissionVersion: 1 } });
  res.json(role);
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new ApiError(404, 'Role not found');

  role.permissions = sanitizePermissions(req.body.permissions);
  role.tokenVersion += 1;
  await role.save();

  await syncUsersForRole(role);
  res.json(role);
});




