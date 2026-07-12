import { Tenant } from '../models/master/Tenant.js';
import { SubscriptionPlan } from '../models/master/SubscriptionPlan.js';
import { MasterUser } from '../models/master/MasterUser.js';
import { User } from '../models/User.js';
import { ImpersonationLog, SystemAuditLog } from '../models/master/SystemLogs.js';
import { provisionTenant } from '../services/tenantProvisioner.js';
import { getTenantDbConnection } from '../utils/connectionManager.js';
import { tenantStorage } from '../utils/tenantStorage.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import jwt from 'jsonwebtoken';

// 1. List Tenants
export const listTenants = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { name: searchRegex },
      { tenantId: searchRegex },
      { subdomain: searchRegex },
      { companyCode: searchRegex }
    ];
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Tenant.find(filter)
      .populate('plan', 'name slug price billingCycle')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Tenant.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// 2. Create Tenant
export const createTenant = asyncHandler(async (req, res) => {
  const { name, email, password, planSlug, subdomain, durationMonths } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Company Name, Admin Email, and Admin Password are required.');
  }

  const tenant = await provisionTenant({ name, email, password, planSlug, subdomain, durationMonths });

  // Log platform audit
  await SystemAuditLog.create({
    actor: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'create_tenant',
    targetType: 'tenant',
    targetId: tenant._id,
    message: `Provisioned new tenant: ${tenant.name} (${tenant.tenantId}) with duration ${durationMonths || 1} months`,
    ipAddress: req.ip
  });

  res.status(201).json(tenant);
});

// 2b. Update Tenant Subscription
export const updateTenantSubscription = asyncHandler(async (req, res) => {
  const { subscriptionDuration, planExpiresAt } = req.body;

  if (!subscriptionDuration) {
    throw new ApiError(400, 'Subscription duration is required.');
  }

  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) throw new ApiError(404, 'Tenant not found.');

  tenant.subscriptionDuration = Number(subscriptionDuration);
  if (planExpiresAt) {
    tenant.planExpiresAt = new Date(planExpiresAt);
  } else {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + Number(subscriptionDuration));
    tenant.planExpiresAt = expiry;
  }

  await tenant.save();

  // Log platform audit
  await SystemAuditLog.create({
    actor: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'update_tenant_subscription',
    targetType: 'tenant',
    targetId: tenant._id,
    message: `Updated subscription for ${tenant.name}: Duration ${subscriptionDuration} months, Expiry ${tenant.planExpiresAt.toISOString()}`,
    ipAddress: req.ip
  });

  res.json(tenant);
});

// 3. Update Tenant Status
export const updateTenantStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended', 'deleted'].includes(status)) {
    throw new ApiError(400, 'Invalid tenant status.');
  }

  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) throw new ApiError(404, 'Tenant not found.');

  tenant.status = status;
  await tenant.save();

  // If suspended or deleted, deactivate all tenant users mapping in MasterUser so they can't login
  const isActive = status === 'active';
  await MasterUser.updateMany(
    { tenantId: tenant.tenantId },
    { $set: { isActive } }
  );

  // Log platform audit
  await SystemAuditLog.create({
    actor: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'update_tenant_status',
    targetType: 'tenant',
    targetId: tenant._id,
    message: `Updated tenant status of ${tenant.name} to '${status}'`,
    ipAddress: req.ip,
    metadata: { status }
  });

  res.json(tenant);
});

// 4. Impersonate Tenant ("Login as Client")
export const impersonateTenant = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) {
    throw new ApiError(400, 'Reason for impersonation is required.');
  }

  const tenant = await Tenant.findById(req.params.id);
  if (!tenant) throw new ApiError(404, 'Tenant not found.');
  if (tenant.status !== 'active') {
    throw new ApiError(400, `Cannot impersonate a ${tenant.status} tenant.`);
  }

  const connection = getTenantDbConnection(tenant.dbName);
  let tenantAdmin = null;

  // Query tenant database to find their local administrator
  await tenantStorage.run({ connection, tenantId: tenant.tenantId, dbName: tenant.dbName }, async () => {
    tenantAdmin = await User.findOne({ role: 'super_admin', isActive: true });
    if (!tenantAdmin) {
      // Fallback to any active administrator
      tenantAdmin = await User.findOne({ role: 'admin', isActive: true });
    }
  });

  if (!tenantAdmin) {
    throw new ApiError(404, 'No active administrator account was found inside the tenant database.');
  }

  // Log impersonation
  const log = await ImpersonationLog.create({
    superAdminId: req.user?._id,
    superAdminName: req.user?.name || 'Super Admin',
    tenantId: tenant.tenantId,
    tenantName: tenant.name,
    targetUserId: tenantAdmin._id,
    targetUserName: tenantAdmin.name,
    reason,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  await SystemAuditLog.create({
    actor: req.user?._id,
    actorName: req.user?.name || 'Super Admin',
    action: 'impersonate_tenant',
    targetType: 'tenant',
    targetId: tenant._id,
    message: `Super Admin impersonated tenant admin ${tenantAdmin.name} of ${tenant.name}`,
    ipAddress: req.ip,
    metadata: { impersonationLogId: log._id }
  });

  // Generate Impersonation JWT Token
  const token = jwt.sign(
    {
      id: tenantAdmin._id,
      role: tenantAdmin.role,
      permissionVersion: tenantAdmin.permissionVersion || 0,
      tenantId: tenant.tenantId,
      dbName: tenant.dbName,
      impersonatorId: req.user?._id,
      impersonatorName: req.user?.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' } // Shorter expiry for impersonated sessions
  );

  res.json({
    token,
    user: {
      _id: tenantAdmin._id,
      name: tenantAdmin.name,
      email: tenantAdmin.email,
      role: tenantAdmin.role
    },
    impersonation: {
      active: true,
      impersonatorName: req.user?.name
    }
  });
});

// 5. Subscription Plans
export const listPlans = asyncHandler(async (_req, res) => {
  const items = await SubscriptionPlan.find().sort({ price: 1 });
  res.json({ items });
});

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.create(req.body);
  res.status(201).json(plan);
});

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!plan) throw new ApiError(404, 'Plan not found');
  res.json(plan);
});

// 6. SaaS Analytics
export const getAnalytics = asyncHandler(async (_req, res) => {
  const [totalTenants, activeTenants, suspendedTenants, plans, totalUsers] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ status: 'active' }),
    Tenant.countDocuments({ status: 'suspended' }),
    SubscriptionPlan.find(),
    MasterUser.countDocuments({ tenantId: { $ne: null } })
  ]);

  res.json({
    totalTenants,
    activeTenants,
    suspendedTenants,
    totalUsers,
    revenuePlaceholder: activeTenants * 49, // Simulating SaaS recurring revenue
    plansCount: plans.length
  });
});
