const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const InternshipSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  companyName: { type: String, required: true },
  role: { type: String, required: true },
  durationDays: { type: Number, required: true, default: 60 },
  stipendAmount: { type: Number, default: 15000 },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  certificateUrl: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['SUBMITTED', 'VERIFIED', 'NEEDS_REVISION', 'REJECTED'], 
    default: 'SUBMITTED' 
  },
  reviewedBy: { type: String, default: '' },
  prsContributionPoints: { type: Number, default: 30 }
}, { timestamps: true });

InternshipSchema.index({ tenantId: 1, studentId: 1 });
InternshipSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Internship', InternshipSchema);
