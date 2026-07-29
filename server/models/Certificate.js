const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const CertificateSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  certificateId: { type: String, required: true, unique: true }, // e.g. "CERT-TALENTTRACK-98213"
  title: { type: String, required: true }, // e.g. "Verified Excellence in AI & Cloud Architecture"
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  issuerName: { type: String, default: 'Ramco Institute of Technology & MTRX TECH' },
  verificationToken: { type: String, required: true },
  issueDate: { type: String, required: true },
  pdfUrl: { type: String, default: '' },
  status: { type: String, enum: ['ACTIVE', 'REVOKED'], default: 'ACTIVE' }
}, { timestamps: true });

CertificateSchema.index({ tenantId: 1, certificateId: 1 });
CertificateSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
