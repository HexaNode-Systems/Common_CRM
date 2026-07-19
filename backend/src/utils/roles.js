import { PermissionLevels } from './permissions.js';

export const roleModules = [
  { module: 'dashboard', label: 'Dashboard' },
  { module: 'users', label: 'Users / Customers' },
  { module: 'catalog', label: 'Products / Services' },
  { module: 'leads', label: 'Leads Management' },
  { module: 'vault', label: 'Vault / Credentials' },
  { module: 'storage', label: 'Storage Management' },
  { module: 'tasks', label: 'Task Management' },
  { module: 'orders', label: 'Orders / Leads' },
  { module: 'payments', label: 'Payments' },
  { module: 'invoices', label: 'Invoices' },
  { module: 'accessories', label: 'Accessories' }
];

export const defaultRoleNames = [
  { name: 'Super Admin', slug: 'super_admin', isSystem: true, defaultAccess: 'full' },
  { name: 'STUDENT', slug: 'student', defaultAccess: 'view' },
  { name: 'COUNSELOR', slug: 'counselor', defaultAccess: 'update' },
  { name: 'TRAINER', slug: 'trainer', defaultAccess: 'update' },
  { name: 'Project Manager', slug: 'project_manager', defaultAccess: 'full' },
  { name: 'Sales Executive', slug: 'sales_executive', defaultAccess: 'update' }
];

export function buildPermissionMatrix(defaultAccess = 'view', overrides = {}) {
  return roleModules.map((item) => ({
    ...item,
    access: overrides[item.module] || defaultAccess
  }));
}

export function matrixToPermissionStrings(matrix = []) {
  const verbsByAccess = {
    none: [],
    view: ['read'],
    update: ['read', 'update'],
    full: ['create', 'read', 'update', 'delete']
  };

  return matrix.flatMap(({ module, access }) => {
    if (module === 'dashboard') return access === 'none' ? [] : ['reports:read'];
    if (module === 'vault') return [];
    if (module === 'storage') return [];
    return (verbsByAccess[access] || []).map((verb) => `${module}:${verb}`);
  });
}

export async function getPermissionStringsForRole(roleId, roleSlug) {
  try {
    const { Module } = await import('../models/Module.js');
    const { RolePermission } = await import('../models/RolePermission.js');

    if (roleSlug === 'super_admin') {
      const activeModules = await Module.find({ isActive: true });
      const perms = [];
      for (const mod of activeModules) {
        if (mod.name === 'dashboard') {
          perms.push('reports:read');
        } else {
          perms.push(`${mod.name}:create`);
          perms.push(`${mod.name}:read`);
          perms.push(`${mod.name}:update`);
          perms.push(`${mod.name}:delete`);
        }
      }
      return perms;
    }

    const activeModules = await Module.find({ isActive: true });
    const moduleMap = new Map(activeModules.map(m => [m._id.toString(), m.name]));

    const rolePermissions = await RolePermission.find({ roleId });

    const perms = [];
    const verbsByAccess = {
      [PermissionLevels.NO_ACCESS]: [],
      [PermissionLevels.VIEW_ONLY]: ['read'],
      [PermissionLevels.UPDATE_ONLY]: ['read', 'update'],
      [PermissionLevels.FULL_ACCESS]: ['create', 'read', 'update', 'delete']
    };

    for (const rp of rolePermissions) {
      const moduleName = moduleMap.get(rp.moduleId.toString());
      if (!moduleName) continue;
      const accessLevel = rp.permission;

      if (moduleName === 'dashboard') {
        if (accessLevel > PermissionLevels.NO_ACCESS) perms.push('reports:read');
      } else {
        const verbs = verbsByAccess[accessLevel] || [];
        for (const verb of verbs) {
          perms.push(`${moduleName}:${verb}`);
        }
      }
    }
    return perms;
  } catch (err) {
    console.error('Error getting permission strings for role:', err);
    return [];
  }
}

