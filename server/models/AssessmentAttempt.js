const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const AssessmentAttemptSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  assessmentTitle: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  scoreObtained: { type: Number, required: true, default: 85 },
  maxScore: { type: Number, required: true, default: 100 },
  percentage: { type: Number, default: 85 },
  isPassed: { type: Boolean, default: true },
  timeTakenMinutes: { type: Number, default: 42 }
}, { timestamps: true });

AssessmentAttemptSchema.index({ tenantId: 1, studentId: 1 });
AssessmentAttemptSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('AssessmentAttempt', AssessmentAttemptSchema);
