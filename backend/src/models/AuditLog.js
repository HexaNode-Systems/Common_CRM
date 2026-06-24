import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    scope: { type: String, required: true, trim: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

auditLogSchema.pre('save', function preventMutation(next) {
  if (!this.isNew) {
    next(new Error('Audit logs are immutable.'));
    return;
  }
  next();
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
