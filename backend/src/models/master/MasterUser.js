import mongoose from 'mongoose';

const masterUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tenantId: { type: String, default: null }, // Null means global Super Admin
    role: { type: String, required: true, default: 'employee' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export const MasterUser = mongoose.model('MasterUser', masterUserSchema);
