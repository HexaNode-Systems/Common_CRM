import mongoose from 'mongoose';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { Module } from '../models/Module.js';
import { RolePermission } from '../models/RolePermission.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPermissionMatrix, defaultRoleNames, getPermissionStringsForRole } from '../utils/roles.js';
import { seedModulesAndPermissions } from '../utils/moduleSeeder.js';
import { PermissionLevels } from '../utils/permissions.js';
import { tenantStorage } from '../utils/tenantStorage.js';

// "customer" is the role every website sign-up gets: a role with that slug would hand them permissions.
// "super_admin" is built in and bypasses all checks.
const RESERVED_SLUGS = new Set(['super_admin', 'superadmin', 'customer']);
const LEVEL_NAMES = { none: 0, view: 1, update: 2, full: 3 };
const LEVEL_LABELS = ['No Access', 'View Only', 'Update Only', 'Full Access'];

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;
const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isSuper = (user) => user?.role === 'super_admin';

function parseBool(value, label = 'Status') {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  throw new ApiError(400, `${label} must be true or false.`);
}

function slugifyRoleName(name) {
  return String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function parseName(value) {
  const name = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!name) throw new ApiError(400, 'Role name is required.');
  if (name.length > 60) throw new ApiError(400, 'Role name can be at most 60 characters.');
  return name;
}

/** 0–3, from a number, "2", or none/view/update/full. */
function parseLevel(item, moduleLabel) {
  const raw = item.permission !== undefined ? item.permission : item.access;
  if (typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw.trim()))) {
    const n = Number(raw);
    if (Number.isInteger(n) && n >= 0 && n <= 3) return n;
  } else if (typeof raw === 'string' && LEVEL_NAMES[raw.trim().toLowerCase()] !== undefined) {
    return LEVEL_NAMES[raw.trim().toLowerCase()];
  }
  throw new ApiError(400, `Access level for ${moduleLabel} must be No Access, View Only, Update Only or Full Access.`);
}

// Seeding writes ~50 documents, so it runs once per database per server start instead of on every page load.
const seeded = new Set();
async function ensureSeeded() {
  const key = tenantStorage.getStore()?.dbName || 'default';
  if (seeded.has(key)) return;
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
  await seedModulesAndPermissions();
  seeded.add(key);
}

async function findRole(id) {
  if (!isId(id)) throw new ApiError(404, 'Role not found.');
  const role = await Role.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!role) throw new ApiError(404, 'Role not found.');
  return role;
}

// People who manage roles (Roles & Permissions access) but are not Super Admin cannot edit the role they hold:
// otherwise they could raise their own access.
function assertNotOwnRole(actor, role) {
  if (!isSuper(actor) && actor?.role === role.slug) {
    throw new ApiError(403, 'You cannot change the role you are signed in with. Ask a Super Admin.');
  }
}

async function actorLevels(actor) {
  if (isSuper(actor)) return null; // no ceiling
  const role = await Role.findOne({ slug: actor?.role, isDeleted: { $ne: true } });
  if (!role) return new Map();
  const rows = await RolePermission.find({ roleId: role._id });
  return new Map(rows.map((r) => [String(r.moduleId), Number(r.permission) || 0]));
}

function writeAudit(req, action, message, metadata) {
  return AuditLog.create({ scope: 'roles', actor: req.user?._id, action, message, metadata }).catch((err) => {
    console.error('Role audit log failed:', err.message);
  });
}

async function syncRoleUsers(role, { signOut = true } = {}) {
  const permissionStrings = await getPermissionStringsForRole(role._id, role.slug);
  await User.updateMany(
    { role: role.slug },
    signOut ? { $set: { permissions: permissionStrings }, $inc: { permissionVersion: 1 } } : { $set: { permissions: permissionStrings } }
  );
}

/**
 * Validates every row first, then writes only what changed.
 * Returns [{ module, from, to }] for the rows that changed.
 */
async function saveRolePermissions(role, items, actor) {
  if (!Array.isArray(items)) throw new ApiError(400, 'Permissions must be a list.');
  if (items.length > 200) throw new ApiError(400, 'Too many permission rows.');

  const modules = await Module.find({ isActive: true });
  const byName = new Map(modules.map((m) => [m.name, m]));
  const byId = new Map(modules.map((m) => [String(m._id), m]));
  const ceiling = await actorLevels(actor);
  const current = new Map((await RolePermission.find({ roleId: role._id })).map((r) => [String(r.moduleId), Number(r.permission) || 0]));

  const planned = new Map();
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const mod = (item.moduleId && byId.get(String(item.moduleId))) || byName.get(String(item.module || item.moduleName || ''));
    if (!mod) continue; // module switched off or unknown: nothing to save
    const label = mod.displayName || mod.name;
    const level = parseLevel(item, label);
    const from = current.get(String(mod._id)) ?? 0;
    if (level === from) continue;
    if (ceiling && level > from && level > (ceiling.get(String(mod._id)) || 0)) {
      throw new ApiError(403, `You can only give up to your own access on ${label} (${LEVEL_LABELS[ceiling.get(String(mod._id)) || 0]}).`);
    }
    planned.set(String(mod._id), { mod, from, to: level });
  }

  const changes = [];
  for (const { mod, from, to } of planned.values()) {
    await RolePermission.findOneAndUpdate({ roleId: role._id, moduleId: mod._id }, { $set: { permission: to } }, { upsert: true, new: true });
    changes.push({ module: mod.name, from, to });
  }
  return changes;
}

async function seedNoAccess(roleId) {
  const modules = await Module.find({ isActive: true });
  for (const mod of modules) {
    await RolePermission.findOneAndUpdate({ roleId, moduleId: mod._id }, { $setOnInsert: { permission: PermissionLevels.NO_ACCESS } }, { upsert: true });
  }
}

async function assertNameFree(name, exceptId = null) {
  const clash = await Role.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i'), isDeleted: { $ne: true } });
  if (clash && String(clash._id) !== String(exceptId)) throw new ApiError(409, `A role named "${clash.name}" already exists.`);
}

async function assertRoleCanBeInactivated(role) {
  if (role.isSystem || role.slug === 'super_admin') {
    throw new ApiError(400, 'System roles cannot be set to Inactive to prevent lockouts.');
  }
  const activeBoundUsers = await User.countDocuments({ role: role.slug, isActive: true });
  if (activeBoundUsers > 0) {
    throw new ApiError(409, `${activeBoundUsers} active user(s) have this role. Move them to another role before setting it Inactive.`);
  }
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export const listRoles = asyncHandler(async (_req, res) => {
  await ensureSeeded();
  const items = await Role.find({ isDeleted: { $ne: true } }).sort({ isSystem: -1, name: 1 });
  res.json({ items });
});

export const createRole = asyncHandler(async (req, res) => {
  await ensureSeeded();
  const name = parseName(req.body?.name);
  const slug = slugifyRoleName(req.body?.slug || name);
  if (!slug) throw new ApiError(400, 'Role name must contain English letters or digits.');
  if (RESERVED_SLUGS.has(slug)) throw new ApiError(400, `"${name}" is a reserved role name. Choose another name.`);
  await assertNameFree(name);

  const existing = await Role.findOne({ slug });
  let role;
  if (existing && !existing.isDeleted) throw new ApiError(409, 'A role with this name already exists.');
  try {
    if (existing) {
      // Re-creating a deleted role: start from a clean slate, never with its old permissions.
      await RolePermission.deleteMany({ roleId: existing._id });
      existing.isDeleted = false;
      existing.name = name;
      existing.isActive = true;
      role = await existing.save();
    } else {
      role = await Role.create({ name, slug, isActive: true, isSystem: false, isDeleted: false, permissions: buildPermissionMatrix('none') });
    }
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'A role with this name already exists.');
    throw err;
  }

  await seedNoAccess(role._id);
  let changes = [];
  if (Array.isArray(req.body?.permissions) && req.body.permissions.length) {
    changes = await saveRolePermissions(role, req.body.permissions, req.user);
  }
  await writeAudit(req, 'create_role', `Created role ${role.name}`, { roleId: String(role._id), changes });
  res.status(201).json(role);
});

export const updateRole = asyncHandler(async (req, res) => {
  const role = await findRole(req.params.id);
  assertNotOwnRole(req.user, role);
  const body = req.body || {};
  const notes = [];

  if (body.name !== undefined) {
    const name = parseName(body.name);
    if (name !== role.name) {
      await assertNameFree(name, role._id);
      notes.push(`renamed "${role.name}" → "${name}"`);
      role.name = name; // the slug stays the same, so nobody is signed out
    }
  }

  let statusChanged = false;
  if (body.isActive !== undefined) {
    const isActive = parseBool(body.isActive);
    if (!isActive && role.isActive) await assertRoleCanBeInactivated(role);
    if (isActive !== role.isActive) {
      statusChanged = true;
      notes.push(isActive ? 'activated' : 'deactivated');
    }
    role.isActive = isActive;
  }

  if (statusChanged) role.tokenVersion = (role.tokenVersion || 0) + 1;
  try {
    await role.save();
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'A role with this name already exists.');
    throw err;
  }
  if (statusChanged) await User.updateMany({ role: role.slug }, { $inc: { permissionVersion: 1 } });
  if (notes.length) await writeAudit(req, 'update_role', `Role ${role.name}: ${notes.join(', ')}`, { roleId: String(role._id) });

  res.json(role);
});

export const updateRoleStatus = asyncHandler(async (req, res) => {
  const role = await findRole(req.params.id);
  assertNotOwnRole(req.user, role);

  const isActive = parseBool(req.body?.isActive);
  if (isActive === role.isActive) return res.json(role);
  if (!isActive) await assertRoleCanBeInactivated(role);

  role.isActive = isActive;
  role.tokenVersion = (role.tokenVersion || 0) + 1;
  await role.save();
  await User.updateMany({ role: role.slug }, { $inc: { permissionVersion: 1 } });
  await writeAudit(req, 'update_role_status', `Role ${role.name} ${isActive ? 'activated' : 'deactivated'}`, { roleId: String(role._id) });
  res.json(role);
});

export const deleteRole = asyncHandler(async (req, res) => {
  const role = await findRole(req.params.id);
  if (role.slug === 'super_admin' || role.isSystem) throw new ApiError(400, 'System roles (including Super Admin) cannot be deleted.');
  assertNotOwnRole(req.user, role);

  const userCount = await User.countDocuments({ role: role.slug });
  if (userCount > 0) {
    throw new ApiError(400, `Cannot delete role. ${userCount} user(s) still have this role. Move them to a different role first.`);
  }

  const originalName = role.name;
  role.isDeleted = true;
  role.isActive = false;
  role.tokenVersion = (role.tokenVersion || 0) + 1;
  // Free the name so a new, unrelated role can use it (names are unique, deleted roles included).
  role.name = `${originalName} [deleted ${Date.now()}]`.slice(0, 120);
  await role.save();
  await RolePermission.deleteMany({ roleId: role._id });

  await writeAudit(req, 'delete_role', `Deleted role ${originalName}`, { roleId: String(role._id) });
  res.json({ success: true, message: 'Role deleted successfully.' });
});

export const listModules = asyncHandler(async (_req, res) => {
  await ensureSeeded();
  const items = await Module.find({ isActive: true }).sort({ displayOrder: 1 });
  res.json({ items });
});

export const getRolePermissions = asyncHandler(async (req, res) => {
  await ensureSeeded();
  const role = await findRole(req.params.id);

  const allModules = await Module.find({ isActive: true }).sort({ displayOrder: 1 });
  const rolePermissions = await RolePermission.find({ roleId: role._id });
  const permissionsMap = new Map(rolePermissions.map((rp) => [String(rp.moduleId), rp.permission]));
  const ceiling = await actorLevels(req.user);
  const editable = role.slug !== 'super_admin' && (isSuper(req.user) || req.user?.role !== role.slug);

  const items = allModules.map((mod) => {
    const perm = role.slug === 'super_admin' ? 3 : Number(permissionsMap.get(String(mod._id)) ?? 0);
    return {
      moduleId: mod._id,
      moduleName: mod.name,
      displayName: mod.displayName,
      permission: Math.min(Math.max(perm, 0), 3),
      // Highest level the signed-in person may give on this module (their own level).
      maxGrant: ceiling ? Math.max(ceiling.get(String(mod._id)) || 0, Math.min(perm, 3)) : 3
    };
  });

  res.json({ roleId: role._id, editable, permissions: items });
});

export const updateRolePermissions = asyncHandler(async (req, res) => {
  const role = await findRole(req.params.id);
  if (role.slug === 'super_admin') throw new ApiError(400, 'Super Admin permissions cannot be modified.');
  assertNotOwnRole(req.user, role);

  const changes = await saveRolePermissions(role, req.body?.permissions ?? [], req.user);
  if (!changes.length) return res.json({ success: true, changed: 0, message: 'No changes to save.' });

  // People with this role pick up the new access when they next sign in.
  await syncRoleUsers(role, { signOut: true });
  await writeAudit(req, 'update_role_permissions',
    `Permissions for ${role.name}: ${changes.map((c) => `${c.module} ${LEVEL_LABELS[c.from]} → ${LEVEL_LABELS[c.to]}`).join(', ')}`,
    { roleId: String(role._id), changes });

  res.json({ success: true, changed: changes.length, message: 'Permissions updated successfully.' });
});
