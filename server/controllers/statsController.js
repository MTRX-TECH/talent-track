const User = require('../models/User');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const Department = require('../models/Department');

const getStats = async (req, res, next) => {
  try {
    const { mentorId, studentId, fullLeaderboard } = req.query;
    const tenantFilter = (req.user && req.user.role !== 'superadmin') ? { tenantId: req.tenantId } : {};

    const [students, mentors, hods, admins, departments, milestones, goals] = await Promise.all([
      User.find({ ...tenantFilter, role: 'student' }),
      User.find({ ...tenantFilter, role: { $in: ['faculty', 'mentor'] } }),
      User.find({ ...tenantFilter, role: 'hod' }),
      User.find({ ...tenantFilter, role: 'admin' }),
      Department.find(tenantFilter),
      Milestone.find(tenantFilter),
      Goal.find(tenantFilter),
    ]);

    let scopedStudents = students;
    let scopedMilestones = milestones;

    if (studentId) {
      const normStudentId = String(studentId).toLowerCase();
      scopedMilestones = milestones.filter(m => String(m.studentId).toLowerCase() === normStudentId);
    } else if (mentorId) {
      const normMentorId = String(mentorId).toLowerCase();
      scopedStudents = students.filter(s => String(s.mentorId).toLowerCase() === normMentorId);
      const scopedStudentIds = scopedStudents.map(s => String(s.customId || s._id).toLowerCase());
      scopedMilestones = milestones.filter(m => scopedStudentIds.includes(String(m.studentId).toLowerCase()));
    }

    // Build tenant-isolated leaderboard
    const leaderboard = students.map(student => {
      const sId = String(student.customId || student._id);
      const studentMilestones = milestones.filter(m => String(m.studentId) === sId);
      const verifiedCount = studentMilestones.filter(m => String(m.verified) === 'true').length;

      return {
        id: sId,
        name: student.name,
        domain: student.domain || '',
        count: verifiedCount,
        total: studentMilestones.length,
      };
    }).sort((a, b) => b.count - a.count);

    // Category distribution for scoped milestones
    const categories = {};
    scopedMilestones.forEach(m => {
      const cat = m.category || 'General';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    // Daily activity (last 7 days) for scoped milestones
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
