import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import {
  addLeadNote,
  createLead,
  deleteLead,
  getLead,
  importLeadsCsv,
  listLeadAssignees,
  listLeads,
  receiveLeadWebhook,
  routeLeadAssignee,
  updateLeadStatus,
  updateLead,
  listDistributionRules,
  createDistributionRule,
  updateDistributionRule,
  deleteDistributionRule
} from '../controllers/lead.controller.js';

const router = Router();

router.post('/webhook/:sourceProvider', receiveLeadWebhook);

router.use(protect);
router.get('/assignees', authorize('leads:read'), listLeadAssignees);

// Lead distribution rules CRUD
router.get('/distribution-rules', listDistributionRules);
router.post('/distribution-rules', createDistributionRule);
router.put('/distribution-rules/:id', updateDistributionRule);
router.delete('/distribution-rules/:id', deleteDistributionRule);

router.get('/', authorize('leads:read'), listLeads);
router.post('/', authorize('leads:create'), createLead);
router.post('/import', authorize('leads:create'), upload.single('file'), importLeadsCsv);
router.get('/:id', authorize('leads:read'), getLead);
router.put('/:id', authorize('leads:update'), updateLead);
router.patch('/:id/status', authorize('leads:update'), updateLeadStatus);
router.patch('/:id/assignee', authorize('leads:update'), routeLeadAssignee);
router.post('/:id/notes', authorize('leads:update'), addLeadNote);
router.delete('/:id', deleteLead);

export default router;