import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getPayrollList, savePayrollRecord, freezePayrollRecord } from '../controllers/payroll.controller.js';
import { ApiError } from '../utils/apiError.js';

const router = Router();

const hrOnly = (req, res, next) => {
  const role = req.user.role?.toLowerCase();
  if (role === 'super_admin' || role === 'hr_manager') {
    return next();
  }
  throw new ApiError(403, 'Access Denied: Only supervisors and HR managers have access to this resource.');
};

router.use(protect);
router.use(hrOnly);

router.get('/', getPayrollList);
router.post('/', savePayrollRecord);
router.patch('/:id/pay', freezePayrollRecord);

export default router;
