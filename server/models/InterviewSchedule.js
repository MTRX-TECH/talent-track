const mongoose = require('mongoose');
const tenantScopePlugin = require('../plugins/tenantScope');

const InterviewScheduleSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
  companyName: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  interviewerName: { type: String, default: 'Panel 1 - Technical Lead' },
  roundName: { type: String, default: 'Technical Interview Round 1' },
  scheduledTime: { type: String, required: true }, // ISO timestamp or formatted string
  meetingLink: { type: String, default: 'https://meet.google.com/talenttrack-interview' },
  attendanceStatus: { type: String, enum: ['SCHEDULED', 'ATTENDED', 'NO_SHOW', 'RESCHEDULED'], default: 'SCHEDULED' },
  interviewerFeedback: { type: String, default: '' },
  score: { type: Number, default: 0, min: 0, max: 100 }
}, { timestamps: true });

InterviewScheduleSchema.index({ tenantId: 1, studentId: 1 });
InterviewScheduleSchema.plugin(tenantScopePlugin, { allowUnscopedOutsideContext: true });

module.exports = mongoose.model('InterviewSchedule', InterviewScheduleSchema);
