const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const AuditLogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  actorId: { type: String, required: true, default: 'sys-actor' },
  actorName: { type: String, required: true },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  beforeState: { type: Object, default: null },
  afterState: { type: Object, default: null },
  ipAddress: { type: String, default: '127.0.0.1' },
  viaImpersonation: { type: Boolean, default: false }
}, { timestamps: true });

// Compound Indices
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, actorId: 1 });

AuditLogSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
