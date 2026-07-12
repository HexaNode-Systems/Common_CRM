import { Accessory } from '../models/Accessory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export const listAccessories = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const skip = (page - 1) * limit;

  // Build filter for searching by name, model number, serial number, etc.
  const filter = {};
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter.$or = [
      { name: searchRegex },
      { modelNumber: searchRegex },
      { serialNumber: searchRegex },
      { notes: searchRegex }
    ];
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Accessory.find(filter)
      .populate('employee', 'name email phone')
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Accessory.countDocuments(filter)
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

export const getAccessory = asyncHandler(async (req, res) => {
  const item = await Accessory.findById(req.params.id)
    .populate('employee', 'name email phone')
    .populate('createdBy', 'name');

  if (!item) {
    throw new ApiError(404, 'Accessory not found');
  }
  res.json(item);
});

export const createAccessory = asyncHandler(async (req, res) => {
  const { name, modelNumber, serialNumber, employee, assignmentDate, status, notes } = req.body;

  if (!name) {
    throw new ApiError(400, 'Accessory name is required');
  }

  // If employee is selected but status is not explicitly set, default status to assigned
  let finalStatus = status || 'available';
  if (employee && !status) {
    finalStatus = 'assigned';
  }

  const item = await Accessory.create({
    name,
    modelNumber,
    serialNumber,
    employee: employee || null,
    assignmentDate: employee ? (assignmentDate || new Date()) : null,
    status: finalStatus,
    notes,
    createdBy: req.user?._id
  });

  const populatedItem = await Accessory.findById(item._id)
    .populate('employee', 'name email phone')
    .populate('createdBy', 'name');

  res.status(201).json(populatedItem);
});

export const updateAccessory = asyncHandler(async (req, res) => {
  const { name, modelNumber, serialNumber, employee, assignmentDate, status, notes } = req.body;

  const item = await Accessory.findById(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Accessory not found');
  }

  if (name !== undefined) item.name = name;
  if (modelNumber !== undefined) item.modelNumber = modelNumber;
  if (serialNumber !== undefined) item.serialNumber = serialNumber;
  
  if (employee !== undefined) {
    item.employee = employee || null;
    if (employee) {
      item.assignmentDate = assignmentDate || item.assignmentDate || new Date();
      // If status was available, toggle to assigned
      if (item.status === 'available') {
        item.status = 'assigned';
      }
    } else {
      item.assignmentDate = null;
      // If status was assigned, toggle to available
      if (item.status === 'assigned') {
        item.status = 'available';
      }
    }
  }

  if (status !== undefined) item.status = status;
  if (notes !== undefined) item.notes = notes;

  await item.save();

  const populatedItem = await Accessory.findById(item._id)
    .populate('employee', 'name email phone')
    .populate('createdBy', 'name');

  res.json(populatedItem);
});

export const removeAccessory = asyncHandler(async (req, res) => {
  const item = await Accessory.findByIdAndDelete(req.params.id);
  if (!item) {
    throw new ApiError(404, 'Accessory not found');
  }
  res.json({ message: 'Deleted successfully' });
});
