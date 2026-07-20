const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, default: 'INST_GLOBAL', index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: '' },
    userRole: { type: String, default: '' },
    action: { type: String, required: true }, // e.g. 'CREATED_INSTITUTION', 'GRANTED_FREE_PREMIUM', 'EXPIRED_TRIAL', 'DELETED_TENANT'
    targetModel: { type: String, default: '' },
    targetId: { type: String, default: '' },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ tenantId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
