import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { createTask, getTask, listTaskActivities, listTasks, updateTask, updateTaskStatus } from '../controllers/task.controller.js';

const router = Router();

router.use(protect);
router.get('/', authorize('tasks:read'), listTasks);
router.post('/', authorize('tasks:create'), upload.array('attachments', 10), createTask);
router.get('/:id/activities', authorize('tasks:read'), listTaskActivities);
router.get('/:id', authorize('tasks:read'), getTask);
router.put('/:id', authorize('tasks:update'), upload.array('attachments', 10), updateTask);
router.patch('/:id/status', authorize('tasks:update'), updateTaskStatus);

export default router;
