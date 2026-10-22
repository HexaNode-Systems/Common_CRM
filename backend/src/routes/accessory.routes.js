import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createAccessory,
  getAccessory,
  listAccessories,
  listAssignees,
  removeAccessory,
  updateAccessory
} from '../controllers/accessory.controller.js';

const router = Router();

router.use(protect);
router.get('/', authorize('accessories:read'), listAccessories);
router.get('/assignees', authorize('accessories:read'), listAssignees);
router.post('/', authorize('accessories:create'), createAccessory);
router.get('/:id', authorize('accessories:read'), getAccessory);
router.put('/:id', authorize('accessories:update'), updateAccessory);
router.delete('/:id', authorize('accessories:delete'), removeAccessory);

export default router;
