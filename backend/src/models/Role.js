import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const permissionMatrixSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    access: {
      type: String,
      enum: ['none', 'view', 'update', 'full'],
      default: 'view'
    }
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    isSystem: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    permissions: [permissionMatrixSchema],
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Role = makeTenantModel('Role', roleSchema);
