import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
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
import { seedModulesAndPermissions } from '../utils/moduleSeeder.js';
import { ApiError } from '../utils/apiError.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Subdomains the platform itself uses (or that would confuse people).
const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'app', 'admin', 'mail', 'static', 'cdn', 'support', 'help', 'status', 'localhost', 'super-admin', 'platform']);
export const DURATION_LIMIT_MONTHS = 60;

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/_/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .slice(0, 40)
    .replace(/-+$/, '');
}

/** Whole number of months, 1 to 60. */
export function parseDurationMonths(value, fallback = 1) {
  if (value === undefined || value === null || value === '') return fallback;
  const months = Number(value);
  if (!Number.isInteger(months) || months < 1 || months > DURATION_LIMIT_MONTHS) {
    throw new ApiError(400, `Subscription duration must be a whole number of months between 1 and ${DURATION_LIMIT_MONTHS}.`);
  }
  return months;
}

export function addMonths(from, months) {
  const date = new Date(from);
  date.setMonth(date.getMonth() + months);
  return date;
}

// Three letters from the name + three digits; retried until free so a random clash never blocks sign-up.
async function generateCompanyCode(name) {
  const prefix = String(name).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X');
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const digits = attempt < 20 ? Math.floor(100 + Math.random() * 900) : crypto.randomInt(1000, 10000);
    const code = `${prefix}${digits}`;
    if (!(await Tenant.findOne({ companyCode: code }))) return code;
  }
  // Practically unreachable: fall back to a code nobody else can have.
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

/**
 * Creates a company: registry entry, its own database (settings, roles, modules) and its admin.
 * Throws ApiError (400/409) for bad input; if anything fails part-way, the registry entry is removed
 * so the same name/subdomain/email can be used again.
 */
export async function provisionTenant({ name, email, password, planSlug, subdomain, durationMonths = 1, adminName }) {
  const companyName = String(name || '').trim();
  const adminEmail = String(email || '').trim().toLowerCase();
  const adminPassword = String(password || '');
  const months = parseDurationMonths(durationMonths, 1);

  if (!companyName) throw new ApiError(400, 'Company name is required.');
  if (companyName.length > 120) throw new ApiError(400, 'Company name can be at most 120 characters.');
  if (!EMAIL.test(adminEmail) || adminEmail.length > 200) throw new ApiError(400, 'Enter a valid admin email address.');
  if (adminPassword.trim().length < 8) throw new ApiError(400, 'Admin password must be at least 8 characters.');

  // 1. Plan
  const plan = await SubscriptionPlan.findOne({ slug: String(planSlug || 'starter').toLowerCase().trim() });
  if (!plan) throw new ApiError(400, `Subscription plan "${planSlug}" was not found.`);
  if (plan.isActive === false) throw new ApiError(400, `The ${plan.name} plan is switched off. Choose another plan.`);

  // 2. Identifiers
  const finalSubdomain = slugify(subdomain || companyName);
  const tenantId = slugify(companyName) || finalSubdomain;
  if (!tenantId || !finalSubdomain) {
    throw new ApiError(400, 'Company name or subdomain must contain English letters or digits.');
  }
  if (RESERVED_SUBDOMAINS.has(finalSubdomain)) throw new ApiError(400, `"${finalSubdomain}" is reserved. Choose another subdomain.`);
  const dbName = `crm_tenant_${tenantId.replace(/-/g, '_')}`;

  // 3. Duplicates
  const existingTenant = await Tenant.findOne({ $or: [{ tenantId }, { subdomain: finalSubdomain }, { dbName }] });
  if (existingTenant) {
    const what = existingTenant.subdomain === finalSubdomain ? `The subdomain "${finalSubdomain}"` : `A company named "${existingTenant.name}"`;
    throw new ApiError(409, `${what} already exists on the platform.`);
  }
  if (await MasterUser.findOne({ email: adminEmail })) {
    throw new ApiError(409, 'This email is already registered on the platform.');
  }

  const companyCode = await generateCompanyCode(companyName);

  // 4. Registry entry
  let tenant;
  try {
    tenant = await Tenant.create({
      name: companyName,
      tenantId,
      companyCode,
      subdomain: finalSubdomain,
      dbName,
      plan: plan._id,
      planExpiresAt: addMonths(new Date(), months),
      subscriptionDuration: months,
      branding: { companyName }
    });
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'A company with this name, code or subdomain already exists. Try again.');
    throw err;
  }

  try {
    // 5. Storage folder
    const storagePath = path.join(process.cwd(), 'storage', 'tenants', tenantId);
    if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath, { recursive: true });

    // 6. Company database
    const connection = getTenantDbConnection(dbName);
    await tenantStorage.run({ connection, tenantId, dbName }, async () => {
      await Setting.findOneAndUpdate(
        { key: 'global' },
        { $setOnInsert: { ...defaultSettings, key: 'global', brand: { name: companyName, logo: '', favicon: '' } } },
        { upsert: true, new: true }
      );

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

      await seedModulesAndPermissions();

      // Company admin (the User post-save hook registers the login in MasterUser).
      await User.create({
        name: String(adminName || '').trim() || 'Company Administrator',
        email: adminEmail,
        password: adminPassword.trim(),
        role: 'super_admin',
        isActive: true
      });
    });
  } catch (err) {
    // Roll back the registry so the company can be provisioned again after fixing the problem.
    await Tenant.deleteOne({ _id: tenant._id }).catch(() => {});
    await MasterUser.deleteOne({ email: adminEmail, tenantId }).catch(() => {});
    if (err instanceof ApiError) throw err;
    if (err?.name === 'ValidationError') throw new ApiError(400, err.message);
    throw new ApiError(500, `Company database could not be set up: ${err.message}`);
  }

  return tenant;
}
