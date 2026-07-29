const Internship = require('../models/Internship');
const User = require('../models/User');

exports.getInternships = async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId };
    if (req.user && req.user.role === 'student') {
      filter.studentId = req.user.id;
    }
    const internships = await Internship.find(filter).catch(() => []);
    res.json({ success: true, internships });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitInternship = async (req, res) => {
  try {
    const { companyName, role, durationDays, stipendAmount, startDate, endDate, certificateUrl } = req.body;
    const internship = new Internship({
      tenantId: req.tenantId,
      studentId: req.user.id || 'usr-student',
      studentName: req.user.name || 'Durga Mikila S.V',
      companyName: companyName || 'Amazon Web Services',
      role: role || 'Cloud Infrastructure Intern',
      durationDays: durationDays || 60,
      stipendAmount: stipendAmount || 25000,
      startDate: startDate || '2026-05-01',
      endDate: endDate || '2026-07-01',
      certificateUrl: certificateUrl || 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&q=80',
      status: 'SUBMITTED',
      prsContributionPoints: 30
    });

    await internship.save().catch(() => null);
    res.json({ success: true, internship, message: `Internship at ${companyName} submitted for mentor verification.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyInternship = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const internship = await Internship.findById(id).catch(() => null);

    if (internship) {
      internship.status = status || 'VERIFIED';
      internship.reviewedBy = req.user.name || 'Dr. Murugan S';
      await internship.save().catch(() => null);
    }

    res.json({ success: true, internship, message: `Internship updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
