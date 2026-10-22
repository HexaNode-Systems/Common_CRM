import mongoose from 'mongoose';
import { WorkReport } from '../models/WorkReport.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hasAccess } from '../middleware/auth.middleware.js';

// Days are counted in the company's time zone, not the server's.
const TZ = process.env.REPORT_TZ || process.env.PAYROLL_TZ || 'Asia/Kolkata';
const BACKDATE_DAYS = 30; // how far back staff may file or edit their own report
const DAY_MS = 24 * 60 * 60 * 1000;

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** "YYYY-MM-DD" for an instant, in the company time zone. */
function dayOf(instant = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

const dayToDate = (day) => new Date(`${day}T00:00:00.000Z`);
const daysBetween = (a, b) => Math.round((dayToDate(a) - dayToDate(b)) / DAY_MS);

/** Accepts "YYYY-MM-DD" (or a full date) and returns the calendar day. */
function parseDay(value) {
  if (value === undefined || value === null || value === '') return dayOf();
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = dayToDate(raw);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== raw) throw new ApiError(400, 'Choose a valid date.');
    return raw;
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, 'Choose a valid date.');
  return dayOf(date);
}

function parseHours(value) {
  const hours = Number(value);
  if (value === '' || value === null || value === undefined || !Number.isFinite(hours)) throw new ApiError(400, 'Enter the hours worked.');
  if (hours < 0.25 || hours > 24) throw new ApiError(400, 'Hours worked must be between 0.25 and 24.');
  return Math.round(hours * 4) / 4;
}

function parseText(value, label, max, required = false) {
  const out = String(value ?? '').trim();
  if (required && !out) throw new ApiError(400, `${label} is required.`);
  if (out.length > max) throw new ApiError(400, `${label} can be at most ${max} characters.`);
  return out;
}

// Full access on Reports (or super admin) = supervisor: sees and manages everyone's reports.
async function isSupervisor(user) {
  return hasAccess(user, 'reports:delete');
}

function checkDayAllowed(day, supervisor) {
  const today = dayOf();
  if (day > today) throw new ApiError(400, 'You can’t file a report for a future date.');
  if (!supervisor && daysBetween(today, day) > BACKDATE_DAYS) {
    throw new ApiError(400, `Reports can be filed or changed up to ${BACKDATE_DAYS} days back.`);
  }
}

// Reports saved before the "day" field existed are matched by date range.
async function findSameDay(userId, day, excludeId = null) {
  const start = new Date(dayToDate(day).getTime() - 14 * 60 * 60 * 1000);
  const end = new Date(dayToDate(day).getTime() + 38 * 60 * 60 * 1000);
  const candidates = await WorkReport.find({ user: userId, $or: [{ day }, { day: { $exists: false }, date: { $gte: start, $lte: end } }] });
  return candidates.find((r) => (!excludeId || String(r._id) !== String(excludeId)) && (r.day ? r.day === day : dayOf(new Date(r.date)) === day));
}

async function present(report, user, supervisor) {
  await WorkReport.populate(report, { path: 'user', select: 'name email role' });
  const plain = typeof report.toObject === 'function' ? report.toObject() : { ...report };
  const day = plain.day || dayOf(new Date(plain.date));
  const own = String(plain.user?._id || plain.user) === String(user._id);
  return {
    ...plain,
    day,
    canEdit: supervisor || (own && daysBetween(dayOf(), day) <= BACKDATE_DAYS),
    canDelete: supervisor
  };
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export const createWorkReport = asyncHandler(async (req, res) => {
  const supervisor = await isSupervisor(req.user);
  const body = req.body || {};
  const day = parseDay(body.date);
  checkDayAllowed(day, supervisor);

  const fields = {
    tasksCompleted: parseText(body.tasksCompleted, 'Tasks completed', 5000, true),
    hoursWorked: parseHours(body.hoursWorked),
    challenges: parseText(body.challenges, 'Challenges', 3000),
    nextDayPlan: parseText(body.nextDayPlan, 'Next day plan', 3000)
  };

  if (await findSameDay(req.user._id, day)) {
    throw new ApiError(409, `You already filed a report for ${day}. Edit that report instead.`);
  }

  let report;
  try {
    report = await WorkReport.create({ user: req.user._id, date: dayToDate(day), day, ...fields });
  } catch (err) {
    // Two clicks at once: the unique index lets only one through.
    if (err?.code === 11000) throw new ApiError(409, `You already filed a report for ${day}.`);
    throw err;
  }
  res.status(201).json(await present(report, req.user, supervisor));
});

export const updateWorkReport = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new ApiError(404, 'Work report not found.');
  const supervisor = await isSupervisor(req.user);
  const report = await WorkReport.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Work report not found.');
  const own = String(report.user) === String(req.user._id);
  if (!own && !supervisor) throw new ApiError(404, 'Work report not found.');

  const currentDay = report.day || dayOf(new Date(report.date));
  checkDayAllowed(currentDay, supervisor);
  const body = req.body || {};

  if (body.date !== undefined) {
    const day = parseDay(body.date);
    if (day !== currentDay) {
      checkDayAllowed(day, supervisor);
      if (await findSameDay(report.user, day, report._id)) throw new ApiError(409, `There is already a report for ${day}.`);
      report.day = day;
      report.date = dayToDate(day);
    }
  }
  if (!report.day) report.day = currentDay;
  if (body.tasksCompleted !== undefined) report.tasksCompleted = parseText(body.tasksCompleted, 'Tasks completed', 5000, true);
  if (body.hoursWorked !== undefined) report.hoursWorked = parseHours(body.hoursWorked);
  if (body.challenges !== undefined) report.challenges = parseText(body.challenges, 'Challenges', 3000);
  if (body.nextDayPlan !== undefined) report.nextDayPlan = parseText(body.nextDayPlan, 'Next day plan', 3000);
  report.editedAt = new Date();
  report.editedBy = req.user._id;

  try {
    await report.save();
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'There is already a report for that day.');
    throw err;
  }
  res.json(await present(report, req.user, supervisor));
});

export const listWorkReports = asyncHandler(async (req, res) => {
  const supervisor = await isSupervisor(req.user);
  const and = [];

  if (!supervisor) and.push({ user: req.user._id });
  else if (req.query.user) {
    if (!isId(req.query.user)) throw new ApiError(400, 'Unknown team member.');
    and.push({ user: req.query.user });
  }

  if (req.query.from || req.query.to) {
    const range = {};
    // Whole days, inclusive: "to 22 Oct" includes everything filed for 22 Oct.
    if (req.query.from) range.$gte = dayToDate(parseDay(req.query.from));
    if (req.query.to) range.$lte = new Date(dayToDate(parseDay(req.query.to)).getTime() + DAY_MS - 1);
    and.push({ date: range });
  }

  const search = String(req.query.search || '').trim().slice(0, 100);
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    and.push({ $or: [{ tasksCompleted: regex }, { challenges: regex }, { nextDayPlan: regex }] });
  }

  const filter = and.length ? { $and: and } : {};
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(Math.max(1, Math.floor(Number(req.query.limit)) || 20), 100);

  const [items, total] = await Promise.all([
    WorkReport.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    WorkReport.countDocuments(filter)
  ]);
  const out = [];
  for (const item of items) out.push(await present(item, req.user, supervisor));

  res.json({
    items: out,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    isSupervisor: supervisor,
    today: dayOf()
  });
});

export const getWorkReport = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new ApiError(404, 'Work report not found.');
  const supervisor = await isSupervisor(req.user);
  const report = await WorkReport.findById(req.params.id);
  if (!report || (!supervisor && String(report.user) !== String(req.user._id))) throw new ApiError(404, 'Work report not found.');
  res.json(await present(report, req.user, supervisor));
});

export const deleteWorkReport = asyncHandler(async (req, res) => {
  if (!(await isSupervisor(req.user))) throw new ApiError(403, 'Only supervisors (Full access on Reports) can delete reports.');
  if (!isId(req.params.id)) throw new ApiError(404, 'Work report not found.');
  const report = await WorkReport.findByIdAndDelete(req.params.id);
  if (!report) throw new ApiError(404, 'Work report not found.');
  res.json({ message: 'Work report deleted successfully.' });
});

// Team members for the supervisor's filter (no Users access needed).
export const listReportTeam = asyncHandler(async (req, res) => {
  if (!(await isSupervisor(req.user))) return res.json({ items: [] });
  const items = await User.find({ isActive: true, role: { $ne: 'customer' } }).select('name email role').sort({ name: 1 });
  res.json({ items });
});
