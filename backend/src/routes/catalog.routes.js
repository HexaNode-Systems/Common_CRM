import { Router } from 'express';
import {
  checkProjectCapacity,
  createProject,
  getProject,
  listProjects,
  removeProject,
  updateProject,
  uploadProjectDocuments
} from '../controllers/project.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);
router.get('/capacity', authorize('catalog:read'), checkProjectCapacity);
router.get('/', authorize('catalog:read'), listProjects);
router.post('/', authorize('catalog:create'), createProject);
router.get('/:id', authorize('catalog:read'), getProject);
router.put('/:id', authorize('catalog:update'), updateProject);
router.delete('/:id', authorize('catalog:delete'), removeProject);
router.post('/:id/documents', authorize('uploads:create'), upload.array('documents', 10), uploadProjectDocuments);

export default router;
