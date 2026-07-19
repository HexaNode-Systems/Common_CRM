import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { Module } from '../models/Module.js';
import { RolePermission } from '../models/RolePermission.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPermissionMatrix, defaultRoleNames } from '../utils/roles.js';
import { seedModulesAndPermissions } from '../utils/moduleSeeder.js';
import { PermissionLevels } from '../utils/permissions.js';

function slugifyRoleName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function saveRolePermissions(roleId, permissionsArray) {
  const modules = await Module.find({ isActive: true });
  const moduleByName = new Map(modules.map((m) => [m.name, m]));
  const moduleById = new Map(modules.map((m) => [m._id.toString(), m]));

  for (const item of permissionsArray) {
    let mod = null;
    if (item.moduleId) {
      mod = moduleById.get(String(item.moduleId));
    }
    if (!mod && (item.module || item.moduleName)) {
      const name = item.module || item.moduleName;
      mod = moduleByName.get(String(name));
    }
    if (!mod) continue;

    let permValue = PermissionLevels.NO_ACCESS;
    if (typeof item.permission === 'number') {
      permValue = item.permission;
    } else if (typeof item.access === 'string') {
      const mapAccessToNum = {
        none: PermissionLevels.NO_ACCESS,
        view: PermissionLevels.VIEW_ONLY,
        update: PermissionLevels.UPDATE_ONLY,
        full: PermissionLevels.FULL_ACCESS
      };
      permValue = mapAccessToNum[item.access] ?? PermissionLevels.NO_ACCESS;
    } else if (typeof item.permission === 'string') {
      const mapAccessToNum = {
        none: PermissionLevels.NO_ACCESS,
        view: PermissionLevels.VIEW_ONLY,
        update: PermissionLevels.UPDATE_ONLY,
        full: PermissionLevels.FULL_ACCESS
      };
      permValue = mapAccessToNum[item.permission] ?? PermissionLevels.NO_ACCESS;
    }

    await RolePermission.findOneAndUpdate(
      { roleId, moduleId: mod._id },
      { $set: { permission: permValue } },
      { upsert: true, new: true }
    );
  }
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
  await Promise.all(
    defaultRoleNames.map((role) =>
      Role.findOneAndUpdate(
        { slug: role.slug },
        {
          $setOnInsert: {
            name: role.name,
            slug: role.slug,
            isActive: true,
            isSystem: Boolean(role.isSystem),
            isDeleted: false,
            permissions: buildPermissionMatrix(role.defaultAccess)
          }
        },
        { upsert: true, new: true }
      )
    )
  );
}

export const listRoles = asyncHandler(async (_req, res) => {
  await ensureDefaultRoles();
  await seedModulesAndPermissions();
  const items = await Role.find({ isDeleted: { $ne: true } }).sort({ isSystem: -1, name: 1 });
  res.json({ items });
});

export const createRole = asyncHandler(async (req, res) => {
  await seedModulesAndPermissions();

  const name = String(req.body.name || '').trim();
  if (!name) throw new ApiError(400, 'Role name is required');

  const slug = slugifyRoleName(req.body.slug || name);
  if (!slug) throw new ApiError(400, 'Role slug is required');

  // Check if role with this slug already exists (either active or soft deleted)
  const existingRole = await Role.findOne({ slug });
  let role;
  if (existingRole) {
    if (existingRole.isDeleted) {
      // Re-activate soft deleted role
      existingRole.isDeleted = false;
      existingRole.name = name;
      existingRole.isActive = true;
      role = await existingRole.save();
    } else {
      throw new ApiError(400, 'A role with this name already exists.');
    }
  } else {
    role = await Role.create({
      name,
      slug,
      isActive: true,
      isSystem: false,
      isDeleted: false,
      permissions: buildPermissionMatrix('none')
    });
  }

  // Save permissions if provided
  if (req.body.permissions && req.body.permissions.length > 0) {
    await saveRolePermissions(role._id, req.body.permissions);
  } else {
    // Seed default NoAccess permissions for all modules
    const modules = await Module.find({ isActive: true });
    for (const mod of modules) {
      await RolePermission.findOneAndUpdate(
        { roleId: role._id, moduleId: mod._id },
        { $setOnInsert: { permission: 0 } },
        { upsert: true }
      );
    }
  }

  res.status(201).json(role);
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!role) throw new ApiError(404, 'Role not found');

  if (req.body.name) {
    role.name = String(req.body.name).trim();
  }
  if (req.body.isActive !== undefined) {
    const isActive = Boolean(req.body.isActive);
    if (!isActive && role.isActive) {
      await assertRoleCanBeInactivated(role);
    }
    role.isActive = isActive;
  }

  role.tokenVersion += 1;
  await role.save();

  // Sync users
  const { getPermissionStringsForRole } = await import('../utils/roles.js');
  const permissionStrings = await getPermissionStringsForRole(role._id, role.slug);

  await User.updateMany(
    { role: role.slug },
    { $set: { permissions: permissionStrings }, $inc: { permissionVersion: 1 } }
  );

  res.json(role);
});

export const updateRoleStatus = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!role) throw new ApiError(404, 'Role not found');

  const isActive = Boolean(req.body.isActive);
  if (!isActive && role.isActive) await assertRoleCanBeInactivated(role);

  role.isActive = isActive;
  role.tokenVersion += 1;
  await role.save();

  await User.updateMany({ role: role.slug }, { $inc: { permissionVersion: 1 } });
  res.json(role);
});

export const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!role) throw new ApiError(404, 'Role not found');

  if (role.slug === 'super_admin' || role.isSystem) {
    throw new ApiError(400, 'System roles (including Super Admin) cannot be deleted.');
  }

  const userCount = await User.countDocuments({ role: role.slug });
  if (userCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete role. There are ${userCount} user(s) currently assigned to this role. Please reassign them to a different role first.`
    );
  }

  role.isDeleted = true;
  role.isActive = false;
  role.tokenVersion += 1;
  await role.save();

  res.json({ success: true, message: 'Role deleted successfully.' });
});

export const listModules = asyncHandler(async (req, res) => {
  await seedModulesAndPermissions();
  const items = await Module.find({ isActive: true }).sort({ displayOrder: 1 });
  res.json({ items });
});

export const getRolePermissions = asyncHandler(async (req, res) => {
  await seedModulesAndPermissions();

  const role = await Role.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!role) throw new ApiError(404, 'Role not found');

  const allModules = await Module.find({ isActive: true }).sort({ displayOrder: 1 });
  const rolePermissions = await RolePermission.find({ roleId: role._id });
  const permissionsMap = new Map(rolePermissions.map((rp) => [rp.moduleId.toString(), rp.permission]));

  const items = allModules.map((mod) => {
    let perm = permissionsMap.get(mod._id.toString()) ?? 0;
    if (role.slug === 'super_admin') {
      perm = 3; // Super admin is always full access
    }
    return {
      moduleId: mod._id,
      moduleName: mod.name,
      displayName: mod.displayName,
      permission: perm
    };
  });

  res.json({ roleId: role._id, permissions: items });
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const role = await Role.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!role) throw new ApiError(404, 'Role not found');

  if (role.slug === 'super_admin') {
    throw new ApiError(400, 'Super Admin permissions cannot be modified.');
  }

  const permissions = req.body.permissions || [];
  await saveRolePermissions(role._id, permissions);

  // Sync users permissions array of strings
  const { getPermissionStringsForRole } = await import('../utils/roles.js');
  const permissionStrings = await getPermissionStringsForRole(role._id, role.slug);

  await User.updateMany(
    { role: role.slug },
    { $set: { permissions: permissionStrings }, $inc: { permissionVersion: 1 } }
  );

  res.json({ success: true, message: 'Permissions updated successfully.' });
});
