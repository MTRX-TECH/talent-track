const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const QuestionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  topic: { type: String, required: true, default: 'Data Structures' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true, default: 0 },
  explanation: { type: String, default: '' },
  marks: { type: Number, default: 10 }
}, { timestamps: true });

QuestionSchema.index({ tenantId: 1, topic: 1 });
QuestionSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Question', QuestionSchema);
