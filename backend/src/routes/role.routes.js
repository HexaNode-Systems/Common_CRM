import { Router } from 'express';
import { createRole, listRoles, updateRolePermissions, updateRoleStatus } from '../controllers/role.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);
router.get('/', authorize('roles:read'), listRoles);
router.post('/', authorize('roles:update'), createRole);
router.patch('/:id/status', authorize('roles:update'), updateRoleStatus);
router.patch('/:id/permissions', authorize('roles:update'), updateRolePermissions);

export default router;

