const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' },
  permissions: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
