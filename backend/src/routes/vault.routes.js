import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  createVaultCredential,
  deleteVaultCredential,
  getVaultCredential,
  listVaultAudit,
  listVaultCredentials,
  listVaultRoles,
  revealVaultCredential,
  updateVaultCredential,
  updateVaultStatus
} from '../controllers/vault.controller.js';

const router = Router();

router.use(protect);
// Full access on Vault = manager (access rules, delete, history).
const manager = authorize('vault:delete');

router.get('/roles', authorize('vault:read'), listVaultRoles);
router.get('/audit', manager, listVaultAudit);
router.get('/', authorize('vault:read'), listVaultCredentials);
router.post('/', authorize('vault:create'), createVaultCredential);
router.get('/:id', authorize('vault:read'), getVaultCredential);
router.put('/:id', authorize('vault:update'), updateVaultCredential);
router.patch('/:id/status', authorize('vault:update'), updateVaultStatus);
// View access may reveal passwords of credentials their role is allowed to see (logged).
router.post('/:id/reveal', authorize('vault:read'), revealVaultCredential);
router.delete('/:id', manager, deleteVaultCredential);

export default router;
