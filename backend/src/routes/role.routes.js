import { Router } from 'express';
import {
  createRole,
  listRoles,
  updateRole,
  deleteRole,
  getRolePermissions,
  updateRolePermissions,
  updateRoleStatus
} from '../controllers/role.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/', authorize('roles:read'), listRoles);
router.post('/', authorize('roles:update'), createRole);
router.put('/:id', authorize('roles:update'), updateRole);
router.delete('/:id', authorize('roles:update'), deleteRole);

router.get('/:id/permissions', authorize('roles:read'), getRolePermissions);
router.put('/:id/permissions', authorize('roles:update'), updateRolePermissions);

// Keep PATCH methods for backward compatibility
router.patch('/:id/permissions', authorize('roles:update'), updateRolePermissions);
router.patch('/:id/status', authorize('roles:update'), updateRoleStatus);

export default router;
