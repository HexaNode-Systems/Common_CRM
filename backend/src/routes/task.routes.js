import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { withUpload } from '../middleware/upload.middleware.js';
import {
  createTask,
  deleteTask,
  deleteTaskAttachment,
  downloadTaskAttachment,
  getTask,
  listTaskActivities,
  listTaskAssignees,
  listTasks,
  updateTask,
  updateTaskStatus
} from '../controllers/task.controller.js';

const router = Router();
const attachments = withUpload(10, (m) => m.array('attachments', 10));

router.use(protect);
router.get('/', authorize('tasks:read'), listTasks);
router.get('/assignees', authorize('tasks:read'), listTaskAssignees);
router.post('/', authorize('tasks:create'), attachments, createTask);
router.get('/:id/activities', authorize('tasks:read'), listTaskActivities);
router.get('/:id/attachments/:filename', authorize('tasks:read'), downloadTaskAttachment);
router.delete('/:id/attachments/:filename', authorize('tasks:update'), deleteTaskAttachment);
router.get('/:id', authorize('tasks:read'), getTask);
router.put('/:id', authorize('tasks:update'), attachments, updateTask);
// The assignee may move their own task even with View access; the controller checks that.
router.patch('/:id/status', authorize('tasks:read'), updateTaskStatus);
router.delete('/:id', authorize('tasks:update'), deleteTask);

export default router;
