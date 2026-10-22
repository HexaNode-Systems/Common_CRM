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
  legacyWebhookGone,
  getWebhookInfo,
  rotateWebhookToken,
  routeLeadAssignee,
  updateLeadStatus,
  updateLead,
  listDistributionRules,
  createDistributionRule,
  updateDistributionRule,
  deleteDistributionRule
} from '../controllers/lead.controller.js';

const router = Router();

// Public: IndiaMart / Justdial / Zoho / website forms. The secret key in the URL decides the company.
router.post('/webhook/:sourceProvider/:token', receiveLeadWebhook);
router.post('/webhook/:sourceProvider', legacyWebhookGone);

router.use(protect);

// "Full access" on Leads = manager: routing rules, webhook keys, reassigning and deleting leads.
const manager = authorize('leads:delete');

router.get('/webhook-info', manager, getWebhookInfo);
router.post('/webhook-info/rotate', manager, rotateWebhookToken);

router.get('/assignees', authorize('leads:read'), listLeadAssignees);

router.get('/distribution-rules', manager, listDistributionRules);
router.post('/distribution-rules', manager, createDistributionRule);
router.put('/distribution-rules/:id', manager, updateDistributionRule);
router.delete('/distribution-rules/:id', manager, deleteDistributionRule);

router.get('/', authorize('leads:read'), listLeads);
router.post('/', authorize('leads:create'), createLead);
router.post('/import', authorize('leads:create'), upload.single('file'), importLeadsCsv);
router.get('/:id', authorize('leads:read'), getLead);
router.put('/:id', authorize('leads:update'), updateLead);
router.patch('/:id/status', authorize('leads:update'), updateLeadStatus);
router.patch('/:id/assignee', manager, routeLeadAssignee);
router.post('/:id/notes', authorize('leads:update'), addLeadNote);
router.delete('/:id', manager, deleteLead);

export default router;
