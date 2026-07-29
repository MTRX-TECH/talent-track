const dataService = require('../services/dataService');

exports.getParentPlacementTracking = async (req, res) => {
  try {
    const parentId = req.user.id;
    const parentUser = await dataService.findOne('users', { _id: parentId, bypassRoleScope: true }, req.tenantId);
    
    if (!parentUser) {
      return res.status(404).json({ success: false, message: 'Parent user record not found.' });
    }

    // Find all linked student accounts (wards) in the system with bypassRoleScope to avoid Mongoose stripping
    const allStudents = await dataService.find('users', { role: 'student', bypassRoleScope: true }, req.tenantId);
    const linkedStudents = allStudents.filter(s => {
      const matchDirectId = parentUser.studentId && (String(s._id) === String(parentUser.studentId) || String(s.id) === String(parentUser.studentId));
      const matchParentId = s.parentUserId && String(s.parentUserId) === String(parentUser._id || parentId);
      const matchEmail = s.parentEmail && parentUser.email && s.parentEmail.toLowerCase() === parentUser.email.toLowerCase();
      return matchDirectId || matchParentId || matchEmail;
    });

    if (linkedStudents.length === 0) {
      return res.json({
        success: true,
        children: [],
        activeChild: null,
        placementOverview: {
          totalApplications: 0,
          shortlistedCount: 0,
          offersCount: 0,
          interviewsCount: 0,
          recentAlerts: [],
          applications: [],
          offers: [],
          interviews: [],
          milestones: []
        },
        message: 'No linked student accounts found.'
      });
    }

    // Pick active child based on query param or default to first child
    const selectedId = req.query.studentId;
    const activeStudent = (selectedId && linkedStudents.find(s => String(s._id) === String(selectedId) || String(s.id) === String(selectedId))) 
                          || linkedStudents[0];
    
    const studentId = activeStudent._id || activeStudent.id;

    // Load actual tracking data for the active child from dataService
    const alerts = await dataService.find('parentAlerts', { parentId: parentUser._id || parentId, bypassRoleScope: true }, req.tenantId);
    
    // Retrieve applications, offers, interviews, and milestones linked to the active student
    const allApps = await dataService.find('placementApplications', { bypassRoleScope: true }, req.tenantId);
    const applications = allApps.filter(a => String(a.studentId) === String(studentId) || String(a.studentUser || '') === String(studentId));

    const allOffers = await dataService.find('offers', { bypassRoleScope: true }, req.tenantId);
    const offers = allOffers.filter(o => String(o.studentId) === String(studentId) || String(o.recipientId || '') === String(studentId));

    const allInterviews = await dataService.find('interviews', { bypassRoleScope: true }, req.tenantId);
    const interviews = allInterviews.filter(i => String(i.studentId) === String(studentId) || String(i.candidateId || '') === String(studentId));

    const allMilestones = await dataService.find('milestones', { bypassRoleScope: true }, req.tenantId);
    const milestones = allMilestones.filter(m => String(m.studentId) === String(studentId) || String(m.user || '') === String(studentId) || (activeStudent.email && m.studentEmail === activeStudent.email));

    // Prepare safe children profiles
    const childrenProfiles = linkedStudents.map(s => ({
      id: String(s._id || s.id),
      name: s.name || 'Student Ward',
      email: s.email || '',
      dept: s.departmentCode || s.departmentName || 'General Engineering',
      rollNumber: s.rollNumber || 'N/A',
      prs: s.placementReadinessScore ?? 0,
      gpa: s.gpa || null,
      academicYear: s.academicYear || 'Current Year'
    }));

    const activeChildProfile = childrenProfiles.find(c => c.id === String(studentId)) || childrenProfiles[0];

    res.json({
      success: true,
      children: childrenProfiles,
      activeChild: activeChildProfile,
      placementOverview: {
        totalApplications: applications.length,
        shortlistedCount: applications.filter(a => a.status === 'SHORTLISTED' || a.status === 'OFFERED' || a.status === 'SELECTED').length,
        offersCount: offers.length,
        interviewsCount: interviews.length,
        recentAlerts: alerts,
        applications,
        offers,
        interviews,
        milestones: milestones.map(m => ({
          _id: m._id || m.id,
          title: m.title || m.name || 'Verified Achievement',
          category: m.category || 'Certification',
          status: m.status || m.verificationStatus || 'VERIFIED',
          prsPoints: m.points || m.prsReward || 10,
          date: m.verifiedAt || m.createdAt || new Date().toLocaleDateString()
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load parent tracking data: ' + err.message });
  }
};

exports.contactMentor = async (req, res) => {
  try {
    const { studentId, subject, message } = req.body;
    if (!studentId || !message) {
      return res.status(400).json({ success: false, message: 'Student selection and message content are required.' });
    }

    const parentUser = await dataService.findOne('users', { _id: req.user.id, bypassRoleScope: true }, req.tenantId);
    if (!parentUser) {
      return res.status(404).json({ success: false, message: 'Parent account not found.' });
    }

    const student = await dataService.findOne('users', { _id: studentId, bypassRoleScope: true }, req.tenantId);
    let targetMentorId = student ? (student.assignedMentorId || student.mentor || null) : null;
    
    if (!targetMentorId && student) {
      const allMentors = await dataService.find('users', { role: 'mentor', bypassRoleScope: true }, req.tenantId);
      const deptMentor = allMentors.find(m => m.departmentCode && student.departmentCode && m.departmentCode.toLowerCase() === student.departmentCode.toLowerCase());
      targetMentorId = deptMentor ? (deptMentor._id || deptMentor.id) : (allMentors[0]?._id || allMentors[0]?.id || null);
    }

    const queryDoc = {
      tenantId: req.tenantId,
      parentId: parentUser._id || req.user.id,
      parentName: parentUser.name || 'Ward Parent',
      parentEmail: parentUser.email || parentUser.username || '',
      studentId: student ? (student._id || student.id || studentId) : studentId,
      studentName: student ? (student.name || student.email) : 'Ward Student',
      mentorId: targetMentorId,
      subject: subject || 'Ward Progress Inquiry',
      message: message,
      status: 'PENDING',
      createdAt: new Date()
    };

    const createdQuery = await dataService.create('parentQueries', queryDoc);

    if (targetMentorId) {
      await dataService.create('notifications', {
        tenantId: req.tenantId,
        user: targetMentorId,
        title: `New Query from Parent: ${parentUser.name}`,
        message: `Regarding ${student ? student.name : 'Student'}: ${subject || 'Inquiry'} — "${message.substring(0, 50)}..."`,
        type: 'INFO',
        read: false,
        createdAt: new Date()
      });
    }

    res.json({ success: true, message: 'Message delivered to faculty mentor successfully.', query: createdQuery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getParentQueries = async (req, res) => {
  try {
    const parentId = req.user.id;
    const allQueries = await dataService.find('parentQueries', { bypassRoleScope: true }, req.tenantId);
    const myQueries = allQueries
      .filter(q => String(q.parentId) === String(parentId))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, queries: myQueries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMentorParentQueries = async (req, res) => {
  try {
    // Within the educational tenant, allow faculty mentors and HODs to view all parent communications
    // to guarantee zero dropped messages or unanswered inquiries regardless of assignment changes.
    const allQueries = await dataService.find('parentQueries', { bypassRoleScope: true }, req.tenantId);
    const relevantQueries = allQueries.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, queries: relevantQueries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.replyParentQuery = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;
    if (!replyMessage) {
      return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
    }

    const mentorUser = await dataService.findOne('users', { _id: req.user.id, bypassRoleScope: true }, req.tenantId);
    const mentorName = mentorUser ? mentorUser.name : 'Faculty Mentor';

    const updated = await dataService.updateOne(
      'parentQueries',
      { _id: id, bypassRoleScope: true },
      {
        status: 'REPLIED',
        replyMessage,
        repliedBy: mentorName,
        repliedAt: new Date()
      },
      req.tenantId
    );

    if (updated && updated.parentId) {
      await dataService.create('parentAlerts', {
        tenantId: req.tenantId,
        parentId: updated.parentId,
        studentId: updated.studentId,
        studentName: updated.studentName || 'Your Ward',
        title: `Mentor Replied to your query: "${updated.subject}"`,
        message: `Reply from ${mentorName}: ${replyMessage}`,
        alertType: 'ACADEMIC',
        isRead: false,
        createdAt: new Date()
      });
    }

    res.json({ success: true, message: 'Reply sent to parent successfully.', query: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.selfDeleteParent = async (req, res) => {
  try {
    const parentId = req.user.id;
    const parentUser = await dataService.findOne('users', { _id: parentId, bypassRoleScope: true }, req.tenantId);
    
    if (!parentUser || parentUser.role !== 'parent') {
      return res.status(404).json({ success: false, message: 'Guardian account not found or unauthorized.' });
    }

    const allStudents = await dataService.find('users', { role: 'student', bypassRoleScope: true }, req.tenantId);
    let unlinkedCount = 0;
    for (const s of allStudents) {
      const matchDirectId = parentUser.studentId && (String(s._id) === String(parentUser.studentId) || String(s.id) === String(parentUser.studentId));
      const matchParentId = s.parentUserId && String(s.parentUserId) === String(parentUser._id || parentId);
      const matchEmail = s.parentEmail && parentUser.email && s.parentEmail.toLowerCase() === parentUser.email.toLowerCase();
      
      if (matchDirectId || matchParentId || matchEmail) {
        await dataService.updateOne('users', { _id: s._id, bypassRoleScope: true }, {
          parentUserId: null,
          parentEmail: null,
          needsParentLogin: true
        }, req.tenantId);
        unlinkedCount++;
      }
    }

    await dataService.deleteOne('users', { _id: parentId, bypassRoleScope: true }, req.tenantId);

    await dataService.create('auditLogs', {
      tenantId: req.tenantId,
      actorId: String(parentId || 'sys-actor'),
      actorName: parentUser.name || parentUser.email || 'Guardian Account',
      action: 'SELF_DELETE_PARENT',
      resource: 'User',
      beforeState: parentUser,
      afterState: { unlinkedCount }
    });

    res.json({ success: true, message: 'Your guardian account has been deleted and unlinked from your ward(s).' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

