const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const RecruiterProfileSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  companyName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, default: '' },
  designation: { type: String, default: 'Talent Acquisition Lead' },
  assignedDrives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

RecruiterProfileSchema.index({ tenantId: 1, email: 1 });
RecruiterProfileSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('RecruiterProfile', RecruiterProfileSchema);
