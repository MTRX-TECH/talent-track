const dataService = require('../services/dataService');

exports.getAssessments = async (req, res) => {
  try {
    const assessments = await dataService.find('assessments', {}, req.tenantId);
    const now = new Date();
    const activeAssessments = [];

    for (const a of assessments) {
      if (a.deadline && new Date(a.deadline) <= now) {
        // Automatically delete upon deadline arrival
        await dataService.deleteOne('assessments', { _id: a._id || a.id }, req.tenantId);
        await dataService.create('auditLogs', {
          tenantId: req.tenantId,
          actorId: req.user?.id || 'sys-actor',
          actorName: req.user?.name || 'System Auto-Cleaner',
          action: 'DELETE_EXPIRED_ASSESSMENT',
          resource: 'Assessment',
          beforeState: a
        });
      } else {
        activeAssessments.push(a);
      }
    }

    res.json({ success: true, assessments: activeAssessments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const { title, category, deadline } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Assessment title is required.' });
    }
    if (!deadline) {
      return res.status(400).json({ success: false, message: 'Deadline is required.' });
    }

    const itemData = {
      tenantId: req.tenantId,
      title: title.trim(),
      category: category || 'Coding',
      deadline: new Date(deadline),
      status: 'PUBLISHED',
      createdAt: new Date(),
      createdBy: req.user?.id || 'faculty'
    };

    const assessment = await dataService.create('assessments', itemData);
    
    await dataService.create('auditLogs', {
      tenantId: req.tenantId,
      actorId: req.user?.id || 'sys-actor',
      actorName: req.user?.name || 'Faculty Mentor',
      action: 'CREATE_ASSESSMENT_REMINDER',
      resource: 'Assessment',
      afterState: assessment
    });

    res.json({ success: true, assessment, message: `Assessment reminder '${title}' published successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitAttempt = async (req, res) => {
  try {
    const { assessmentId, note } = req.body;
    const assessment = await dataService.findOne('assessments', { _id: assessmentId }, req.tenantId);
    const title = assessment ? assessment.title : 'Assessment Reminder';

    const attempt = await dataService.create('assessmentAttempts', {
      tenantId: req.tenantId,
      assessmentId: assessment ? assessment._id : assessmentId,
      assessmentTitle: title,
      studentId: req.user?.id || 'student',
      studentName: req.user?.name || 'Student',
      completedAt: new Date(),
      status: 'COMPLETED',
      note: note || 'Completed via Student Portal'
    });

    await dataService.create('auditLogs', {
      tenantId: req.tenantId,
      actorId: req.user?.id || 'sys-actor',
      actorName: req.user?.name || 'Student Ward',
      action: 'ACKNOWLEDGE_ASSESSMENT',
      resource: 'AssessmentAttempt',
      afterState: attempt
    });

    res.json({ success: true, attempt, message: `Assessment reminder '${title}' acknowledged.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
