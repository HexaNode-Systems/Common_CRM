import { WorkReport } from '../models/WorkReport.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Create Daily Work Report
export const createWorkReport = asyncHandler(async (req, res) => {
  const { date, tasksCompleted, hoursWorked, challenges, nextDayPlan } = req.body;

  if (!tasksCompleted) throw new ApiError(400, 'Tasks completed field is required.');
  if (!hoursWorked || Number(hoursWorked) <= 0) throw new ApiError(400, 'Hours worked must be greater than 0.');

  const reportDate = date ? new Date(date) : new Date();
  
  // Set time boundaries to check for same-day duplicates
  const startOfDay = new Date(reportDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(reportDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await WorkReport.findOne({
    user: req.user._id,
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  if (existing) {
    throw new ApiError(400, 'You have already submitted a work report for this day.');
  }

  const report = await WorkReport.create({
    user: req.user._id,
    date: reportDate,
    tasksCompleted,
    hoursWorked: Number(hoursWorked),
    challenges: challenges || '',
    nextDayPlan: nextDayPlan || ''
  });

  const populated = await WorkReport.findById(report._id).populate('user', 'name email role');
  res.status(201).json(populated);
});

// List Daily Work Reports
export const listWorkReports = asyncHandler(async (req, res) => {
  const filter = {};

  // Access control: non-admins can only see their own reports
  const isSupervisor = ['super_admin', 'admin', 'manager'].includes(req.user.role);
  if (!isSupervisor) {
    filter.user = req.user._id;
  } else {
    if (req.query.user) filter.user = req.query.user;
  }

  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  if (req.query.search) {
    const regex = new RegExp(String(req.query.search).trim(), 'i');
    filter.$or = [
      { tasksCompleted: regex },
      { challenges: regex },
      { nextDayPlan: regex }
    ];
  }

  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 50), 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    WorkReport.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role'),
    WorkReport.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

// Get Single Work Report
export const getWorkReport = asyncHandler(async (req, res) => {
  const report = await WorkReport.findById(req.params.id).populate('user', 'name email role');
  if (!report) throw new ApiError(404, 'Work report not found.');

  const isOwner = String(report.user._id) === String(req.user._id);
  const isSupervisor = ['super_admin', 'admin', 'manager'].includes(req.user.role);

  if (!isOwner && !isSupervisor) {
    throw new ApiError(403, 'Permission denied.');
  }

  res.json(report);
});

// Delete Work Report (Admins only)
export const deleteWorkReport = asyncHandler(async (req, res) => {
  if (req.user.role !== 'super_admin') {
    throw new ApiError(403, 'Only super admins can delete reports.');
  }
  const report = await WorkReport.findByIdAndDelete(req.params.id);
  if (!report) throw new ApiError(404, 'Work report not found.');
  res.json({ message: 'Work report deleted successfully.' });
});
