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
router.get('/status', authorize('whatsapp:read'), getStatus);
router.post('/connect', authorize('whatsapp:update'), connect); 
router.post('/disconnect', authorize('whatsapp:update'), disconnect);
router.post('/test', authorize('whatsapp:update'), sendTestMessage);

// Chats and messaging
router.get('/chats', authorize('whatsapp:read'), listChats);
router.get('/chats/:chatId/messages', authorize('whatsapp:read'), getMessages);
router.post('/chats/:chatId/read', authorize('whatsapp:update'), markChatAsRead);
router.post('/send', upload.single('file'), authorize('whatsapp:update'), sendMessage);

export default router;
