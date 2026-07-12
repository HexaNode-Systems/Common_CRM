import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { makeTenantModel } from '../utils/tenantModel.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    phone: String,
    role: { type: String, default: 'customer', lowercase: true, trim: true },
    permissions: [{ type: String }],
    permissionVersion: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    joiningDate: Date,
    employmentClassification: { type: String, enum: ['regular_employee', 'intern'], default: 'regular_employee' },
    baseSalary: { type: Number, default: 0 },
    monthlyLeaveQuota: { type: Number, default: 2 },
    // Profile details
    profilePhoto: { type: String, default: '' },
    city: { type: String, default: '' },
    location: { type: String, default: '' },
    correspondenceAddress: { type: String, default: '' },
    permanentAddress: { type: String, default: '' },
    gender: { type: String, default: '' },
    age: { type: Number, default: null }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', async function populatePermissions(next) {
  if (this.isModified('role') || this.isNew || !this.permissions || this.permissions.length === 0) {
    if (this.role === 'super_admin') {
      const { allPermissions } = await import('../utils/permissions.js');
      this.permissions = allPermissions;
    } else {
      try {
        const { Role } = await import('./Role.js');
        const { matrixToPermissionStrings } = await import('../utils/roles.js');
        const roleObj = await Role.findOne({ slug: this.role });
        if (roleObj) {
          this.permissions = matrixToPermissionStrings(roleObj.permissions);
        }
      } catch (err) {
        console.error('Error populating permissions for user:', err);
      }
    }
  }
  next();
});

userSchema.post('save', async function syncMasterUser(doc) {
  try {
    const { MasterUser } = await import('./master/MasterUser.js');
    const { tenantStorage } = await import('../utils/tenantStorage.js');
    const tenantId = tenantStorage.getStore()?.tenantId || null;
    const isSuperAdmin = doc.role === 'super_admin' && !tenantId;

    await MasterUser.findOneAndUpdate(
      { email: doc.email.toLowerCase() },
      {
        email: doc.email.toLowerCase(),
        tenantId: isSuperAdmin ? null : tenantId,
        role: doc.role,
        isActive: doc.isActive
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error('Error syncing User to MasterUser:', err);
  }
});

userSchema.post('findOneAndDelete', async function syncDeleteMasterUser(doc) {
  if (doc) {
    try {
      const { MasterUser } = await import('./master/MasterUser.js');
      await MasterUser.deleteOne({ email: doc.email.toLowerCase() });
    } catch (err) {
      console.error('Error deleting MasterUser mapping:', err);
    }
  }
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export const User = makeTenantModel('User', userSchema);



