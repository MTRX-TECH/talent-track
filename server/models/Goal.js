const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, required: true, default: 'INST_GLOBAL', index: true },
    customId: { type: String, unique: true },
    studentId: { type: String, required: true, index: true },
    target: { type: Number, required: true },
    achieved: { type: Number, default: 0 },
    unit: { type: String, default: 'milestones' },
    dueDate: { type: String, default: '' },
  },
  { timestamps: true }
);

goalSchema.index({ tenantId: 1, studentId: 1 });

goalSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.customId || obj._id.toString();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Goal', goalSchema);
