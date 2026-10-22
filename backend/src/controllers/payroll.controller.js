import { Payroll } from '../models/Payroll.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  computePayroll,
  joinedBy,
  netPayable,
  parseAmount,
  parseComment,
  parseMonthYear,
} from '../utils/payrollCalc.js';

const EMPLOYEE_FIELDS = 'name email role isActive joiningDate employmentClassification baseSalary monthlyLeaveQuota';
const NON_EMPLOYEE_ROLES = ['customer', 'super_admin'];

function calculateTenure(joiningDate, monthYear) {
  if (!joiningDate) return '-';
  const join = new Date(joiningDate);
  const { year, month } = parseMonthYear(monthYear);
  let diffMonths = (year - join.getUTCFullYear()) * 12 + (month - 1 - join.getUTCMonth());
  if (diffMonths < 0) diffMonths = 0;
  const years = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;
  if (years > 0) {
    return `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
  }
  return `${remainingMonths} mo${remainingMonths !== 1 ? 's' : ''}`;
}

async function loadAttendance(employeeIds, monthYear) {
  const { start, end } = parseMonthYear(monthYear);
  const records = await Attendance.find({ employee: { $in: employeeIds }, date: { $gte: start, $lte: end } }).lean();
  const byEmployee = new Map();
  for (const record of records) {
    const key = String(record.employee);
    if (!byEmployee.has(key)) byEmployee.set(key, []);
    byEmployee.get(key).push(record);
  }
  return byEmployee;
}

async function loadEmployee(employeeId) {
  const employee = await User.findById(employeeId).select(EMPLOYEE_FIELDS);
  if (!employee || NON_EMPLOYEE_ROLES.includes(employee.role)) throw new ApiError(404, 'Employee not found.');
  return employee;
}

// Fresh salary figures for one employee and month, always from the server's own data.
async function calculateFor(employee, monthYear) {
  const attendance = await loadAttendance([employee._id], monthYear);
  return computePayroll({ employee, monthYear, records: attendance.get(String(employee._id)) || [] });
}

export const getPayrollList = asyncHandler(async (req, res) => {
  const { monthYear } = req.query;
  parseMonthYear(monthYear);

  const payrolls = await Payroll.find({ monthYear }).lean();
  const payrollMap = new Map(payrolls.map((p) => [String(p.employee), p]));

  // Active employees, plus anyone (including people who have since left) with a saved
  // payroll record for this month, so past paid months stay visible.
  const employees = await User.find({
    role: { $nin: NON_EMPLOYEE_ROLES },
    $or: [{ isActive: true }, { _id: { $in: payrolls.map((p) => p.employee) } }],
  })
    .select(EMPLOYEE_FIELDS)
    .lean();

  const eligible = employees.filter((emp) => payrollMap.has(String(emp._id)) || joinedBy(emp, monthYear));
  const attendance = await loadAttendance(eligible.map((emp) => emp._id), monthYear);

  const items = eligible.map((emp) => {
    const calc = computePayroll({ employee: emp, monthYear, records: attendance.get(String(emp._id)) || [] });
    const existing = payrollMap.get(String(emp._id));
    const base = { employee: emp, monthYear, tenure: calculateTenure(emp.joiningDate, monthYear), attendanceStats: calc.stats };

    // Paid months are frozen: show exactly what was paid.
    if (existing?.status === 'Paid') return { ...existing, ...base };

    // Drafts (saved or not) are always recalculated from current salary and attendance,
    // keeping only the HR-entered rebate and manual deduction.
    const rebate = existing?.rebate || 0;
    const manualDeduction = existing?.manualDeduction || 0;
    return {
      ...(existing || {}),
      ...base,
      baseSalary: calc.baseSalary,
      leaveDeductions: calc.leaveDeductions,
      rebate,
      rebateComment: existing?.rebateComment || '',
      manualDeduction,
      manualDeductionComment: existing?.manualDeductionComment || '',
      netPayable: netPayable({ baseSalary: calc.baseSalary, leaveDeductions: calc.leaveDeductions, rebate, manualDeduction }),
      status: 'Draft',
    };
  });

  res.json({ items });
});

// Saves a draft. Only the rebate, manual deduction and their comments come from the request;
// base salary and attendance deductions are always calculated on the server.
export const savePayrollRecord = asyncHandler(async (req, res) => {
  const { employeeId, monthYear } = req.body;
  if (!employeeId) throw new ApiError(400, 'Employee ID is required.');
  parseMonthYear(monthYear);

  const rebate = parseAmount(req.body.rebate, 'Rebate');
  const manualDeduction = parseAmount(req.body.manualDeduction, 'Manual deduction');

  const employee = await loadEmployee(employeeId);
  if (!joinedBy(employee, monthYear)) throw new ApiError(400, 'This employee had not joined yet in that month.');

  const calc = await calculateFor(employee, monthYear);

  try {
    const updated = await Payroll.findOneAndUpdate(
      { employee: employee._id, monthYear, status: { $ne: 'Paid' } },
      {
        baseSalary: calc.baseSalary,
        leaveDeductions: calc.leaveDeductions,
        rebate,
        rebateComment: parseComment(req.body.rebateComment),
        manualDeduction,
        manualDeductionComment: parseComment(req.body.manualDeductionComment),
        netPayable: netPayable({ baseSalary: calc.baseSalary, leaveDeductions: calc.leaveDeductions, rebate, manualDeduction }),
        status: 'Draft',
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(updated);
  } catch (err) {
    // A Paid record exists: the filter didn't match, so the upsert hit the unique index.
    if (err?.code === 11000) throw new ApiError(400, 'This salary cycle is already paid and locked.');
    throw err;
  }
});

// Marks a draft as paid. Recalculates from the latest salary and attendance first, so what is
// frozen is always current. Unmarked attendance days need { acknowledgeUnmarked: true }.
export const freezePayrollRecord = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findById(req.params.id);
  if (!payroll) throw new ApiError(404, 'Payroll record not found');
  if (payroll.status === 'Paid') throw new ApiError(400, 'This payroll is already frozen.');

  const employee = await loadEmployee(payroll.employee);
  const calc = await calculateFor(employee, payroll.monthYear);

  if (calc.stats.unmarkedDays > 0 && req.body?.acknowledgeUnmarked !== true) {
    return res.status(409).json({
      message: `${calc.stats.unmarkedDays} working day(s) have no attendance marked. They will be paid as present days.`,
      code: 'UNMARKED_ATTENDANCE',
      unmarkedDays: calc.stats.unmarkedDays,
    });
  }

  const paid = await Payroll.findOneAndUpdate(
    { _id: payroll._id, status: 'Draft' },
    {
      baseSalary: calc.baseSalary,
      leaveDeductions: calc.leaveDeductions,
      netPayable: netPayable({
        baseSalary: calc.baseSalary,
        leaveDeductions: calc.leaveDeductions,
        rebate: payroll.rebate,
        manualDeduction: payroll.manualDeduction,
      }),
      status: 'Paid',
      paidAt: new Date(),
      paidBy: req.user?._id,
      unmarkedDaysAtPayment: calc.stats.unmarkedDays,
    },
    { new: true }
  );
  if (!paid) throw new ApiError(400, 'This payroll is already frozen.');
  res.json(paid);
});
