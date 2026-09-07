const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const StudentTopicLogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String, required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  studentTopics: [{ type: String, required: true }],
  matchPercentage: { type: Number, required: true },
  status: { type: String, enum: ['acceptable', 'flagged'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Ensure a student can only submit once per class per day
StudentTopicLogSchema.index({ tenantId: 1, studentId: 1, className: 1, date: 1, facultyId: 1 }, { unique: true });

StudentTopicLogSchema.plugin(tenantScopePlugin);

module.exports = mongoose.model('StudentTopicLog', StudentTopicLogSchema);
