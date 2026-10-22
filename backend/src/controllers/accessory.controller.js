import mongoose from 'mongoose';
import { Accessory } from '../models/Accessory.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

const STATUSES = ['assigned', 'available', 'damaged', 'lost'];
// Name and email only: phone numbers of staff are not needed to track a laptop.
const EMPLOYEE_FIELDS = 'name email role isActive';
const TZ = process.env.REPORT_TZ || process.env.PAYROLL_TZ || 'Asia/Kolkata';

const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || '')) && String(v).length === 24;
const escapeRegex = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

function text(value, label, max, required = false) {
  const out = String(value ?? '').trim();
  if (required && !out) throw new ApiError(400, `${label} is required.`);
  if (out.length > max) throw new ApiError(400, `${label} can be at most ${max} characters.`);
  return out;
}

function parseStatus(value) {
  if (!STATUSES.includes(value)) throw new ApiError(400, 'Status must be Available, Assigned, Damaged or Lost.');
  return value;
}

/** "YYYY-MM-DD" or a date; not in the future. */
function parseAssignmentDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const raw = String(value).trim();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  const date = new Date(day ? `${day}T00:00:00.000Z` : raw);
  if (Number.isNaN(date.getTime()) || (day && date.toISOString().slice(0, 10) !== day)) {
    throw new ApiError(400, 'Choose a valid assignment date.');
  }
  if ((day || date.toISOString().slice(0, 10)) > today()) throw new ApiError(400, 'Assignment date cannot be in the future.');
  return date;
}

// Only active staff can hold company assets (not customers, not people who have left).
async function resolveEmployee(value) {
  if (value === undefined || value === null || value === '') return null;
  if (!isId(value)) throw new ApiError(400, 'Choose an employee from the list.');
  const user = await User.findById(value).select('name email role isActive');
  if (!user) throw new ApiError(400, 'That employee no longer exists.');
  if (user.role === 'customer') throw new ApiError(400, 'Assets can only be assigned to staff, not customer accounts.');
  if (user.isActive === false) throw new ApiError(400, `${user.name} is deactivated. Assign the asset to an active employee.`);
  return user;
}

async function assertSerialFree(serial, exceptId = null) {
  if (!serial) return;
  const clash = await Accessory.findOne({ serialNumber: new RegExp(`^${escapeRegex(serial)}$`, 'i') });
  if (clash && String(clash._id) !== String(exceptId)) {
    throw new ApiError(409, `Serial / SIM / IMEI "${serial}" is already recorded on "${clash.name}".`);
  }
}

function historyEntry(req, action, { status, employee = null, note = '' }) {
  return {
    action,
    status,
    employee: employee?._id || employee || null,
    employeeName: employee?.name || '',
    note,
    at: new Date(),
    by: req.user?._id,
    byName: req.user?.name || ''
  };
}

async function load(id) {
  return Accessory.findById(id).populate('employee', EMPLOYEE_FIELDS).populate('createdBy', 'name');
}

async function saveOrConflict(doc) {
  try {
    return await doc.save();
  } catch (err) {
    if (err?.code === 11000) throw new ApiError(409, 'This serial / SIM / IMEI number is already recorded on another asset.');
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Handlers                                                            */
/* ------------------------------------------------------------------ */

export const listAccessories = asyncHandler(async (req, res) => {
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(Math.max(1, Math.floor(Number(req.query.limit)) || 20), 100);

  const filter = {};
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: regex }, { modelNumber: regex }, { serialNumber: regex }, { notes: regex }];
  }
  if (req.query.status !== undefined && req.query.status !== '') filter.status = parseStatus(req.query.status);
  if (req.query.employee !== undefined && req.query.employee !== '') {
    if (!isId(req.query.employee)) throw new ApiError(400, 'Unknown employee.');
    filter.employee = req.query.employee;
  }

  const [items, total] = await Promise.all([
    Accessory.find(filter)
      .populate('employee', EMPLOYEE_FIELDS)
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Accessory.countDocuments(filter)
  ]);

  res.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const getAccessory = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new ApiError(404, 'Accessory not found');
  const item = await load(req.params.id);
  if (!item) throw new ApiError(404, 'Accessory not found');
  res.json(item);
});

// Staff who can hold assets, for the "Assign to" list. Works without access to the Users page.
export const listAssignees = asyncHandler(async (_req, res) => {
  const items = await User.find({ isActive: true, role: { $ne: 'customer' } }).select('name email role').sort({ name: 1 });
  res.json({ items: items.map((u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role })) });
});

export const createAccessory = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = text(body.name, 'Accessory name', 120, true);
  const modelNumber = text(body.modelNumber, 'Model number', 120);
  const serialNumber = text(body.serialNumber, 'Serial / SIM / IMEI number', 120);
  const notes = text(body.notes, 'Notes', 2000);
  const employee = await resolveEmployee(body.employee);
  const assignmentDate = parseAssignmentDate(body.assignmentDate);

  // Status and assignment always agree: someone selected ⇒ assigned; assigned ⇒ someone selected.
  let status = body.status ? parseStatus(body.status) : employee ? 'assigned' : 'available';
  if (employee && status !== 'assigned') {
    throw new ApiError(400, `A ${status} asset cannot be assigned to someone. Choose "Assigned" or remove the employee.`);
  }
  if (!employee && status === 'assigned') throw new ApiError(400, 'Choose the employee this asset is assigned to.');

  await assertSerialFree(serialNumber);

  const history = [historyEntry(req, employee ? 'assigned' : 'created', { status, employee })];
  const doc = await Accessory.create({
    name,
    modelNumber,
    serialNumber,
    serialKey: serialNumber ? serialNumber.toUpperCase() : null,
    employee: employee?._id || null,
    assignmentDate: employee ? assignmentDate || new Date() : null,
    status,
    notes,
    history,
    createdBy: req.user?._id
  }).catch((err) => {
    if (err?.code === 11000) throw new ApiError(409, 'This serial / SIM / IMEI number is already recorded on another asset.');
    throw err;
  });

  res.status(201).json(await load(doc._id));
});

export const updateAccessory = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new ApiError(404, 'Accessory not found');
  const item = await Accessory.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Accessory not found');
  const body = req.body || {};

  if (body.name !== undefined) item.name = text(body.name, 'Accessory name', 120, true);
  if (body.modelNumber !== undefined) item.modelNumber = text(body.modelNumber, 'Model number', 120);
  if (body.notes !== undefined) item.notes = text(body.notes, 'Notes', 2000);
  if (body.serialNumber !== undefined) {
    const serial = text(body.serialNumber, 'Serial / SIM / IMEI number', 120);
    if (serial.toUpperCase() !== String(item.serialNumber || '').toUpperCase()) await assertSerialFree(serial, item._id);
    item.serialNumber = serial;
    item.serialKey = serial ? serial.toUpperCase() : null;
  }

  const prevEmployee = item.employee ? String(item.employee) : null;
  const prevStatus = item.status;

  // Work out the new holder and status, then make them agree.
  let nextEmployee = prevEmployee;
  let holder = null;
  if (body.employee !== undefined) {
    holder = await resolveEmployee(body.employee);
    nextEmployee = holder ? String(holder._id) : null;
  }
  let nextStatus = body.status !== undefined && body.status !== '' ? parseStatus(body.status) : prevStatus;

  if (body.employee !== undefined && body.status === undefined) {
    // Only the person changed: picking someone means assigned; clearing means back in stock.
    if (nextEmployee) nextStatus = 'assigned';
    else if (prevStatus === 'assigned') nextStatus = 'available';
  }
  if (nextStatus === 'assigned' && !nextEmployee) throw new ApiError(400, 'Choose the employee this asset is assigned to.');
  if (nextStatus !== 'assigned' && body.employee && nextEmployee) {
    throw new ApiError(400, `A ${nextStatus} asset cannot be assigned to someone. Choose "Assigned" or remove the employee.`);
  }
  if (nextStatus !== 'assigned') nextEmployee = null; // returned / damaged / lost: nobody holds it now

  // History: record who had it before it changed hands or was written off.
  if (!holder && nextEmployee) holder = await User.findById(nextEmployee).select('name');
  const previousHolder = prevEmployee ? await User.findById(prevEmployee).select('name') : null;
  const entries = [];
  if (prevEmployee !== nextEmployee) {
    if (prevEmployee && nextEmployee) entries.push(historyEntry(req, 'reassigned', { status: nextStatus, employee: holder, note: `from ${previousHolder?.name || 'previous holder'}` }));
    else if (nextEmployee) entries.push(historyEntry(req, 'assigned', { status: nextStatus, employee: holder }));
    else if (nextStatus === 'available') entries.push(historyEntry(req, 'returned', { status: nextStatus, employee: previousHolder || prevEmployee }));
  }
  if (nextStatus !== prevStatus && nextStatus !== 'assigned' && nextStatus !== 'available') {
    // Damaged or lost: keep the name of whoever had it.
    entries.push(historyEntry(req, 'status', { status: nextStatus, employee: previousHolder || prevEmployee, note: prevEmployee ? 'while assigned' : '' }));
  } else if (nextStatus !== prevStatus && !entries.length) {
    entries.push(historyEntry(req, 'status', { status: nextStatus }));
  }

  if (prevEmployee !== nextEmployee) {
    item.employee = nextEmployee;
    item.assignmentDate = nextEmployee ? parseAssignmentDate(body.assignmentDate) || new Date() : null;
  } else if (nextEmployee && body.assignmentDate !== undefined) {
    item.assignmentDate = parseAssignmentDate(body.assignmentDate) || item.assignmentDate;
  } else if (!nextEmployee) {
    item.assignmentDate = null;
  }
  item.status = nextStatus;
  if (entries.length) item.history = [...(item.history || []), ...entries].slice(-200);

  await saveOrConflict(item);
  res.json(await load(item._id));
});

export const removeAccessory = asyncHandler(async (req, res) => {
  if (!isId(req.params.id)) throw new ApiError(404, 'Accessory not found');
  const item = await Accessory.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Accessory not found');
  res.json({ message: 'Deleted successfully' });
});
