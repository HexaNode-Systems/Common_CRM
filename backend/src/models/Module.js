import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    route: { type: String, trim: true },
    icon: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Module = makeTenantModel('Module', moduleSchema);
