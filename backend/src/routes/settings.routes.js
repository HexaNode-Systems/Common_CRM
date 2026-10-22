import { Router } from 'express';
import { getIntegrationSettings, getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public: branding/theme/contact only (no integration keys).
router.get('/', getSettings);
// Integration settings (secrets masked) for people with Settings access.
router.get('/integrations', protect, authorize('settings:read'), getIntegrationSettings);
router.put('/', protect, authorize('settings:update'), updateSettings);

export default router;
