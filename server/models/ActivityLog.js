const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    tenantId: { type: String, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, default: 'INST_GLOBAL', index: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: '' },
    role: { type: String, default: '' },
    action: { type: String, required: true },
    details: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

activityLogSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
