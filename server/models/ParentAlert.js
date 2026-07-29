const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const ParentAlertSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  alertType: { type: String, enum: ['PLACEMENT', 'ACADEMIC', 'MILESTONE', 'ATTENDANCE'], default: 'PLACEMENT' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

ParentAlertSchema.index({ tenantId: 1, parentId: 1 });
ParentAlertSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('ParentAlert', ParentAlertSchema);
