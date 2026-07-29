const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  singletonKey: { 
    type: String, 
    default: 'GLOBAL_SETTINGS',
    unique: true
  },
  rateLimitWindowMs: {
    type: Number,
    default: 15 * 60 * 1000 // 15 minutes
  },
  rateLimitMaxRequests: {
    type: Number,
    default: 100
  },
  defaultSubscriptionPricing: {
    Basic: { type: Number, default: 200000 },
    Standard: { type: Number, default: 500000 },
    Premium: { type: Number, default: 1200000 }
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  sessionExpiryDuration: {
    type: String,
    default: '24h'
  },
  minimumPasswordLength: {
    type: Number,
    default: 8
  },
  failedAuthAlertThreshold: {
    type: Number,
    default: 5
  }
}, { timestamps: true });

// Do NOT apply tenantScopePlugin because this is a global platform model
module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
