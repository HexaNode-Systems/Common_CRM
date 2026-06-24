import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { createTask, getTask, listTaskActivities, listTasks, updateTask, updateTaskStatus } from '../controllers/task.controller.js';

const router = Router();

router.use(protect);
router.get('/', listTasks);
router.post('/', upload.array('attachments', 10), createTask);
router.get('/:id/activities', listTaskActivities);
router.get('/:id', getTask);
router.put('/:id', upload.array('attachments', 10), updateTask);
router.patch('/:id/status', updateTaskStatus);

export default router;
