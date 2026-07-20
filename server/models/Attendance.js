const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, index: true },
    institutionId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, default: '' },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
    remarks: { type: String, default: '' },
    recordedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ tenantId: 1, studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
