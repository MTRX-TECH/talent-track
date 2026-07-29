const User = require('../models/User');
const Milestone = require('../models/Milestone');
const PlacementDrive = require('../models/PlacementDrive');
const Company = require('../models/Company');

exports.globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.json({ success: true, results: { students: [], milestones: [], drives: [], companies: [] } });
    }

    const regex = new RegExp(query, 'i');
    const students = await User.find({ tenantId: req.tenantId, role: 'student', $or: [{ name: regex }, { email: regex }, { rollNumber: regex }] }).limit(10).catch(() => []);
    const milestones = await Milestone.find({ tenantId: req.tenantId, $or: [{ title: regex }, { category: regex }] }).limit(10).catch(() => []);
    const drives = await PlacementDrive.find({ tenantId: req.tenantId, $or: [{ companyName: regex }, { jobRole: regex }] }).limit(10).catch(() => []);
    const companies = await Company.find({ tenantId: req.tenantId, $or: [{ name: regex }, { industry: regex }] }).limit(10).catch(() => []);

    res.json({
      success: true,
      query,
      results: {
        students,
        milestones,
        drives,
        companies
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
