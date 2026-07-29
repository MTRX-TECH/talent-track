const mongoose = require('mongoose');
const PlacementDrive = require('../models/PlacementDrive');
const Company = require('../models/Company');

exports.getDrives = async (req, res) => {
  try {
    const drives = await PlacementDrive.find({ tenantId: req.tenantId });
    res.json({ success: true, drives });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve placement drives: ' + err.message });
  }
};

exports.createDrive = async (req, res) => {
  try {
    const { companyName, jobRole, ctc, location, minPRS, minGPA, driveDate, applicationDeadline } = req.body;

    if (!companyName || !jobRole || !ctc || !driveDate || !applicationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Missing required placement drive parameters: companyName, jobRole, ctc, driveDate, applicationDeadline are required.'
      });
    }

    let company = await Company.findOne({ name: companyName, tenantId: req.tenantId });
    if (!company) {
      company = await Company.create({
        tenantId: req.tenantId,
        name: companyName,
        averageCTC: Number(ctc) || 10.0,
        verificationStatus: 'VERIFIED'
      });
    }

    const drive = new PlacementDrive({
      tenantId: req.tenantId,
      companyId: company ? company._id : new mongoose.Types.ObjectId(),
      companyName,
      jobRole,
      ctc: Number(ctc),
      location: location || 'Remote / On-site',
      eligibilityCriteria: {
        minPRS: Number(minPRS) || 75,
        minGPA: Number(minGPA) || 7.5,
        allowedDepartments: ['CSE', 'ECE', 'MECH', 'EEE']
      },
      driveDate,
      applicationDeadline,
      rounds: [
        { name: 'Online Assessment', order: 1 },
        { name: 'Technical Interview', order: 2 },
        { name: 'HR Round', order: 3 }
      ]
    });

    await drive.save();
    res.json({ success: true, drive, message: `Placement Drive created for ${companyName} (${jobRole})` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database write error while creating drive: ' + err.message });
  }
};
