import mongoose from 'mongoose';

const impersonationLogSchema = new mongoose.Schema(
  {
    superAdminId: { type: String, required: true }, // Super admin who impersonated
    superAdminName: { type: String, required: true },
    tenantId: { type: String, required: true },
    tenantName: { type: String, required: true },
    targetUserId: { type: String, required: true },
    targetUserName: { type: String, required: true },
    reason: { type: String, required: true },
    ipAddress: String,
    userAgent: String,
    endedAt: Date
  },
  { timestamps: true }
);

const systemAuditLogSchema = new mongoose.Schema(
  {
    actor: { type: String, required: true }, // Super admin ID
    actorName: { type: String, required: true },
    action: { type: String, required: true }, // e.g., 'create_tenant', 'suspend_tenant'
    targetType: { type: String, required: true }, // 'tenant', 'plan', etc.
    targetId: String,
    message: { type: String, required: true },
    ipAddress: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

export const ImpersonationLog = mongoose.model('ImpersonationLog', impersonationLogSchema);
export const SystemAuditLog = mongoose.model('SystemAuditLog', systemAuditLogSchema);
