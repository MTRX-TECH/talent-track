const Milestone = require('../models/Milestone');
const Notification = require('../models/Notification');
const { generatePresignedUploadUrl } = require('../services/r2Service');

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'docx'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

exports.getMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find({ tenantId: req.tenantId }).catch(() => []);
    res.json({ success: true, milestones });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPresignedUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    if (fileSize && Number(fileSize) > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum allowed limit of 10MB.'
      });
    }

    const ext = fileName ? fileName.split('.').pop().toLowerCase() : 'pdf';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file extension '.${ext}'. Allowed extensions: pdf, jpg, png, docx.`
      });
    }

    if (fileType && !ALLOWED_MIME_TYPES.includes(fileType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported MIME type '${fileType}'. Allowed types: PDF, JPEG, PNG, DOCX.`
      });
    }
    
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'fileName and fileType must be explicitly provided.'
      });
    }

    const uploadData = await generatePresignedUploadUrl(fileName, fileType, req.tenantId);
    res.json({ success: true, ...uploadData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createMilestone = async (req, res) => {
  try {
    const { title, category, description, proofDocumentUrl } = req.body;

    if (proofDocumentUrl && !proofDocumentUrl.startsWith('http')) {
      const ext = proofDocumentUrl.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({
          success: false,
          message: `Invalid proof document extension '.${ext}'. Allowed extensions: pdf, jpg, png, docx.`
        });
      }
    }

    let points = 100;
    if (category === 'Patents') points = 300;
    else if (category === 'Publications' || category === 'Research') points = 250;
    else if (category === 'Hackathons') points = 200;

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({ success: false, message: 'Unauthorized. User information is missing.' });
    }

    const newMs = new Milestone({
      tenantId: req.tenantId,
      studentId: req.user.id,
      studentName: req.user.name,
      title,
      category,
      description,
      proofDocumentUrl: proofDocumentUrl,
      status: 'PENDING',
      points
    });

    await newMs.save().catch(() => null);
    res.json({ success: true, milestone: newMs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, proofDocumentUrl } = req.body;

    const ms = await Milestone.findById(id).catch(() => null);
    if (ms) {
      ms.title = title || ms.title;
      ms.category = category || ms.category;
      ms.description = description || ms.description;
      ms.proofDocumentUrl = proofDocumentUrl || ms.proofDocumentUrl;
      ms.status = 'PENDING'; // Reset to pending after resubmission
      await ms.save().catch(() => null);
    }

    res.json({ success: true, milestone: ms, message: 'Milestone resubmitted for verification' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewComments, rating, pointsOverride } = req.body;

    const ms = await Milestone.findById(id).catch(() => null);
    if (ms) {
      ms.status = status || 'APPROVED';
      ms.reviewComments = reviewComments || '';
      ms.rating = rating || ms.rating || 5;
      if (pointsOverride) ms.points = pointsOverride;
      ms.reviewedBy = req.user.name || 'Dr. Murugan S';
      await ms.save().catch(() => null);

      // Create notification for student
      await Notification.create({
        tenantId: req.tenantId,
        userId: ms.studentId,
        title: `Milestone ${ms.status}: ${ms.title}`,
        message: reviewComments ? `Mentor Feedback: ${reviewComments}` : `Your milestone has been marked as ${ms.status}.`,
        category: ms.status === 'APPROVED' ? 'verified' : 'rejected'
      }).catch(() => null);

      // Update PRS if approved
      if (ms.status === 'APPROVED' && ms.studentId) {
        const User = require('../models/User');
        const student = await User.findById(ms.studentId);
        if (student) {
          const prsIncrement = Math.floor((ms.points || 100) / 10);
          student.placementReadinessScore = Math.min(100, (student.placementReadinessScore || 0) + prsIncrement);
          await student.save();
        }
      }
    }

    res.json({ success: true, milestone: ms, message: `Milestone updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkVerifyMilestones = async (req, res) => {
  try {
    const { milestoneIds, status } = req.body;
    await Milestone.updateMany(
      { _id: { $in: milestoneIds }, tenantId: req.tenantId },
      { status: status || 'APPROVED', reviewedBy: req.user.name || 'Dr. Murugan S' }
    ).catch(() => null);

    res.json({ success: true, message: `Bulk updated ${milestoneIds.length} milestones to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
