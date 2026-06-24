import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/image', protect, authorize('uploads:create'), upload.single('image'), uploadImage);

export default router;

