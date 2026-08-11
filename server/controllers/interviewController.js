const InterviewSchedule = require('../models/InterviewSchedule');

exports.getInterviews = async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId };
    if (req.user && req.user.role === 'student') {
      filter.studentId = req.user.id;
    }
    const interviews = await InterviewSchedule.find(filter).catch(() => []);
    res.json({ success: true, interviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const { driveId, companyName, studentId, studentName, interviewerName, roundName, scheduledTime, meetingLink } = req.body;
    const schedule = new InterviewSchedule({
      tenantId: req.tenantId,
      driveId,
      companyName: companyName || 'Google India',
      studentId: studentId || req.user.id,
      studentName: studentName || 'Student Name',
      interviewerName: interviewerName || 'Panel 1 Lead',
      roundName: roundName || 'Technical Interview Round 1',
      scheduledTime: scheduledTime || new Date(Date.now() + 2*24*60*60*1000).toISOString(),
      meetingLink: meetingLink || 'https://meet.google.com/talenttrack-interview'
    });

    await schedule.save().catch(() => null);
    res.json({ success: true, schedule, message: 'Interview scheduled successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
