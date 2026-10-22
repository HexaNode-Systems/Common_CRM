import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { withUpload } from '../middleware/upload.middleware.js';
import {
  archiveStorageDocument,
  deleteStorageDocument,
  downloadStorageDocument,
  listStorageDocuments,
  listStorageLookup,
  restoreStorageDocument,
  uploadStorageDocument,
  updateStorageDocument
} from '../controllers/storage.controller.js';

const router = Router();
const oneFile = withUpload(25, (m) => m.single('file'));

router.use(protect);
// Full access on Storage = manager: privacy tiers, archive, restore, permanent delete.
const manager = authorize('storage:delete');

router.get('/lookup', authorize('storage:read'), listStorageLookup);
router.get('/', authorize('storage:read'), listStorageDocuments);
router.post('/', authorize('storage:create'), oneFile, uploadStorageDocument);
router.get('/:id/download', authorize('storage:read'), downloadStorageDocument);
router.put('/:id', authorize('storage:update'), oneFile, updateStorageDocument);
router.patch('/:id/archive', manager, archiveStorageDocument);
router.patch('/:id/restore', manager, restoreStorageDocument);
router.delete('/:id', manager, deleteStorageDocument);

export default router;
