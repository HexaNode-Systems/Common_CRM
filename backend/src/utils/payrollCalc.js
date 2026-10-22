// Payroll and attendance rules, in one place, used by both the payroll and attendance controllers.
//
// - Weekly offs (default Sunday; set PAYROLL_WEEKLY_OFFS="0,6" for Sat+Sun) and days marked
//   "Holiday" are paid days off: they are not working days and can't be marked absent.
// - Salary per day = base salary / working days in the month.
// - Deductions = absent days + paid leave beyond the monthly quota + working days before joining.
// - Working days with no attendance record are reported as "unmarked". Paying a month with
//   unmarked days needs an explicit confirmation (they are then paid as present).
import { ApiError } from './apiError.js';

export const ATTENDANCE_STATUSES = ['Present', 'Absent (Unpaid)', 'Approved Paid Leave', 'Holiday', 'Weekly Off'];
export const WORKED_STATUSES = new Set(['Present']);

const DEFAULT_LEAVE_QUOTA = 2;
const TIME_ZONE = process.env.PAYROLL_TZ || 'Asia/Kolkata';

export const WEEKLY_OFF_DAYS = (process.env.PAYROLL_WEEKLY_OFFS ?? '0')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value !== '')
  .map(Number)
  .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

const round2 = (value) => Math.round(value * 100) / 100;

// "YYYY-MM" -> { year, month, days, start, end }. Throws 400 for anything else.
export function parseMonthYear(monthYear) {
  if (typeof monthYear !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthYear)) {
    throw new ApiError(400, 'Month must be in YYYY-MM format.');
  }
  const [year, month] = monthYear.split('-').map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    year,
    month,
    days,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month - 1, days, 23, 59, 59, 999)),
  };
}

// Today's date as YYYY-MM-DD in the business time zone (India by default).
export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const dateKey = (date) => new Date(date).toISOString().slice(0, 10);

export function isWeeklyOff(key) {
  return WEEKLY_OFF_DAYS.includes(new Date(`${key}T00:00:00Z`).getUTCDay());
}

export function parseLeaveQuota(value) {
  if (value === undefined || value === null || value === '') return DEFAULT_LEAVE_QUOTA;
  const quota = Number(value);
  if (!Number.isFinite(quota) || quota < 0 || quota > 31) {
    throw new ApiError(400, 'Monthly leave quota must be a number between 0 and 31.');
  }
  return Math.floor(quota);
}

// True if the employee has joined on or before the last day of the month (or has no joining date).
export function joinedBy(employee, monthYear) {
  if (!employee.joiningDate) return true;
  const { year, month, days } = parseMonthYear(monthYear);
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(days).padStart(2, '0')}`;
  return dateKey(employee.joiningDate) <= lastDay;
}

// Day-by-day view of a month for one employee, plus the salary figures for it.
export function computePayroll({ employee, monthYear, records = [] }) {
  const { year, month, days } = parseMonthYear(monthYear);
  const today = todayKey();
  const joinKey = employee.joiningDate ? dateKey(employee.joiningDate) : null;
  const byDay = new Map(records.map((record) => [dateKey(record.date), record.status]));

  const stats = {
    workingDays: 0,
    presentDays: 0,
    absentDays: 0,
    approvedLeaves: 0,
    holidays: 0,
    weeklyOffs: 0,
    notJoinedDays: 0,
    unmarkedDays: 0,
    futureDays: 0,
  };
  const dayList = [];

  for (let d = 1; d <= days; d += 1) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const weeklyOff = isWeeklyOff(key);
    const beforeJoining = Boolean(joinKey && key < joinKey);
    const isFuture = key > today;
    const status = byDay.get(key) || null;

    const isHoliday = status === 'Holiday';
    const isOff = isHoliday || (weeklyOff && (status === null || status === 'Weekly Off'));

    if (isOff) {
      if (isHoliday) stats.holidays += 1;
      else stats.weeklyOffs += 1;
    } else {
      stats.workingDays += 1;
      if (beforeJoining) stats.notJoinedDays += 1;
      else if (status === 'Absent (Unpaid)') stats.absentDays += 1;
      else if (status === 'Approved Paid Leave') stats.approvedLeaves += 1;
      else if (status === 'Present') stats.presentDays += 1;
      else {
        stats.unmarkedDays += 1;
        if (isFuture) stats.futureDays += 1;
      }
    }

    dayList.push({ date: key, status, weeklyOff, beforeJoining, isFuture });
  }

  const baseSalary = Math.max(0, Number(employee.baseSalary) || 0);
  const leaveQuota = parseLeaveQuota(employee.monthlyLeaveQuota);
  const excessLeaves = Math.max(0, stats.approvedLeaves - leaveQuota);
  const deductionDays = stats.absentDays + excessLeaves + stats.notJoinedDays;
  const perDaySalary = stats.workingDays > 0 ? baseSalary / stats.workingDays : 0;
  const leaveDeductions = Math.min(baseSalary, round2(deductionDays * perDaySalary));

  return {
    days: dayList,
    stats: { ...stats, leaveQuota, excessLeaves, deductionDays, perDaySalary: round2(perDaySalary) },
    baseSalary,
    leaveDeductions,
  };
}

export function netPayable({ baseSalary, leaveDeductions, rebate = 0, manualDeduction = 0 }) {
  return Math.max(0, round2(baseSalary - leaveDeductions + rebate - manualDeduction));
}

// Rebate / manual deduction from the request: a finite, non-negative amount.
export function parseAmount(value, label) {
  if (value === undefined || value === null || value === '') return 0;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100_000_000) {
    throw new ApiError(400, `${label} must be a positive amount.`);
  }
  return round2(amount);
}

export function parseComment(value) {
  return String(value ?? '').trim().slice(0, 300);
}
