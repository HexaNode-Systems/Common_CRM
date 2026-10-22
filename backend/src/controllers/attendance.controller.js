import { Attendance } from '../models/Attendance.js';
import { Payroll } from '../models/Payroll.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  ATTENDANCE_STATUSES,
  WEEKLY_OFF_DAYS,
  computePayroll,
  isWeeklyOff,
  parseMonthYear,
  todayKey,
} from '../utils/payrollCalc.js';

const NON_EMPLOYEE_ROLES = ['customer', 'super_admin'];

async function loadEmployee(employeeId) {
  if (!employeeId) throw new ApiError(400, 'Employee ID is required.');
  const employee = await User.findById(employeeId).select('name role joiningDate baseSalary monthlyLeaveQuota');
  if (!employee || NON_EMPLOYEE_ROLES.includes(employee.role)) throw new ApiError(404, 'Employee not found.');
  return employee;
}

// Returns every day of the month with its saved status (or null when not marked), plus whether
// it is a weekly off, in the future, or before the employee joined. The page renders from this.
export const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId, monthYear } = req.query;
  const { start, end } = parseMonthYear(monthYear);
  const employee = await loadEmployee(employeeId);

  const records = await Attendance.find({ employee: employee._id, date: { $gte: start, $lte: end } }).sort({ date: 1 });
  const calc = computePayroll({ employee, monthYear, records });

  res.json({
    items: records,
    days: calc.days,
    stats: calc.stats,
    weeklyOffDays: WEEKLY_OFF_DAYS,
    today: todayKey(),
  });
});

export const saveEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId, monthYear, records } = req.body;
  const { year, month } = parseMonthYear(monthYear);
  if (!Array.isArray(records)) throw new ApiError(400, 'Attendance records are required.');
  const employee = await loadEmployee(employeeId);

  const payroll = await Payroll.findOne({ employee: employee._id, monthYear });
  if (payroll && payroll.status === 'Paid') {
    throw new ApiError(400, "This month's payroll is already paid and frozen. Attendance editing is locked.");
  }

  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const today = todayKey();
  const joinKey = employee.joiningDate ? new Date(employee.joiningDate).toISOString().slice(0, 10) : null;
  const operations = [];

  for (const item of records) {
    const key = String(item?.date || '').slice(0, 10);

    // Every date must belong to the month being edited, so a paid month can't be changed
    // through another month's request.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !key.startsWith(prefix) || Number.isNaN(Date.parse(`${key}T00:00:00Z`))) {
      throw new ApiError(400, `Date ${key || '(empty)'} is not in ${monthYear}.`);
    }
    if (!ATTENDANCE_STATUSES.includes(item.status)) {
      throw new ApiError(400, `"${item.status}" is not a valid attendance status.`);
    }
    if (key > today && item.status !== 'Holiday' && item.status !== 'Weekly Off') {
      throw new ApiError(400, `${key} is in the future. Only holidays can be marked ahead.`);
    }
    if (joinKey && key < joinKey) {
      throw new ApiError(400, `${key} is before the employee's joining date.`);
    }
    if (isWeeklyOff(key) && (item.status === 'Absent (Unpaid)' || item.status === 'Approved Paid Leave')) {
      throw new ApiError(400, `${key} is a weekly off and can't be marked as absent or leave.`);
    }
    if (item.status === 'Weekly Off' && !isWeeklyOff(key)) {
      throw new ApiError(400, `${key} is not a weekly off day.`);
    }

    operations.push({
      updateOne: {
        filter: { employee: employee._id, date: new Date(`${key}T00:00:00.000Z`) },
        update: { $set: { status: item.status } },
        upsert: true,
      },
    });
  }

  if (operations.length) await Attendance.bulkWrite(operations);
  res.json({ message: 'Attendance records updated successfully.', saved: operations.length });
});
