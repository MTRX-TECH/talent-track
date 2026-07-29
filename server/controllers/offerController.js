const OfferLetter = require('../models/OfferLetter');
const User = require('../models/User');

exports.getOffers = async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId };
    if (req.user && req.user.role === 'student') {
      filter.studentId = req.user.id;
    }
    const offers = await OfferLetter.find(filter);
    res.json({ success: true, offers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch offers: ' + err.message });
  }
};

exports.issueOffer = async (req, res) => {
  try {
    const { companyName, jobRole, studentId, ctc, acceptanceDeadline, joiningDate, offerLetterUrl } = req.body;

    if (!companyName || !jobRole || !studentId || !ctc || !acceptanceDeadline) {
      return res.status(400).json({
        success: false,
        message: 'companyName, jobRole, studentId, ctc, and acceptanceDeadline are required.'
      });
    }

    const student = await User.findOne({ _id: studentId, tenantId: req.tenantId });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Target student not found.' });
    }

    const offer = new OfferLetter({
      tenantId: req.tenantId,
      companyName,
      jobRole,
      studentId: student._id,
      studentName: student.name,
      ctc: Number(ctc),
      acceptanceDeadline,
      joiningDate: joiningDate || 'TBD',
      offerLetterUrl: offerLetterUrl || '',
      acceptanceStatus: 'PENDING'
    });

    await offer.save();
    res.json({ success: true, offer, message: `Offer letter issued for ${student.name} (${companyName})` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database write error issuing offer: ' + err.message });
  }
};

exports.respondToOffer = async (req, res) => {
  try {
    const { offerId, action } = req.body; // 'ACCEPTED' | 'REJECTED'
    if (!offerId || !action || !['ACCEPTED', 'REJECTED'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Valid offerId and action (ACCEPTED or REJECTED) are required.' });
    }

    const offer = await OfferLetter.findOne({ _id: offerId, tenantId: req.tenantId });

    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer record not found.' });
    }

    // Verify ownership if student
    if (req.user.role === 'student' && offer.studentId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized offer response.' });
    }

    offer.acceptanceStatus = action;
    await offer.save();

    res.json({ success: true, offer, message: `Offer status updated to ${offer.acceptanceStatus}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error updating offer response: ' + err.message });
  }
};
