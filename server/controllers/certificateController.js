const Certificate = require('../models/Certificate');

exports.getCertificates = async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId };
    if (req.user && req.user.role === 'student') {
      filter.studentId = req.user.id;
    }
    const certificates = await Certificate.find(filter).catch(() => []);
    res.json({ success: true, certificates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyPublicCertificate = async (req, res) => {
  try {
    const { certId } = req.params;
    const cert = await Certificate.findOne({
      $or: [{ certificateId: certId }, { verificationToken: certId }],
      bypassTenantScope: true
    }).catch(() => null);

    if (!cert) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: 'Certificate invalid or not found in TalentTrack registry.'
      });
    }

    res.json({
      success: true,
      isValid: cert.status === 'ACTIVE',
      certificate: {
        certificateId: cert.certificateId,
        title: cert.title,
        studentName: cert.studentName,
        issuerName: cert.issuerName,
        issueDate: cert.issueDate,
        status: cert.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
