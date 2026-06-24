import dotenv from 'dotenv';
import { connectDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Setting } from '../models/Setting.js';
import { allPermissions } from './permissions.js';
import { defaultSettings } from './defaultSettings.js';
import { buildPermissionMatrix, defaultRoleNames } from './roles.js';

dotenv.config();

await connectDb();

const adminPayload = {
  name: 'Super Admin',
  email: 'admin@example.com',
  password: 'Admin@12345',
  role: 'super_admin',
  permissions: allPermissions,
  isActive: true
};

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

await Setting.findOneAndUpdate(
  { key: 'global' },
  { $setOnInsert: { ...defaultSettings, key: 'global' } },
  { upsert: true, new: true }
);

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

