const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  studentId: { type: String, required: true },
  target: { type: Number, required: true, default: 0 },
  achieved: { type: Number, default: 0 },
  unit: { type: String, default: 'milestones' },
  dueDate: { type: String, default: '' },
}, { timestamps: true });

goalSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.customId || obj._id.toString();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Goal', goalSchema);
