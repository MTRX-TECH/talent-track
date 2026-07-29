const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const UserSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  username: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'hod', 'mentor', 'student', 'parent'], 
    required: true 
  },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  departmentName: { type: String, default: '' },
  assignedMentorId: { type: mongoose.Schema.Types.Mixed, ref: 'User', default: null },
  studentId: { type: mongoose.Schema.Types.Mixed, ref: 'User', default: null },
  parentUserId: { type: mongoose.Schema.Types.Mixed, ref: 'User', default: null },
  parentEmail: { type: String, default: null },
  rollNumber: { type: String, default: '' },
  academicYear: { type: String, default: '2025-2026' },
  gpa: { type: Number, default: null },
  internshipDays: { type: Number, default: null },
  hasLeadershipRole: { type: Boolean, default: null },
  placementReadinessScore: { type: Number, default: 0, min: 0, max: 100 },
  resumeStrengthIndex: { type: Number, default: 0, min: 0, max: 100 },
  needsPasswordChange: { type: Boolean, default: false },
  needsParentLogin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ tenantId: 1, departmentId: 1 });

UserSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('User', UserSchema);
