const ClassMaterial = require('../models/ClassMaterial');
const User = require('../models/User');

exports.uploadMaterial = async (req, res) => {
  try {
    const { className, materialType, title, description, fileData } = req.body;
    
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Only faculty can upload materials.' });
    }

    const material = await ClassMaterial.create({
      tenantId: req.user.tenantId,
      facultyId: req.user._id,
      className,
      materialType,
      title,
      description,
      fileData
    });

    res.json({ success: true, material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFacultyMaterials = async (req, res) => {
  try {
    const { className } = req.query;
    const filter = { facultyId: req.user._id };
    if (className) filter.className = className;
    
    const materials = await ClassMaterial.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMaterialsForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const className = student.className;
    
    // In a full implementation, you might filter by className if the student is restricted.
    // For now we just return materials that optionally match their class or all if no class is set.
    const filter = {};
    if (className) {
      filter.className = className;
    }

    const materials = await ClassMaterial.find(filter).populate('facultyId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
