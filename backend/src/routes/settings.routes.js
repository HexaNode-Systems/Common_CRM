import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getSettings);
router.put('/', protect, authorize('settings:update'), updateSettings);

export default router;

