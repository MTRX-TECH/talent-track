const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const PlacementApplicationSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, default: '' },
  studentPRS: { type: Number, default: 85 },
  currentRound: { type: String, default: 'Applied' },
  status: { 
    type: String, 
    enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED', 'WITHDRAWN'], 
    default: 'APPLIED' 
  },
  remarks: { type: String, default: '' }
}, { timestamps: true });

PlacementApplicationSchema.index({ tenantId: 1, driveId: 1, studentId: 1 }, { unique: true });
PlacementApplicationSchema.index({ tenantId: 1, status: 1 });
PlacementApplicationSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('PlacementApplication', PlacementApplicationSchema);
