import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicketStatus,
  assignTicket,
  addTicketMessage,
  listSupportAgents
} from '../controllers/support.controller.js';

const router = Router();

router.use(protect);

// Staff = Full access on Support Desk. Everyone else works only on tickets they raised or
// that are assigned to them; the controller enforces that.
router.get('/agents', authorize('support:read'), listSupportAgents);
router.post('/', authorize('support:create'), createTicket);
router.get('/', authorize('support:read'), listTickets);
router.get('/:id', authorize('support:read'), getTicket);
router.patch('/:id/status', authorize('support:read'), updateTicketStatus);
router.patch('/:id/assign', authorize('support:update'), assignTicket);
router.post('/:id/messages', authorize('support:read'), addTicketMessage);

export default router;
