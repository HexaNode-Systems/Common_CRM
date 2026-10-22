import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createWorkReport,
  listWorkReports,
  getWorkReport,
  updateWorkReport,
  deleteWorkReport,
  listReportTeam
} from '../controllers/workReport.controller.js';

const router = Router();

router.use(protect);

// Anyone with Reports access files and edits their own daily report.
// Full access on Reports = supervisor (everyone's reports, delete). Checked in the controller.
router.get('/team', authorize('reports:read'), listReportTeam);
router.post('/', authorize('reports:read'), createWorkReport);
router.get('/', authorize('reports:read'), listWorkReports);
router.get('/:id', authorize('reports:read'), getWorkReport);
router.put('/:id', authorize('reports:read'), updateWorkReport);
router.delete('/:id', authorize('reports:delete'), deleteWorkReport);

export default router;
