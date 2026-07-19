import { Router } from 'express';
import { listModules } from '../controllers/role.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);
router.get('/', listModules);

export default router;
