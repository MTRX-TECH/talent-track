const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const ClassTopicLogSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String, required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  topics: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now }
});

// Ensure only one log per class per day by a faculty
ClassTopicLogSchema.index({ tenantId: 1, facultyId: 1, className: 1, date: 1 }, { unique: true });

ClassTopicLogSchema.plugin(tenantScopePlugin);

module.exports = mongoose.model('ClassTopicLog', ClassTopicLogSchema);
