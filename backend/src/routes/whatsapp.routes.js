import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getStatus, connect, disconnect, sendTestMessage } from '../controllers/whatsapp.controller.js';

const router = Router();

router.use(protect);

router.get('/status', getStatus);
router.post('/connect', authorize('settings:update'), connect);
router.post('/disconnect', authorize('settings:update'), disconnect);
router.post('/test', authorize('settings:update'), sendTestMessage);

export default router;
