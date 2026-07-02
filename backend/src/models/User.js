import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model('User', userSchema);



