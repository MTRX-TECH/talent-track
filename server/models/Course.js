const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, required: true, default: 'INST_GLOBAL', index: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    departmentId: { type: String, default: '' },
    year: { type: Number, default: 1 },
  },
  { timestamps: true }
);

courseSchema.index({ tenantId: 1, code: 1 });

module.exports = mongoose.model('Course', courseSchema);
