const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const PlacementDriveSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  seasonId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementSeason' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true }, // e.g. "Software Development Engineer (SDE-1)"
  ctc: { type: Number, required: true }, // CTC in LPA (e.g. 12.5)
  location: { type: String, default: 'Bengaluru / Hybrid' },
  eligibilityCriteria: {
    minPRS: { type: Number, default: 75 },
    minGPA: { type: Number, default: 7.5 },
    allowedDepartments: [{ type: String, default: 'CSE' }],
    maxStandingArrears: { type: Number, default: 0 }
  },
  driveDate: { type: String, required: true },
  applicationDeadline: { type: String, required: true },
  rounds: [{
    name: { type: String, required: true }, // Online Assessment, Tech Round 1, HR Round
    order: { type: Number, required: true }
  }],
  status: { type: String, enum: ['UPCOMING', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'REGISTRATION_OPEN' },
  applicantCount: { type: Number, default: 0 },
  selectedCount: { type: Number, default: 0 }
}, { timestamps: true });

PlacementDriveSchema.index({ tenantId: 1, status: 1 });
PlacementDriveSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('PlacementDrive', PlacementDriveSchema);
