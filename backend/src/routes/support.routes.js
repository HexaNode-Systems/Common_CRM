import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
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

router.post('/', createTicket);
router.get('/', listTickets);
router.get('/:id', getTicket);
router.patch('/:id/status', updateTicketStatus);
router.patch('/:id/assign', assignTicket);
router.post('/:id/messages', addTicketMessage);

export default router;
