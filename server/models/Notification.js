const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  userId: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: String, default: 'false' }, // 'true' or 'false'
  type: { type: String, default: 'info' }, // 'milestone', 'verification', 'mentor', 'info'
  timestamp: { type: String, default: () => new Date().toISOString() },
}, { timestamps: true });

notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.customId || obj._id.toString();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Notification', notificationSchema);
