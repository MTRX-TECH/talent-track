const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const OfferLetterSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive' },
  companyName: { type: String, required: true },
  jobRole: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  ctc: { type: Number, required: true }, // CTC in LPA
  offerLetterUrl: { type: String, default: '' },
  acceptanceStatus: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'JOINED', 'WITHDRAWN'], 
    default: 'PENDING' 
  },
  acceptanceDeadline: { type: String, required: true },
  joiningDate: { type: String, default: '2026-07-01' }
}, { timestamps: true });

OfferLetterSchema.index({ tenantId: 1, studentId: 1 });
OfferLetterSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('OfferLetter', OfferLetterSchema);
