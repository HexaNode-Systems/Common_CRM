import { Router } from 'express';
import { login, me, register, updateProfile } from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { uploadImage } from '../controllers/upload.controller.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/login', login);
router.post('/register', protect, authorize('users:create'), register);
router.get('/me', protect, me);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, upload.single('image'), uploadImage);

export default router;

