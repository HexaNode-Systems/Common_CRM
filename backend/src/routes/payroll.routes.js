import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getPayrollList, savePayrollRecord, freezePayrollRecord } from '../controllers/payroll.controller.js';

const router = Router();

router.use(protect);

// Salary data has its own permission ("Payroll & Salary" in Roles & Permissions), separate from Users.
router.get('/', authorize('payroll:read'), getPayrollList);
router.post('/', authorize('payroll:update'), savePayrollRecord);
router.patch('/:id/pay', authorize('payroll:update'), freezePayrollRecord);

export default router;
