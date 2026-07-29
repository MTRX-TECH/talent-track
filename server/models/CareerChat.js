const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const CareerChatSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userPrompt: { type: String, required: true },
  aiResponse: { type: String, required: true },
  recommendedActions: [{ type: String }]
}, { timestamps: true });

CareerChatSchema.index({ tenantId: 1, studentId: 1 });
CareerChatSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('CareerChat', CareerChatSchema);
