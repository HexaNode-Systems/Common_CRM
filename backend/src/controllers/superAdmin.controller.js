import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Tenant } from '../models/master/Tenant.js';
import { SubscriptionPlan } from '../models/master/SubscriptionPlan.js';
import { MasterUser } from '../models/master/MasterUser.js';
import { User } from '../models/User.js';
import { ImpersonationLog, SystemAuditLog } from '../models/master/SystemLogs.js';
import { provisionTenant, parseDurationMonths, addMonths, slugify } from '../services/tenantProvisioner.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { clearTenantStatusCache } from '../middleware/auth.middleware.js';

const TENANT_STATUSES = ['active', 'suspended', 'deleted'];
const BILLING_CYCLES = ['monthly', 'yearly', 'lifetime'];
const LIMIT_FIELDS = ['maxUsers', 'maxStorage', 'maxEmployees', 'maxCustomers', 'maxLeads', 'maxProjects'];
const FEATURE_FIELDS = ['reports', 'whatsapp', 'vault', 'storage', 'support', 'whiteLabel'];
const DAY_MS = 24 * 60 * 60 * 1000;

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;
const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toBool = (v) => v === true || v === 'true';

function audit(req, action, targetType, targetId, message, metadata) {
  return SystemAuditLog.create({
    actor: String(req.user?._id || 'system'),
    actorName: req.user?.name || 'Super Admin',
    action,
    targetType,
    targetId: targetId ? String(targetId) : undefined,
    message,
    ipAddress: req.ip,
    ...(metadata ? { metadata } : {})
  });
}

async function findTenant(id) {
  if (!isId(id)) throw new ApiError(404, 'Company not found.');
  const tenant = await Tenant.findById(id);
  if (!tenant) throw new ApiError(404, 'Company not found.');
  return tenant;
}

// Tenants are returned with their plan filled in, so the table never loses the plan name after an action.
async function withPlan(tenant) {
  return Tenant.findById(tenant._id).populate('plan', 'name slug price billingCycle isActive');
}

/** Price per month for MRR: yearly plans are spread over 12 months, lifetime plans add nothing. */
function monthlyValue(plan) {
  if (!plan) return 0;
  const price = Number(plan.price) || 0;
  if (plan.billingCycle === 'yearly') return price / 12;
  if (plan.billingCycle === 'lifetime') return 0;
  return price;
}

/* ------------------------------------------------------------------ */
/* Companies                                                           */
/* ------------------------------------------------------------------ */

export const listTenants = asyncHandler(async (req, res) => {
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(Math.max(1, Math.floor(Number(req.query.limit)) || 20), 100);

  const filter = {};
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { tenantId: regex }, { subdomain: regex }, { companyCode: regex }];
  }
  if (req.query.status !== undefined && req.query.status !== '') {
    if (!TENANT_STATUSES.includes(req.query.status)) throw new ApiError(400, 'Unknown company status.');
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Tenant.find(filter).populate('plan', 'name slug price billingCycle isActive').sort('-createdAt').skip((page - 1) * limit).limit(limit),
    Tenant.countDocuments(filter)
  ]);

  res.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const createTenant = asyncHandler(async (req, res) => {
  const { name, email, password, planSlug, subdomain, durationMonths, adminName } = req.body || {};
  const tenant = await provisionTenant({ name, email, password, planSlug, subdomain, durationMonths, adminName });

  await audit(req, 'create_tenant', 'tenant', tenant._id,
    `Provisioned ${tenant.name} (${tenant.tenantId}) on ${planSlug || 'starter'} for ${tenant.subscriptionDuration} month(s)`);

  res.status(201).json(await withPlan(tenant));
});

export const updateTenantSubscription = asyncHandler(async (req, res) => {
  const tenant = await findTenant(req.params.id);
  const body = req.body || {};
  const months = parseDurationMonths(body.subscriptionDuration, null);
  if (months === null) throw new ApiError(400, 'Subscription duration is required.');

  let expiry;
  if (body.planExpiresAt) {
    expiry = new Date(body.planExpiresAt);
    if (Number.isNaN(expiry.getTime())) throw new ApiError(400, 'Choose a valid expiry date.');
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    if (expiry < startOfToday) throw new ApiError(400, 'Expiry date cannot be in the past. Suspend the company instead.');
    if (expiry > addMonths(new Date(), 120)) throw new ApiError(400, 'Expiry date is too far in the future.');
  } else {
    // Renewing early adds the months on top of what is left, so no paid days are lost.
    const current = tenant.planExpiresAt ? new Date(tenant.planExpiresAt) : null;
    const from = current && current > new Date() ? current : new Date();
    expiry = addMonths(from, months);
  }

  let planNote = '';
  if (body.planSlug || body.planId) {
    const plan = body.planId
      ? (isId(body.planId) ? await SubscriptionPlan.findById(body.planId) : null)
      : await SubscriptionPlan.findOne({ slug: String(body.planSlug).toLowerCase().trim() });
    if (!plan) throw new ApiError(400, 'Selected plan was not found.');
    const changing = String(plan._id) !== String(tenant.plan);
    if (changing && plan.isActive === false) throw new ApiError(400, `The ${plan.name} plan is switched off.`);
    if (changing) planNote = `, plan → ${plan.name}`;
    tenant.plan = plan._id;
  }

  tenant.subscriptionDuration = months;
  tenant.planExpiresAt = expiry;
  await tenant.save();

  await audit(req, 'update_tenant_subscription', 'tenant', tenant._id,
    `Updated subscription for ${tenant.name}: ${months} month(s), expires ${expiry.toISOString().slice(0, 10)}${planNote}`);

  res.json(await withPlan(tenant));
});

export const updateTenantStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!TENANT_STATUSES.includes(status)) throw new ApiError(400, 'Invalid company status.');

  const tenant = await findTenant(req.params.id);
  const previous = tenant.status;
  tenant.status = status;
  await tenant.save();
  clearTenantStatusCache(tenant.tenantId); // signed-in users of a suspended company are cut off right away

  // Sign-in is blocked by the company status itself, so people's own on/off switches are left alone.
  // When a company comes back, logins switched off by older versions of this screen are restored
  // from each person's own status in the company database (people deactivated there stay off).
  if (status === 'active' && previous !== 'active') {
    try {
      const connection = getTenantDbConnection(tenant.dbName);
      const people = await tenantStorage.run({ connection, tenantId: tenant.tenantId, dbName: tenant.dbName },
        () => User.find({}).select('email isActive'));
      for (const person of people) {
        await MasterUser.findOneAndUpdate(
          { email: String(person.email).toLowerCase(), tenantId: tenant.tenantId },
          { $set: { isActive: person.isActive !== false } }
        );
      }
    } catch (err) {
      console.error(`Could not resync logins for ${tenant.tenantId}:`, err.message);
    }
  }

  await audit(req, 'update_tenant_status', 'tenant', tenant._id, `Changed ${tenant.name} from '${previous}' to '${status}'`, { status, previous });
  res.json(await withPlan(tenant));
});

/* ------------------------------------------------------------------ */
/* Login as company                                                    */
/* ------------------------------------------------------------------ */

export const impersonateTenant = asyncHandler(async (req, res) => {
  const reason = String(req.body?.reason || '').trim();
  if (!reason) throw new ApiError(400, 'Reason for impersonation is required.');
  if (reason.length > 500) throw new ApiError(400, 'Reason can be at most 500 characters.');

  const tenant = await findTenant(req.params.id);
  if (tenant.status !== 'active') throw new ApiError(400, `Cannot log in to a ${tenant.status} company.`);

  const connection = getTenantDbConnection(tenant.dbName);
  let tenantAdmin = null;
  await tenantStorage.run({ connection, tenantId: tenant.tenantId, dbName: tenant.dbName }, async () => {
    tenantAdmin = await User.findOne({ role: 'super_admin', isActive: true });
    if (!tenantAdmin) tenantAdmin = await User.findOne({ role: 'admin', isActive: true });
  });
  if (!tenantAdmin) throw new ApiError(404, 'No active administrator account was found in this company.');

  const log = await ImpersonationLog.create({
    superAdminId: String(req.user._id),
    superAdminName: req.user.name || 'Super Admin',
    tenantId: tenant.tenantId,
    tenantName: tenant.name,
    targetUserId: String(tenantAdmin._id),
    targetUserName: tenantAdmin.name,
    reason,
    ipAddress: req.ip,
    userAgent: req.headers?.['user-agent']
  });

  await audit(req, 'impersonate_tenant', 'tenant', tenant._id,
    `Logged in as ${tenantAdmin.name} of ${tenant.name}: ${reason}`, { impersonationLogId: String(log._id) });

  const token = jwt.sign(
    {
      id: tenantAdmin._id,
      role: tenantAdmin.role,
      permissionVersion: tenantAdmin.permissionVersion || 0,
      tenantId: tenant.tenantId,
      dbName: tenant.dbName,
      impersonatorId: req.user._id,
      impersonatorName: req.user.name,
      impersonationId: String(log._id)
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.json({
    token,
    user: {
      _id: tenantAdmin._id,
      name: tenantAdmin.name,
      email: tenantAdmin.email,
      role: tenantAdmin.role,
      tenantId: tenant.tenantId,
      impersonatorName: req.user.name
    },
    impersonation: { active: true, id: String(log._id), impersonatorName: req.user.name, tenantName: tenant.name }
  });
});

// Called with the platform token when the admin leaves the company; the support token stops working.
export const endImpersonation = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new ApiError(404, 'Session not found.');
  const log = await ImpersonationLog.findById(req.params.id);
  if (!log) throw new ApiError(404, 'Session not found.');
  if (!log.endedAt) {
    log.endedAt = new Date();
    await log.save();
  }
  res.json({ ended: true, endedAt: log.endedAt });
});

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

function number(value, label, { min = 0, max = 1e12, integer = false } = {}) {
  const n = Number(value);
  if (value === '' || value === null || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new ApiError(400, `${label} must be ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}.`);
  }
  return n;
}

function validatePlan(body = {}, { creating = false } = {}) {
  const out = {};
  if (creating || body.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (!name) throw new ApiError(400, 'Plan name is required.');
    if (name.length > 60) throw new ApiError(400, 'Plan name can be at most 60 characters.');
    out.name = name;
  }
  if (body.description !== undefined) {
    const description = String(body.description ?? '').trim();
    if (description.length > 300) throw new ApiError(400, 'Description can be at most 300 characters.');
    out.description = description;
  }
  if (creating || body.price !== undefined) out.price = Math.round(number(body.price, 'Price', { max: 10000000 }) * 100) / 100;
  if (body.billingCycle !== undefined) {
    if (!BILLING_CYCLES.includes(body.billingCycle)) throw new ApiError(400, 'Billing cycle must be monthly, yearly or lifetime.');
    out.billingCycle = body.billingCycle;
  }
  if (body.limits && typeof body.limits === 'object') {
    for (const field of LIMIT_FIELDS) {
      if (body.limits[field] === undefined) continue;
      out[`limits.${field}`] = number(body.limits[field], field, { min: 0, max: field === 'maxStorage' ? 1e14 : 1e7, integer: true });
    }
  }
  if (body.features && typeof body.features === 'object') {
    for (const field of FEATURE_FIELDS) if (body.features[field] !== undefined) out[`features.${field}`] = toBool(body.features[field]);
  }
  if (body.isActive !== undefined) out.isActive = toBool(body.isActive);
  return out;
}

async function assertPlanNameFree(name, exceptId = null) {
  const clash = await SubscriptionPlan.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') });
  if (clash && String(clash._id) !== String(exceptId)) throw new ApiError(409, `A plan named "${clash.name}" already exists.`);
}

export const listPlans = asyncHandler(async (_req, res) => {
  const items = await SubscriptionPlan.find().sort({ price: 1 });
  res.json({ items });
});

export const createPlan = asyncHandler(async (req, res) => {
  const fields = validatePlan(req.body, { creating: true });
  const slug = slugify(req.body?.slug || fields.name);
  if (!slug) throw new ApiError(400, 'Plan name must contain English letters or digits.');
  await assertPlanNameFree(fields.name);
  if (await SubscriptionPlan.findOne({ slug })) throw new ApiError(409, `A plan with the code "${slug}" already exists.`);

  // Dotted keys (limits.maxUsers) → nested object for create.
  const doc = { slug };
  for (const [key, value] of Object.entries(fields)) {
    const [head, tail] = key.split('.');
    if (tail) doc[head] = { ...(doc[head] || {}), [tail]: value };
    else doc[key] = value;
  }

  let plan;
  try {
    plan = await SubscriptionPlan.create(doc);
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'A plan with this name already exists.');
    throw err;
  }
  await audit(req, 'create_plan', 'plan', plan._id, `Created plan ${plan.name} (${plan.slug})`);
  res.status(201).json(plan);
});

export const updatePlan = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new ApiError(404, 'Plan not found.');
  const existing = await SubscriptionPlan.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Plan not found.');

  // The plan code (slug) is used when companies are provisioned, so it is not editable here.
  const fields = validatePlan(req.body);
  if (fields.name) await assertPlanNameFree(fields.name, existing._id);

  let plan;
  try {
    plan = await SubscriptionPlan.findOneAndUpdate({ _id: existing._id }, { $set: fields }, { new: true, runValidators: true });
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'A plan with this name already exists.');
    throw err;
  }
  await audit(req, 'update_plan', 'plan', existing._id, `Updated plan ${plan?.name || existing.name}`);
  res.json(plan);
});

/* ------------------------------------------------------------------ */
/* Metrics                                                             */
/* ------------------------------------------------------------------ */

export const getAnalytics = asyncHandler(async (_req, res) => {
  const now = new Date();
  const soon = new Date(now.getTime() + 7 * DAY_MS);

  const [tenants, plans, totalUsers] = await Promise.all([
    Tenant.find().select('status plan planExpiresAt'),
    SubscriptionPlan.find(),
    MasterUser.countDocuments({ tenantId: { $ne: null }, isActive: true })
  ]);
  const planById = new Map(plans.map((p) => [String(p._id), p]));

  let activeTenants = 0, suspendedTenants = 0, expiredTenants = 0, expiringSoon = 0, mrr = 0;
  for (const t of tenants) {
    if (t.status === 'suspended') suspendedTenants += 1;
    if (t.status !== 'active') continue;
    activeTenants += 1;
    const expiry = t.planExpiresAt ? new Date(t.planExpiresAt) : null;
    if (expiry && expiry < now) { expiredTenants += 1; continue; } // not paying any more
    if (expiry && expiry < soon) expiringSoon += 1;
    mrr += monthlyValue(planById.get(String(t.plan?._id || t.plan)));
  }
  mrr = Math.round(mrr * 100) / 100;

  res.json({
    totalTenants: tenants.length,
    activeTenants,
    suspendedTenants,
    expiredTenants,
    expiringSoon,
    totalUsers,
    mrr,
    revenuePlaceholder: mrr, // older clients read this name
    plansCount: plans.length
  });
});
