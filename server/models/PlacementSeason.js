const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const PlacementSeasonSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true }, // e.g. "Placement Season 2025-2026"
  academicYear: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'], default: 'ACTIVE' },
  targetPlacementPercentage: { type: Number, default: 95 },
  placedStudentsCount: { type: Number, default: 0 },
  totalEligibleStudents: { type: Number, default: 0 }
}, { timestamps: true });

PlacementSeasonSchema.index({ tenantId: 1, status: 1 });
PlacementSeasonSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('PlacementSeason', PlacementSeasonSchema);
