const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const GoalSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: String, required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetDate: { type: String, required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' }
}, { timestamps: true });

GoalSchema.index({ tenantId: 1, studentId: 1, status: 1 });

GoalSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Goal', GoalSchema);
