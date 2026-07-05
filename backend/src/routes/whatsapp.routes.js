import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { 
  getStatus, 
  connect, 
  disconnect, 
  sendTestMessage,
  listChats,
  getMessages,
  sendMessage,
  markChatAsRead
} from '../controllers/whatsapp.controller.js';

const router = Router();

router.use(protect);

// Status & administration
router.get('/status', getStatus);
router.post('/connect', connect); // Relax role restrictions so counselors/sales executives can trigger connect if disconnected
router.post('/disconnect', authorize('settings:update'), disconnect);
router.post('/test', authorize('settings:update'), sendTestMessage);

// Chats and messaging
router.get('/chats', listChats);
router.get('/chats/:chatId/messages', getMessages);
router.post('/chats/:chatId/read', markChatAsRead);
router.post('/send', upload.single('file'), sendMessage);

export default router;
