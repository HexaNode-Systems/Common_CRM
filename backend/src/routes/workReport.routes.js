import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createWorkReport,
  listWorkReports,
  getWorkReport,
  deleteWorkReport
} from '../controllers/workReport.controller.js';

const router = Router();

router.use(protect);

router.post('/', authorize('reports:create'), createWorkReport);
router.get('/', authorize('reports:read'), listWorkReports);
router.get('/:id', authorize('reports:read'), getWorkReport);
router.delete('/:id', authorize('reports:delete'), deleteWorkReport);

export default router;
