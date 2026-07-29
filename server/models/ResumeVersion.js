const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const ResumeVersionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  versionName: { type: String, default: 'Software Engineer Resume v1' },
  targetRole: { type: String, default: 'Full Stack Engineer' },
  atsScore: { type: Number, default: 85 }, // 0 to 100
  keywordMatchPercentage: { type: Number, default: 92 },
  resumeUrl: { type: String, default: '' }
}, { timestamps: true });

ResumeVersionSchema.index({ tenantId: 1, studentId: 1 });
ResumeVersionSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('ResumeVersion', ResumeVersionSchema);
