import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getPayrollList, savePayrollRecord, freezePayrollRecord } from '../controllers/payroll.controller.js';

const router = Router();

router.use(protect);

router.get('/', authorize('users:read'), getPayrollList);
router.post('/', authorize('users:update'), savePayrollRecord);
router.patch('/:id/pay', authorize('users:update'), freezePayrollRecord);

export default router;
