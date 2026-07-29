const DigitalBadge = require('../models/DigitalBadge');
const Certificate = require('../models/Certificate');

exports.getStudentCredentials = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized. User ID is unavailable.' });
    }
    const studentId = req.user.id;
    const badges = await DigitalBadge.find({ tenantId: req.tenantId, studentId }).catch(() => []);
    const certificates = await Certificate.find({ tenantId: req.tenantId, studentId }).catch(() => []);

    res.json({
      success: true,
      wallet: {
        totalCredentials: badges.length + certificates.length,
        badges,
        certificates
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
