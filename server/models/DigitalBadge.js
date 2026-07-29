const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const DigitalBadgeSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeName: { type: String, required: true }, // e.g. "Hackathon Winner", "Cloud Specialist", "Top 5% PRS Achiever"
  category: { type: String, enum: ['Achievement', 'Skill', 'Leadership'], default: 'Achievement' },
  iconUrl: { type: String, default: '' },
  description: { type: String, default: '' },
  awardedDate: { type: String, required: true }
}, { timestamps: true });

DigitalBadgeSchema.index({ tenantId: 1, studentId: 1 });
DigitalBadgeSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('DigitalBadge', DigitalBadgeSchema);
