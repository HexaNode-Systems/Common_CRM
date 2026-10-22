import { Module } from '../models/Module.js';
import { Role } from '../models/Role.js';
import { RolePermission } from '../models/RolePermission.js';

export const defaultModulesList = [
  { name: 'dashboard', displayName: 'Dashboard', route: '/dashboard', icon: 'LayoutDashboard', displayOrder: 1 },
  { name: 'users', displayName: 'Users / Customers', route: '/users', icon: 'Users', displayOrder: 2 },
  { name: 'catalog', displayName: 'Products / Services', route: '/catalog', icon: 'FolderKanban', displayOrder: 3 },
  { name: 'leads', displayName: 'Leads Management', route: '/leads', icon: 'Target', displayOrder: 4 },
  { name: 'vault', displayName: 'Vault / Credentials', route: '/vault', icon: 'Lock', displayOrder: 5 },
  { name: 'storage', displayName: 'Storage Management', route: '/storage', icon: 'FolderOpen', displayOrder: 6 },
  { name: 'tasks', displayName: 'Task Management', route: '/tasks', icon: 'ClipboardList', displayOrder: 7 },
  { name: 'orders', displayName: 'Orders / Leads', route: '/orders', icon: 'FolderKanban', displayOrder: 8 },
  { name: 'payments', displayName: 'Payments', route: '/payments', icon: 'ClipboardList', displayOrder: 9 },
  { name: 'invoices', displayName: 'Invoices', route: '/invoices', icon: 'ClipboardList', displayOrder: 10 },
  { name: 'accessories', displayName: 'Accessories Tracking', route: '/accessories', icon: 'Laptop', displayOrder: 11 },
  { name: 'reports', displayName: 'Reports', route: '/reports', icon: 'BarChart3', displayOrder: 12 },
  { name: 'attendance', displayName: 'Attendance', route: '/attendance', icon: 'ClipboardList', displayOrder: 13 },
  { name: 'marketing', displayName: 'Marketing', route: '/marketing', icon: 'Target', displayOrder: 14 },
  { name: 'settings', displayName: 'General Settings', route: '/settings', icon: 'Settings', displayOrder: 15 },
  { name: 'crm', displayName: 'CRM', route: '/crm', icon: 'Building', displayOrder: 16 },
  { name: 'support', displayName: 'Support Desk', route: '/support', icon: 'Headphones', displayOrder: 17 },
  { name: 'inventory', displayName: 'Inventory', route: '/inventory', icon: 'FolderOpen', displayOrder: 18 },
  { name: 'whatsapp', displayName: 'WhatsApp Inbox', route: '/whatsapp-inbox', icon: 'MessageSquare', displayOrder: 19 },
  { name: 'whatsapp_integration', displayName: 'WhatsApp Integration', route: '/Integrations', icon: 'QrCode', displayOrder: 20 },
  { name: 'payroll', displayName: 'Payroll & Salary', route: '/users', icon: 'IndianRupee', displayOrder: 21 },
  // Lets a Super Admin hand role management to someone else (they can never raise their own access).
  { name: 'roles', displayName: 'Roles & Permissions', route: '/roles', icon: 'ShieldCheck', displayOrder: 22 }
];

export async function seedModulesAndPermissions() {
  // 1. Seed modules
  for (const m of defaultModulesList) {
    await Module.findOneAndUpdate(
      { name: m.name },
      {
        $setOnInsert: {
          name: m.name,
          displayName: m.displayName,
          route: m.route,
          icon: m.icon,
          isActive: true,
          displayOrder: m.displayOrder
        }
      },
      { upsert: true, new: true }
    );
  }

  // 2. Fetch all modules now in database
  const allModules = await Module.find();

  // 3. Find Super Admin role(s) and seed FullAccess (3) for all modules
  const superAdminRole = await Role.findOne({ slug: 'super_admin', isDeleted: { $ne: true } });
  if (superAdminRole) {
    for (const mod of allModules) {
      await RolePermission.findOneAndUpdate(
        { roleId: superAdminRole._id, moduleId: mod._id },
        { $set: { permission: 3 } }, // FullAccess
        { upsert: true, new: true }
      );
    }
  }

  // 4. Also seed permissions for other default roles to preserve backward compatibility
  const defaultRoles = await Role.find({ slug: { $ne: 'super_admin' }, isDeleted: { $ne: true } });
  for (const role of defaultRoles) {
    const count = await RolePermission.countDocuments({ roleId: role._id });
    if (count === 0) {
      const oldAccessMap = {};
      if (role.permissions && role.permissions.length > 0) {
        for (const p of role.permissions) {
          oldAccessMap[p.module] = p.access;
        }
      }

      const mapAccessToNum = {
        none: 0,
        view: 1,
        update: 2,
        full: 3
      };

      for (const mod of allModules) {
        const oldAccess = oldAccessMap[mod.name] || 'none';
        const permNum = mapAccessToNum[oldAccess] !== undefined ? mapAccessToNum[oldAccess] : 0;
        await RolePermission.findOneAndUpdate(
          { roleId: role._id, moduleId: mod._id },
          { $setOnInsert: { permission: permNum } },
          { upsert: true }
        );
      }
    }
  }
}
