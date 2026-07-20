const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, required: true, default: 'INST_GLOBAL', index: true },
    customId: { type: String, unique: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Hackathon', 'Internship', 'Project', 'Research', 'Certificate', 'Award', 'General'],
      default: 'General',
    },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    imageUrl: { type: String, default: '' },
    verified: { type: String, enum: ['pending', 'true', 'rejected'], default: 'pending', index: true },
    mentorFeedback: { type: String, default: '' },
  },
  { timestamps: true }
);

milestoneSchema.index({ tenantId: 1, studentId: 1 });
milestoneSchema.index({ tenantId: 1, verified: 1 });

milestoneSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.customId || obj._id.toString();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Milestone', milestoneSchema);
