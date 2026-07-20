const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, required: true, default: 'INST_GLOBAL', index: true },
    userId: { type: String, required: true, index: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: {
      type: String,
      enum: ['milestone', 'verification', 'mentor', 'subscription', 'system', 'info'],
      default: 'info',
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationSchema.index({ tenantId: 1, userId: 1, read: 1 });

notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Notification', notificationSchema);
