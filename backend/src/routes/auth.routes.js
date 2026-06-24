import { Router } from 'express';
import { login, me, register } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', protect, authorize('users:create'), register);
router.get('/me', protect, me);

export default router;

