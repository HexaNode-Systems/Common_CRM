import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/superAdmin.middleware.js';
import {
  createPlan,
  createTenant,
  endImpersonation,
  getAnalytics,
  impersonateTenant,
  listPlans,
  listTenants,
  updatePlan,
  updateTenantStatus,
  updateTenantSubscription
} from '../controllers/superAdmin.controller.js';

const router = Router();

// Secure all administration routes
router.use(protect);
router.use(requireSuperAdmin);

router.get('/tenants', listTenants);
router.post('/tenants', createTenant);
router.patch('/tenants/:id/status', updateTenantStatus);
router.patch('/tenants/:id/subscription', updateTenantSubscription);
router.post('/tenants/:id/impersonate', impersonateTenant);
router.post('/impersonations/:id/end', endImpersonation);

router.get('/plans', listPlans);
router.post('/plans', createPlan);
router.put('/plans/:id', updatePlan);

router.get('/analytics', getAnalytics);

export default router;
