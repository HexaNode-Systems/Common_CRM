import { Attendance } from '../models/Attendance.js';
import { Payroll } from '../models/Payroll.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId, monthYear } = req.query;
  if (!employeeId || !monthYear) {
    throw new ApiError(400, 'Employee ID and Month-Year are required.');
  }

  const start = new Date(`${monthYear}-01T00:00:00.000Z`);
  const [year, month] = monthYear.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  const end = new Date(`${monthYear}-${totalDays}T23:59:59.999Z`);

  const records = await Attendance.find({
    employee: employeeId,
    date: { $gte: start, $lte: end }
  }).sort({ date: 1 });

  res.json({ items: records });
});

export const saveEmployeeAttendance = asyncHandler(async (req, res) => {
  const { employeeId, monthYear, records } = req.body;
  if (!employeeId || !monthYear || !Array.isArray(records)) {
    throw new ApiError(400, 'Employee ID, Month-Year, and records array are required.');
  }

  // Check if payroll is already Paid (frozen) for this monthYear
  const payroll = await Payroll.findOne({ employee: employeeId, monthYear });
  if (payroll && payroll.status === 'Paid') {
    throw new ApiError(400, 'This month\'s payroll is already paid and frozen. Attendance editing is locked.');
  }

  for (const item of records) {
    const dateVal = new Date(item.date);
    dateVal.setUTCHours(0, 0, 0, 0); // normalize date

    await Attendance.findOneAndUpdate(
      { employee: employeeId, date: dateVal },
      { status: item.status },
      { upsert: true, new: true }
    );
  }

  res.json({ message: 'Attendance records updated successfully.' });
});
