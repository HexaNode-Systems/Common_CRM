import { Router } from 'express';
import {
  checkProjectCapacity,
  createProject,
  deleteProjectDocument,
  downloadProjectDocument,
  getProject,
  listAssignableUsers,
  listProjects,
  removeProject,
  updateProject,
  uploadProjectDocuments
} from '../controllers/project.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

router.use(protect);

// Helpers for the project form (need Projects "Update", not Users access)
router.get('/assignable-users', authorize('catalog:update'), listAssignableUsers);
router.get('/capacity', authorize('catalog:update'), checkProjectCapacity);

// List and view: everyone signed in, filtered to the projects they may see
// (all for Full Access on Projects, otherwise their team's and their own projects).
router.get('/', listProjects);
router.get('/:id', getProject);

router.post('/', authorize('catalog:create'), createProject);
router.put('/:id', authorize('catalog:update'), updateProject);
router.delete('/:id', authorize('catalog:delete'), removeProject);

// Documents are private: downloaded through the API by people who can see the project.
router.post('/:id/documents', authorize('catalog:update'), upload.array('documents', 10), uploadProjectDocuments);
router.get('/:id/documents/:filename', downloadProjectDocument);
router.delete('/:id/documents/:filename', authorize('catalog:update'), deleteProjectDocument);

export default router;
