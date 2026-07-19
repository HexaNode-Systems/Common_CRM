import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createTicket,
  listTickets,
  getTicket,
  updateTicketStatus,
  assignTicket,
  addTicketMessage
} from '../controllers/support.controller.js';

const router = Router();

router.use(protect);

router.post('/', authorize('support:create'), createTicket);
router.get('/', authorize('support:read'), listTickets);
router.get('/:id', authorize('support:read'), getTicket);
router.patch('/:id/status', authorize('support:update'), updateTicketStatus);
router.patch('/:id/assign', authorize('support:update'), assignTicket);
router.post('/:id/messages', authorize('support:update'), addTicketMessage);

export default router;
