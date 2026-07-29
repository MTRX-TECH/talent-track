const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const ParentQuerySchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  parentId: { type: mongoose.Schema.Types.Mixed, required: true },
  parentName: { type: String, required: true },
  parentEmail: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.Mixed, required: true },
  studentName: { type: String, required: true },
  mentorId: { type: mongoose.Schema.Types.Mixed, default: null },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'REPLIED', 'RESOLVED'], default: 'PENDING' },
  replyMessage: { type: String, default: '' },
  repliedBy: { type: String, default: '' },
  repliedAt: { type: Date, default: null }
}, { timestamps: true });

ParentQuerySchema.index({ tenantId: 1, parentId: 1, mentorId: 1 });
ParentQuerySchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('ParentQuery', ParentQuerySchema);
