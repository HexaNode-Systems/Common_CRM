import { Router } from 'express';
import { uploadImage } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Any signed-in user can upload an image (profile photo, logo). There is no "uploads" permission module.
router.post('/image', protect, upload.single('image'), uploadImage);

export default router;

