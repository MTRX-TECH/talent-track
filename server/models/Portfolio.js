const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const PortfolioSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  publicSlug: { type: String, required: true, unique: true },
  qrCodeToken: { type: String, required: true },
  visibility: { type: String, enum: ['PUBLIC', 'RECRUITERS_ONLY', 'PRIVATE'], default: 'PUBLIC' },
  bio: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  verifiedAchievementsCount: { type: Number, default: 0 }
}, { timestamps: true });

PortfolioSchema.index({ tenantId: 1, publicSlug: 1 });
PortfolioSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
