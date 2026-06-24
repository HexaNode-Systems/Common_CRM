import { allPermissions } from './permissions.js';

export const roleModules = [
  { module: 'dashboard', label: 'Dashboard' },
  { module: 'users', label: 'Users / Customers' },
  { module: 'catalog', label: 'Products / Services' },
  { module: 'orders', label: 'Orders / Leads' },
  { module: 'payments', label: 'Payments' },
  { module: 'invoices', label: 'Invoices' },
  { module: 'vault', label: 'Vault / Credentials' }
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
    return (verbsByAccess[access] || []).map((verb) => `${module}:${verb}`);
  }).filter((permission) => allPermissions.includes(permission));
}
