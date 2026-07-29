const RecruiterProfile = require('../models/RecruiterProfile');
const PlacementDrive = require('../models/PlacementDrive');
const PlacementApplication = require('../models/PlacementApplication');

exports.getAssignedDrives = async (req, res) => {
  try {
    const recruiter = await RecruiterProfile.findOne({ email: req.user.email, tenantId: req.tenantId });
    const filter = { tenantId: req.tenantId };

    if (recruiter && recruiter.companyId) {
      filter.companyId = recruiter.companyId;
    } else if (recruiter && recruiter.assignedDrives && recruiter.assignedDrives.length > 0) {
      filter._id = { $in: recruiter.assignedDrives };
    }

    const drives = await PlacementDrive.find(filter);
    res.json({ success: true, drives });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load assigned recruiter drives: ' + err.message });
  }
};

exports.getDriveApplicants = async (req, res) => {
  try {
    const { driveId } = req.params;
    const drive = await PlacementDrive.findOne({ _id: driveId, tenantId: req.tenantId });

    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found or access unauthorized.' });
    }

    const applicants = await PlacementApplication.find({ tenantId: req.tenantId, driveId });
    res.json({ success: true, applicants });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load drive applicants: ' + err.message });
  }
};

exports.submitShortlistFeedback = async (req, res) => {
  try {
    const { applicationId, status, remarks } = req.body;
    if (!applicationId || !status) {
      return res.status(400).json({ success: false, message: 'applicationId and status are required.' });
    }

    const application = await PlacementApplication.findOne({ _id: applicationId, tenantId: req.tenantId });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found.' });
    }

    application.status = status;
    application.remarks = remarks || application.remarks;
    await application.save();

    res.json({ success: true, application, message: `Candidate status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit recruiter feedback: ' + err.message });
  }
};
