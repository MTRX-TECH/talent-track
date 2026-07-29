const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const MilestoneSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentName: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Patents', 'Publications', 'Research', 'Hackathons', 'Certifications', 'Internships', 'Leadership'], 
    required: true 
  },
  description: { type: String, default: '' },
  proofDocumentUrl: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'NEEDS_REVISION', 'REJECTED'], 
    default: 'PENDING',
    index: true 
  },
  points: { type: Number, default: 0 },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  reviewedBy: { type: String, default: '' },
  reviewComments: { type: String, default: '' },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

// Task 5: Compound Indices
MilestoneSchema.index({ tenantId: 1, studentId: 1, status: 1 });
MilestoneSchema.index({ tenantId: 1, category: 1 });
MilestoneSchema.index({ tenantId: 1, status: 1 });

MilestoneSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('Milestone', MilestoneSchema);
