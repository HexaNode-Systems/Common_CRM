import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

// One line per hand-over: who got it, when it came back, or when it was reported damaged / lost.
const historySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['created', 'assigned', 'returned', 'reassigned', 'status'], required: true },
    status: { type: String },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    employeeName: { type: String, default: '' },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, default: '' }
  },
  { _id: false }
);

const accessorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    modelNumber: { type: String, trim: true, maxlength: 120 },
    serialNumber: { type: String, trim: true, maxlength: 120 }, // SIM number, IMEI, laptop serial, etc.
    // Upper-cased copy used to stop the same serial / IMEI / SIM being recorded twice.
    serialKey: { type: String, default: null, select: false },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignmentDate: { type: Date },
    status: {
      type: String,
      enum: ['assigned', 'available', 'damaged', 'lost'],
      default: 'available'
    },
    notes: { type: String, trim: true, maxlength: 2000 },
    history: { type: [historySchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

accessorySchema.index({ serialKey: 1 }, { unique: true, partialFilterExpression: { serialKey: { $type: 'string' } } });
accessorySchema.index({ employee: 1, status: 1 });

export const Accessory = makeTenantModel('Accessory', accessorySchema);
