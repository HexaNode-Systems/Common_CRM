import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createWorkReport,
  listWorkReports,
  getWorkReport,
  deleteWorkReport
} from '../controllers/workReport.controller.js';

const router = Router();

router.use(protect);

router.post('/', createWorkReport);
router.get('/', listWorkReports);
router.get('/:id', getWorkReport);
router.delete('/:id', deleteWorkReport);

export default router;
