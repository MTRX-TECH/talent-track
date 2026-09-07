const User = require('../models/User');

exports.getFaculty = async (req, res) => {
  try {
    const query = { role: { $in: ['mentor', 'hod', 'admin', 'faculty'] } };
    
    if (req.user.role === 'hod') {
      query.role = { $in: ['mentor', 'faculty'] };
    } else if (req.user.role === 'admin') {
      query.role = 'hod';
    }

    const faculty = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, faculty });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // HODs can only delete mentors and faculty
    if (req.user.role === 'hod' && target.role !== 'mentor' && target.role !== 'faculty') {
      return res.status(403).json({ success: false, message: "HODs are only authorized to delete mentors and faculty." });
    }

    // Admins can only delete HODs
    if (req.user.role === 'admin' && target.role !== 'hod') {
      return res.status(403).json({ success: false, message: "Admins are only authorized to delete HODs." });
    }

    await User.findByIdAndDelete(id);

    // TODO: Audit logging could be added here if needed

    res.json({ success: true, message: "Faculty member deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
