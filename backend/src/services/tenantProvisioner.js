import fs from 'fs';
import path from 'path';
import { Tenant } from '../models/master/Tenant.js';
import { SubscriptionPlan } from '../models/master/SubscriptionPlan.js';
import { MasterUser } from '../models/master/MasterUser.js';
import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { Setting } from '../models/Setting.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { buildPermissionMatrix, defaultRoleNames } from '../utils/roles.js';
import { defaultSettings } from '../utils/defaultSettings.js';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

function generateCompanyCode(name) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  const prefix = clean.slice(0, 3).padEnd(3, 'X');
  const rand = Math.floor(100 + Math.random() * 900); // 3-digit random number
  return `${prefix}${rand}`;
}

export async function provisionTenant({ name, email, password, planSlug, subdomain }) {
  // 1. Verify Subscription Plan
  const plan = await SubscriptionPlan.findOne({ slug: planSlug || 'starter' });
  if (!plan) {
    throw new Error(`Subscription plan '${planSlug}' not found.`);
  }

  // 2. Generate Unique Identifiers
  const tenantId = slugify(name);
  const companyCode = generateCompanyCode(name);
  const finalSubdomain = subdomain ? slugify(subdomain) : tenantId;
  const dbName = `crm_tenant_${tenantId.replace(/-/g, '_')}`;

  // 3. Prevent Duplicates in Master DB
  const existingTenant = await Tenant.findOne({
    $or: [
      { tenantId },
      { companyCode },
      { subdomain: finalSubdomain },
      { dbName }
    ]
  });
  if (existingTenant) {
    throw new Error('A company with this name or subdomain already exists.');
  }

  const existingMasterUser = await MasterUser.findOne({ email: email.toLowerCase() });
  if (existingMasterUser) {
    throw new Error('This email is already registered on the platform.');
  }

  // 4. Create Tenant Registry in Master Database
  const tenant = await Tenant.create({
    name,
    tenantId,
    companyCode,
    subdomain: finalSubdomain,
    dbName,
    plan: plan._id,
    planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30-day trial
    branding: {
      companyName: name
    }
  });

  // 5. Initialize Isolated Storage Folder
  const storagePath = path.join(process.cwd(), 'storage', 'tenants', tenantId);
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  // 6. Connect to the Tenant Database & Seed
  const connection = getTenantDbConnection(dbName);

  await tenantStorage.run({ connection, tenantId, dbName }, async () => {
    // A. Seed settings
    await Setting.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: { ...defaultSettings, key: 'global', brand: { name, logo: '', favicon: '' } } },
      { upsert: true, new: true }
    );

    // B. Seed roles & permissions
    for (const roleDef of defaultRoleNames) {
      await Role.findOneAndUpdate(
        { slug: roleDef.slug },
        {
          $setOnInsert: {
            name: roleDef.name,
            slug: roleDef.slug,
            isActive: true,
            isSystem: Boolean(roleDef.isSystem),
            permissions: buildPermissionMatrix(roleDef.defaultAccess)
          }
        },
        { upsert: true, new: true }
      );
    }

    // C. Create Tenant Admin account
    // (This triggers User post-save hook which registers the login mapping in MasterUser automatically)
    await User.create({
      name: 'Tenant Administrator',
      email: email.toLowerCase(),
      password,
      role: 'super_admin',
      isActive: true
    });
  });

  return tenant;
}
