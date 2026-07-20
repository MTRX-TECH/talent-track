const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, required: true, default: 'INST_GLOBAL', index: true },
    code: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    hodId: { type: String, default: '' },
  },
  { timestamps: true }
);

departmentSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
