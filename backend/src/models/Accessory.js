import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const accessorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    modelNumber: { type: String, trim: true },
    serialNumber: { type: String, trim: true }, // Can be SIM number, IMEI, Laptop serial, etc.
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignmentDate: { type: Date },
    status: {
      type: String,
      enum: ['assigned', 'available', 'damaged', 'lost'],
      default: 'available'
    },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export const Accessory = makeTenantModel('Accessory', accessorySchema);
