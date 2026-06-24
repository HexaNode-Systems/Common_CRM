import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { createVaultCredential, getVaultCredential, listVaultCredentials, listVaultRoles, revealVaultCredential, updateVaultCredential, updateVaultStatus } from '../controllers/vault.controller.js';

const router = Router();

router.use(protect);
router.get('/roles', authorize('vault:read'), listVaultRoles);
router.get('/', authorize('vault:read'), listVaultCredentials);
router.post('/', authorize('vault:create'), createVaultCredential);
router.get('/:id', authorize('vault:read'), getVaultCredential);
router.put('/:id', authorize('vault:update'), updateVaultCredential);
router.patch('/:id/status', authorize('vault:update'), updateVaultStatus);
router.post('/:id/reveal', authorize('vault:read'), revealVaultCredential);

export default router;
