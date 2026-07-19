import { makeTenantModel } from '../utils/tenantModel.js';
import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema(
  {
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    permission: { type: Number, enum: [0, 1, 2, 3], default: 0 }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per role and module
rolePermissionSchema.index({ roleId: 1, moduleId: 1 }, { unique: true });

export const RolePermission = makeTenantModel('RolePermission', rolePermissionSchema);
