const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const NotificationSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['verified', 'rejected', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Task 5: Compound Indices
NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ tenantId: 1, userId: 1, category: 1 });

NotificationSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Notification', NotificationSchema);
