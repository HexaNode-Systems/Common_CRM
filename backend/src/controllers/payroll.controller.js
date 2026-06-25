import { Payroll } from '../models/Payroll.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function getDaysInMonth(monthYearStr) {
  const [year, month] = monthYearStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function calculateTenure(joiningDate, monthYearStr) {
  if (!joiningDate) return '-';
  const join = new Date(joiningDate);
  const [year, month] = monthYearStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, 1);

  let diffMonths = (targetDate.getFullYear() - join.getFullYear()) * 12 + (targetDate.getMonth() - join.getMonth());
  if (diffMonths < 0) diffMonths = 0;

  const years = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;

  if (years > 0) {
    return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
  }
  return `${remainingMonths} mo${remainingMonths !== 1 ? 's' : ''}`;
}

async function getAttendanceStats(employeeId, monthYearStr) {
  const [year, month] = monthYearStr.split('-').map(Number);
  const totalDays = getDaysInMonth(monthYearStr);
  const start = new Date(`${monthYearStr}-01T00:00:00.000Z`);
  const end = new Date(`${monthYearStr}-${totalDays}T23:59:59.999Z`);

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: end }
  });

  let presentDays = 0;
  let absentDays = 0;
  let approvedLeaves = 0;

  for (const record of records) {
    if (record.status === 'Absent (Unpaid)') {
      absentDays += 1;
    } else if (record.status === 'Approved Paid Leave') {
      approvedLeaves += 1;
    } else {
      presentDays += 1;
    }
  }

  return {
    presentDays,
    absentDays,
    approvedLeaves,
    totalWorkingDays: totalDays
  };
}

export const getPayrollList = asyncHandler(async (req, res) => {
  const { monthYear } = req.query;
  if (!monthYear) throw new ApiError(400, 'Month-Year (YYYY-MM) is required.');

  // Find all active employees who are not customers or super admin
  const employees = await User.find({
    isActive: true,
    role: { $nin: ['customer', 'super_admin'] }
  }).select('name email role joiningDate employmentClassification baseSalary monthlyLeaveQuota');

  const payrolls = await Payroll.find({ monthYear });
  const payrollMap = new Map(payrolls.map(p => [String(p.employee), p]));

  const items = [];
  for (const emp of employees) {
    const stats = await getAttendanceStats(emp._id, monthYear);
    const tenure = calculateTenure(emp.joiningDate, monthYear);

    const existing = payrollMap.get(String(emp._id));
    if (existing) {
      items.push({
        ...existing.toObject(),
        employee: emp,
        tenure,
        attendanceStats: stats
      });
    } else {
      // Create transient draft
      const baseSalary = emp.baseSalary || 0;
      const leaveQuota = emp.monthlyLeaveQuota ?? 2;
      const excessLeaves = Math.max(0, stats.approvedLeaves - leaveQuota);
      const totalDeductionDays = stats.absentDays + excessLeaves;

      const perDaySalary = baseSalary / stats.totalWorkingDays;
      const leaveDeductions = Math.round(totalDeductionDays * perDaySalary * 100) / 100;
      const netPayable = Math.max(0, baseSalary - leaveDeductions);

      items.push({
        employee: emp,
        monthYear,
        baseSalary,
        leaveDeductions,
        rebate: 0,
        rebateComment: '',
        manualDeduction: 0,
        manualDeductionComment: '',
        netPayable,
        status: 'Draft',
        tenure,
        attendanceStats: stats
      });
    }
  }

  res.json({ items });
});

export const savePayrollRecord = asyncHandler(async (req, res) => {
  const {
    employeeId,
    monthYear,
    baseSalary,
    leaveDeductions,
    rebate,
    rebateComment,
    manualDeduction,
    manualDeductionComment,
    status
  } = req.body;

  if (!employeeId || !monthYear) {
    throw new ApiError(400, 'Employee ID and Month-Year are required.');
  }

  // Freeze state check
  const existing = await Payroll.findOne({ employee: employeeId, monthYear });
  if (existing && existing.status === 'Paid') {
    throw new ApiError(400, 'This salary cycle is already paid and locked.');
  }

  const cleanBase = Number(baseSalary || 0);
  const cleanLeaves = Number(leaveDeductions || 0);
  const cleanRebate = Number(rebate || 0);
  const cleanManual = Number(manualDeduction || 0);
  const netPayable = Math.max(0, cleanBase - cleanLeaves + cleanRebate - cleanManual);

  const updated = await Payroll.findOneAndUpdate(
    { employee: employeeId, monthYear },
    {
      baseSalary: cleanBase,
      leaveDeductions: cleanLeaves,
      rebate: cleanRebate,
      rebateComment: rebateComment || '',
      manualDeduction: cleanManual,
      manualDeductionComment: manualDeductionComment || '',
      netPayable,
      status: status || 'Draft'
    },
    { upsert: true, new: true }
  );

  res.json(updated);
});

export const freezePayrollRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payroll = await Payroll.findById(id);
  if (!payroll) throw new ApiError(404, 'Payroll record not found');

  if (payroll.status === 'Paid') {
    throw new ApiError(400, 'This payroll is already frozen.');
  }

  payroll.status = 'Paid';
  await payroll.save();
  res.json(payroll);
});
