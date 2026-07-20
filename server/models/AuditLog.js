const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: String, required: true },
  actorName: { type: String, default: '' },
  actorRole: { type: String, default: '' },
  action: { type: String, required: true },
  targetModel: { type: String, default: '' },
  targetId: { type: String, default: '' },
  changes: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

auditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id.toString();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
