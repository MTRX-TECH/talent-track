const { calculatePRS } = require('../services/scoringService');
const dataService = require('../services/dataService');

exports.getStudentPRS = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Fetch real milestones for the user
    const allMilestones = await dataService.find('milestones', { studentId }, req.tenantId);
    
    // Fetch real user metadata
    const userMeta = await dataService.findOne('users', { _id: studentId }, req.tenantId) || {};
    
    const scoreData = calculatePRS(allMilestones, {
      academicYear: userMeta.academicYear,
      gpa: userMeta.gpa,
      internshipDays: userMeta.internshipDays,
      hasLeadershipRole: userMeta.hasLeadershipRole
    });

    res.json({
      success: true,
      placementReadinessScore: scoreData.prs,
      resumeStrengthIndex: scoreData.rsi,
      incompleteProfile: scoreData.incompleteProfile,
      missingComponents: scoreData.missingComponents,
      breakdown: scoreData.breakdown
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
