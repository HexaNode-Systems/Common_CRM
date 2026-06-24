import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { createUser, getUser, listUsers, updateUser, updateUserStatus } from '../controllers/user.controller.js';

const router = Router();

router.use(protect);
router.get('/', authorize('users:read'), listUsers);
router.post('/', authorize('users:create'), createUser);
router.get('/:id', authorize('users:read'), getUser);
router.put('/:id', authorize('users:update'), updateUser);
router.patch('/:id/status', authorize('users:update'), updateUserStatus);

export default router;
