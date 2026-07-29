const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const AssessmentSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true }, // e.g. "Full Stack System Design & Data Structures Mock Assessment"
  category: { type: String, enum: ['Coding', 'Aptitude', 'Core CS', 'Soft Skills'], default: 'Coding' },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'COMPLETED', 'ARCHIVED'], default: 'PUBLISHED' }
}, { timestamps: true });

AssessmentSchema.index({ tenantId: 1, status: 1 });
AssessmentSchema.index({ deadline: 1 }, { expireAfterSeconds: 0 });
AssessmentSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Assessment', AssessmentSchema);
