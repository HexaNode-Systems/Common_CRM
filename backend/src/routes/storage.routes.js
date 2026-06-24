import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { archiveStorageDocument, downloadStorageDocument, issueStorageDownload, listStorageDocuments, listStorageLookup, uploadStorageDocument, updateStorageDocument } from '../controllers/storage.controller.js';

const router = Router();

router.use(protect);
router.get('/lookup', authorize('storage:read'), listStorageLookup);
router.get('/', authorize('storage:read'), listStorageDocuments);
router.post('/', authorize('storage:create'), upload.single('file'), uploadStorageDocument);
router.get('/:id/download-link', authorize('storage:read'), issueStorageDownload);
router.get('/:id/download', authorize('storage:read'), downloadStorageDocument);
router.put('/:id', authorize('storage:update'), upload.single('file'), updateStorageDocument);
router.patch('/:id/archive', authorize('storage:delete'), archiveStorageDocument);

export default router;
