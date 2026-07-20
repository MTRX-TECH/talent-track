const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  token: { type: String, required: true },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
