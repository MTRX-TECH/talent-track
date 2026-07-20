const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  module: { type: String, default: 'General' },
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
