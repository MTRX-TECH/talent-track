const dataService = require('../services/dataService');
const bcrypt = require('bcryptjs');
const { calculatePRS } = require('../services/scoringService');

exports.getStudents = async (req, res) => {
  try {
    const students = await dataService.find('users', { role: 'student', bypassRoleScope: true }, req.tenantId);
    const milestones = await dataService.find('milestones', {}, req.tenantId).catch(() => []);
    const offers = await dataService.find('offers', {}, req.tenantId).catch(() => []);

    const safeStudents = students
      .map(s => {
        const copy = { ...(s.toObject ? s.toObject() : s) };
        delete copy.passwordHash;

        const studentMilestones = milestones.filter(m => String(m.studentId) === String(s._id) || String(m.studentId) === String(s.id));
        const scoreData = calculatePRS(studentMilestones, {
          academicYear: s.academicYear,
          gpa: s.gpa,
          internshipDays: s.internshipDays,
          hasLeadershipRole: s.hasLeadershipRole
        });

        copy.prs = scoreData.prs;
        copy.rsi = scoreData.rsi;
        copy.hasOffer = offers.some(o => (String(o.studentId) === String(s._id) || (o.studentEmail && s.email && o.studentEmail.toLowerCase() === s.email.toLowerCase())) && o.status !== 'REJECTED');
        return copy;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, students: safeStudents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const target = await dataService.findOne('users', { _id: id, bypassRoleScope: true }, req.tenantId);
    if (!target) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    if (req.user.role === 'mentor' && target.role !== 'student') {
      return res.status(403).json({ success: false, message: "Mentors are only authorized to delete student logins." });
    }

    // Delete the student login
    await dataService.deleteOne('users', { _id: id, bypassRoleScope: true }, req.tenantId);

    // Cascade delete any connected parent account associated with this student
    const allParents = await dataService.find('users', { role: 'parent', bypassRoleScope: true }, req.tenantId);
    let deletedParentsCount = 0;
    for (const p of allParents) {
      const matchStudentId = String(p.studentId || p.studentUser || '') === String(id) || String(p.studentId || '') === String(target._id);
      const matchParentId = target.parentUserId && String(p._id) === String(target.parentUserId);
      const matchParentEmail = target.parentEmail && p.email && p.email.toLowerCase() === target.parentEmail.toLowerCase();

      if (matchStudentId || matchParentId || matchParentEmail) {
        await dataService.deleteOne('users', { _id: p._id, bypassRoleScope: true }, req.tenantId);
        deletedParentsCount++;
        // Audit log parent cascade deletion
        await dataService.create('auditLogs', {
          tenantId: req.tenantId,
          actorId: req.user.id || 'system',
          actorName: req.user.name || req.user.email || 'System',
          action: 'CASCADE_DELETE_PARENT',
          resource: 'User',
          details: `Automatically deleted associated parent account (${p.email || p._id}) when student login (${target.email || id}) was deleted.`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Audit log student deletion
    await dataService.create('auditLogs', {
      tenantId: req.tenantId,
      actorId: req.user.id || 'system',
      actorName: req.user.name || req.user.email || 'System',
      action: 'DELETE_STUDENT',
      resource: 'User',
      details: `Deleted student login: ${target.name} (${target.email || id}). Cascaded to delete ${deletedParentsCount} linked parent account(s).`,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: `Student login deleted successfully. Removed ${deletedParentsCount} connected parent account(s).`,
      deletedParentsCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setupParent = async (req, res) => {
  try {
    const { parentName, parentEmail, parentPassword } = req.body;
    const studentId = req.user.id;

    if (!parentName || !parentEmail || !parentPassword) {
      return res.status(400).json({ success: false, message: "All fields are required to create a parent login." });
    }

    // Strictly enforce 1 active parent account limit per student
    const allParents = await dataService.find('users', { role: 'parent', bypassRoleScope: true }, req.tenantId);
    const activeParent = allParents.find(p => 
      String(p.studentId || p.studentUser || '') === String(studentId) || 
      (req.user.parentUserId && String(p._id) === String(req.user.parentUserId)) ||
      (req.user.parentEmail && p.email && p.email.toLowerCase() === (req.user.parentEmail || '').toLowerCase())
    );

    if (activeParent && activeParent.isActive !== false) {
      return res.status(400).json({ 
        success: false, 
        message: `An active parent login already exists (${activeParent.email || activeParent.username}). You can only create one parent login until the existing account is deleted.` 
      });
    }

    // Check if email already exists
    const existing = await dataService.findOne('users', { email: parentEmail.toLowerCase(), bypassRoleScope: true }, req.tenantId);
    if (existing) {
      return res.status(400).json({ success: false, message: "A user with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(parentPassword, salt);

    const parentUserDoc = {
      tenantId: req.tenantId,
      name: parentName,
      email: parentEmail.toLowerCase(),
      username: parentEmail.toLowerCase(),
      passwordHash,
      role: 'parent',
      studentId: studentId,
      needsPasswordChange: false,
      isActive: true,
      createdAt: new Date()
    };

    const createdParent = await dataService.create('users', parentUserDoc);

    // Update the student to link parent and remove setup flag
    const updatedStudent = await dataService.updateOne(
      'users',
      { _id: studentId, bypassRoleScope: true },
      { 
        needsParentLogin: false, 
        parentUserId: createdParent._id || createdParent.id, 
        parentEmail: createdParent.email 
      },
      req.tenantId
    );

    const baseObj = updatedStudent ? (updatedStudent.toObject ? updatedStudent.toObject() : updatedStudent) : req.user;
    const safeStudent = { ...baseObj };
    delete safeStudent.passwordHash;
    safeStudent.needsParentLogin = false;
    safeStudent.parentEmail = createdParent.email;

    res.json({ success: true, message: "Parent login created successfully.", user: safeStudent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getParentStatus = async (req, res) => {
  try {
    const studentId = req.user.id;
    const studentUser = await dataService.findOne('users', { _id: studentId, bypassRoleScope: true }, req.tenantId);
    
    const allParents = await dataService.find('users', { role: 'parent', bypassRoleScope: true }, req.tenantId);
    const activeParent = allParents.find(p => 
      String(p.studentId || p.studentUser || '') === String(studentId) || 
      (studentUser && studentUser.parentUserId && String(p._id) === String(studentUser.parentUserId)) ||
      (studentUser && studentUser.parentEmail && p.email && p.email.toLowerCase() === String(studentUser.parentEmail).toLowerCase())
    );

    if (activeParent && activeParent.isActive !== false) {
      return res.json({
        success: true,
        hasActiveParent: true,
        parentEmail: activeParent.email || activeParent.username,
        parentName: activeParent.name,
        createdAt: activeParent.createdAt || null
      });
    }

    // Automatically reconcile if DB records show parent was deleted but flag wasn't updated
    if (studentUser && (!studentUser.needsParentLogin || studentUser.parentUserId)) {
      await dataService.updateOne('users', { _id: studentId, bypassRoleScope: true }, {
        needsParentLogin: true,
        parentUserId: null,
        parentEmail: null
      }, req.tenantId);
    }

    res.json({
      success: true,
      hasActiveParent: false,
      parentEmail: null,
      message: 'No active parent account linked. You can set up your parent login now.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

