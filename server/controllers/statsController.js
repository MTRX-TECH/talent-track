const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const Department = require('../models/Department');

const getStats = async (req, res, next) => {
  try {
    const { mentorId, fullLeaderboard } = req.query;

    const [students, mentors, hods, admins, departments, milestones, goals] = await Promise.all([
      User.find({ role: 'student' }),
      User.find({ role: 'mentor' }),
      User.find({ role: 'hod' }),
      User.find({ role: 'admin' }),
      Department.find(),
      Milestone.find(),
      Goal.find(),
    ]);

    let scopedStudents = students;
    if (mentorId) {
      const normMentorId = String(mentorId).toLowerCase();
      scopedStudents = students.filter(s => String(s.mentorId).toLowerCase() === normMentorId);
    }

    const scopedStudentIds = scopedStudents.map(s => s.customId || s._id.toString());
    const scopedMilestones = mentorId
      ? milestones.filter(m => scopedStudentIds.includes(m.studentId))
      : milestones;

    // Build leaderboard based on real MongoDB milestone counts
    const leaderboard = students.map(student => {
      const studentId = student.customId || student._id.toString();
      const studentMilestones = milestones.filter(m => m.studentId === studentId);
      const verifiedCount = studentMilestones.filter(m => String(m.verified) === 'true').length;

      return {
        id: studentId,
        name: student.name,
        domain: student.domain || '',
        count: verifiedCount,
        total: studentMilestones.length,
      };
    }).sort((a, b) => b.count - a.count);

    // Category distribution
    const categories = {};
    scopedMilestones.forEach(m => {
      const cat = m.category || 'General';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Daily activity (last 7 days)
    const dailyActivity = {};
    for (let i = 6; i >= 0; i--) {
      const dateStr = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      dailyActivity[dateStr] = 0;
    }

    scopedMilestones.forEach(m => {
      const dStr = String(m.date || m.createdAt || '').split('T')[0];
      if (dailyActivity[dStr] !== undefined) {
        dailyActivity[dStr] += 1;
      }
    });

    res.json({
      success: true,
      stats: {
        totalStudents: students.length,
        totalMentors: mentors.length,
        totalHOD: hods.length,
        totalAdmin: admins.length,
        totalDepartments: departments.length,
        totalMilestones: milestones.length,
        verifiedCount: scopedMilestones.filter(m => String(m.verified) === 'true').length,
        pendingCount: scopedMilestones.filter(m => String(m.verified) !== 'true').length,
        myStudentsCount: scopedStudents.length,
        myMilestonesCount: scopedMilestones.length,
        totalGoals: goals.length,
        leaderboard: (String(fullLeaderboard) === 'true') ? leaderboard : leaderboard.slice(0, 10),
        categories,
        dailyActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
