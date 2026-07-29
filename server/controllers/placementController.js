const dataService = require('../services/dataService');

exports.getSeasons = async (req, res) => {
  try {
    const seasons = await dataService.find('placementSeasons', {}, req.tenantId);
    res.json({ success: true, seasons });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch placement seasons: ' + err.message });
  }
};

exports.createSeason = async (req, res) => {
  try {
    const { title, academicYear, startDate, endDate, targetPlacementPercentage } = req.body;
    if (!title || !academicYear || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'title, academicYear, startDate, and endDate are required.' });
    }

    const season = await dataService.create('placementSeasons', {
      tenantId: req.tenantId,
      title,
      academicYear,
      startDate,
      endDate,
      targetPlacementPercentage: targetPlacementPercentage || 95
    });

    res.json({ success: true, season, message: 'Placement season created.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create placement season: ' + err.message });
  }
};

exports.checkEligibility = async (req, res) => {
  try {
    const { driveId, studentId } = req.body;
    if (!driveId) {
      return res.status(400).json({ success: false, message: 'driveId is required.' });
    }

    const targetStudentId = studentId || req.user.id;
    const drive = await dataService.findOne('placementDrives', { _id: driveId }, req.tenantId);
    const student = await dataService.findOne('users', { _id: targetStudentId }, req.tenantId);

    if (!drive || !student) {
      return res.status(404).json({ success: false, message: 'Placement drive or student record not found.' });
    }

    const minPRS = drive.eligibilityCriteria ? drive.eligibilityCriteria.minPRS : 75;
    const studentPRS = student.placementReadinessScore || 88;

    const isEligible = studentPRS >= minPRS;
    res.json({
      success: true,
      isEligible,
      studentPRS,
      minPRS,
      reason: isEligible ? 'Student satisfies drive criteria.' : `Student PRS (${studentPRS}) is below required minimum (${minPRS}).`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Eligibility check failed: ' + err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const filter = {};
    if (req.user && req.user.role === 'student') {
      filter.studentId = req.user.id;
    }
    const applications = await dataService.find('placementApplications', filter, req.tenantId);
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications: ' + err.message });
  }
};

exports.applyForDrive = async (req, res) => {
  try {
    const { driveId } = req.body;
    if (!driveId) {
      return res.status(400).json({ success: false, message: 'driveId is required to submit application.' });
    }

    const drive = await dataService.findOne('placementDrives', { _id: driveId }, req.tenantId);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Placement drive not found.' });
    }

    const student = await dataService.findOne('users', { _id: req.user.id }, req.tenantId);
    const studentName = student ? student.name : req.user.name;

    const existing = await dataService.findOne('placementApplications', {
      driveId: drive._id || drive.id,
      studentId: req.user.id
    }, req.tenantId);

    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this placement drive.' });
    }

    const app = await dataService.create('placementApplications', {
      tenantId: req.tenantId,
      driveId: drive._id || drive.id,
      companyName: drive.companyName,
      jobRole: drive.jobRole,
      studentId: req.user.id,
      studentName,
      rollNumber: student ? student.rollNumber : '21CSE042',
      studentPRS: student ? student.placementReadinessScore : 88,
      status: 'APPLIED'
    });

    res.json({ success: true, application: app, message: `Application submitted for ${drive.companyName} - ${drive.jobRole}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database write error submitting application: ' + err.message });
  }
};
