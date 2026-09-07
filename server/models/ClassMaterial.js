const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const ClassMaterialSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  className: { type: String, required: true },
  materialType: { type: String, enum: ['note', 'assignment'], required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fileData: { type: String, default: '' }, // Stores base64 encoded file or link
  createdAt: { type: Date, default: Date.now }
});

ClassMaterialSchema.plugin(tenantScopePlugin);

module.exports = mongoose.model('ClassMaterial', ClassMaterialSchema);
