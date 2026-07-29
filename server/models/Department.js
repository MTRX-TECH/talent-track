const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const DepartmentSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

DepartmentSchema.index({ tenantId: 1, code: 1 }, { unique: true });
DepartmentSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Department', DepartmentSchema);
