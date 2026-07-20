const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  studentId: { type: String, required: true },
  studentName: { type: String, default: '' },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  imageUrl: { type: String, default: '' },
  verified: { type: String, default: 'false' }, // 'true', 'false', 'rejected'
  mentorFeedback: { type: String, default: '' },
}, { timestamps: true });

milestoneSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.customId || obj._id.toString();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Milestone', milestoneSchema);
