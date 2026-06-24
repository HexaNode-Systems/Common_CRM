import { Router } from 'express';
import { dashboardReport } from '../controllers/report.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/dashboard', protect, authorize('reports:read'), dashboardReport);

export default router;

