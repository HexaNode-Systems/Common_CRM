import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { getEmployeeAttendance, saveEmployeeAttendance } from '../controllers/attendance.controller.js';

const router = Router();

router.use(protect);

router.get('/', authorize('attendance:read'), getEmployeeAttendance);
router.post('/', authorize('attendance:update'), saveEmployeeAttendance);

export default router;
