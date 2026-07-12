import dotenv from 'dotenv';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Setting } from '../models/Setting.js';
import { SubscriptionPlan } from '../models/master/SubscriptionPlan.js';
import { MasterUser } from '../models/master/MasterUser.js';
import { allPermissions } from './permissions.js';
import { defaultSettings } from './defaultSettings.js';
import { buildPermissionMatrix, defaultRoleNames } from './roles.js';

dotenv.config();

await connectDb();

// 1. Seed Subscription Plans
const plansPayload = [
  {
    name: 'Starter Plan',
    slug: 'starter',
    description: 'Perfect for small teams starting out.',
    price: 49,
    billingCycle: 'monthly',
    limits: {
      maxUsers: 5,
      maxStorage: 5368709120, // 5GB
      maxEmployees: 10,
      maxCustomers: 100,
      maxLeads: 1000,
      maxProjects: 5
    },
    features: {
      reports: true,
      whatsapp: false,
      vault: true,
      storage: true,
      support: false,
      whiteLabel: false
    },
    isActive: true
  },
  {
    name: 'Professional Plan',
    slug: 'professional',
    description: 'Designed for growing businesses.',
    price: 99,
    billingCycle: 'monthly',
    limits: {
      maxUsers: 15,
      maxStorage: 21474836480, // 20GB
      maxEmployees: 30,
      maxCustomers: 1000,
      maxLeads: 5000,
      maxProjects: 20
    },
    features: {
      reports: true,
      whatsapp: true,
      vault: true,
      storage: true,
      support: true,
      whiteLabel: false
    },
    isActive: true
  },
  {
    name: 'Enterprise Plan',
    slug: 'enterprise',
    description: 'Unlimited features for large enterprises.',
    price: 249,
    billingCycle: 'monthly',
    limits: {
      maxUsers: 999,
      maxStorage: 107374182400, // 100GB
      maxEmployees: 999,
      maxCustomers: 99999,
      maxLeads: 999999,
      maxProjects: 999
    },
    features: {
      reports: true,
      whatsapp: true,
      vault: true,
      storage: true,
      support: true,
      whiteLabel: true
    },
    isActive: true
  }
];

console.log('Seeding subscription plans...');
for (const plan of plansPayload) {
  await SubscriptionPlan.findOneAndUpdate(
    { slug: plan.slug },
    { $set: plan },
    { upsert: true, new: true }
  );
}

// 2. Seed Super Admin
const adminPayload = {
  name: 'Super Admin',
  email: 'admin@example.com',
  password: 'Admin@12345',
  role: 'super_admin',
  permissions: allPermissions,
  isActive: true
};

console.log('Seeding global super admin...');
const existingAdmin = await User.findOne({ email: adminPayload.email }).select('+password');

if (existingAdmin) {
  existingAdmin.name = adminPayload.name;
  existingAdmin.password = adminPayload.password;
  existingAdmin.role = adminPayload.role;
  existingAdmin.permissions = adminPayload.permissions;
  existingAdmin.isActive = adminPayload.isActive;
  await existingAdmin.save();
} else {
  await User.create(adminPayload);
}

// Ensure Super Admin is explicitly mapped in MasterUser mapping
await MasterUser.findOneAndUpdate(
  { email: adminPayload.email.toLowerCase() },
  {
    email: adminPayload.email.toLowerCase(),
    tenantId: null,
    role: 'super_admin',
    isActive: true
  },
  { upsert: true, new: true }
);

// 3. Seed Default Master settings
await Setting.findOneAndUpdate(
  { key: 'global' },
  { $setOnInsert: { ...defaultSettings, key: 'global' } },
  { upsert: true, new: true }
);

// 4. Seed Default Roles
for (const role of defaultRoleNames) {
  await Role.findOneAndUpdate(
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
  );
}

console.log('Seed complete. Login: admin@example.com / Admin@12345');
process.exit(0);
