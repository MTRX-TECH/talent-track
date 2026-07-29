const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const CompanySchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  industry: { type: String, default: 'Information Technology' },
  website: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  tier: { type: String, enum: ['Tier 1 (Dream)', 'Tier 2 (Super Dream)', 'Tier 3 (Mass)'], default: 'Tier 1 (Dream)' },
  verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'VERIFIED' },
  contactPerson: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' }
  },
  averageCTC: { type: Number, default: 8.5 } // In LPA
}, { timestamps: true });

CompanySchema.index({ tenantId: 1, name: 1 });
CompanySchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Company', CompanySchema);
