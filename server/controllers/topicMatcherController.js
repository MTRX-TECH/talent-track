const ClassTopicLog = require('../models/ClassTopicLog');
const StudentTopicLog = require('../models/StudentTopicLog');
const User = require('../models/User');
const stringSimilarity = require('string-similarity');

exports.submitFacultyTopics = async (req, res) => {
  try {
    const { className, date, topics } = req.body;
    
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ success: false, message: 'Only faculty can submit class topics.' });
    }

    let log = await ClassTopicLog.findOne({ facultyId: req.user._id, className, date });
    if (log) {
      log.topics = topics;
      await log.save();
    } else {
      log = await ClassTopicLog.create({
        tenantId: req.user.tenantId,
        facultyId: req.user._id,
        className,
        date,
        topics
      });
    }

    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitStudentTopics = async (req, res) => {
  try {
    const { facultyId, className, date, studentTopics } = req.body;

    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can submit daily topics.' });
    }

    // 1. Fetch the faculty's topic log for that day
    const facultyLog = await ClassTopicLog.findOne({ facultyId, className, date });
    if (!facultyLog) {
      return res.status(404).json({ success: false, message: 'Faculty has not submitted topics for this class today yet. Please try again later.' });
    }

    // 2. Perform string similarity matching
    // We expect students to provide an array of headings, just like faculty.
    // E.g., Faculty: ["Introduction to AI", "Neural Networks"]
    // Student: ["intro to ai", "neural networks"]
    
    let totalScore = 0;
    
    if (facultyLog.topics.length === 0) {
       return res.status(400).json({ success: false, message: 'Faculty topic list is empty.' });
    }

    // For each student topic, find the best match in the faculty topics.
    // To prevent a single student topic matching everything, we could do bipartite matching,
    // but a simple best-match-averaging is sufficient for this feature.
    
    // Convert to lowercase for similarity matching
    const facultyTopicsLower = facultyLog.topics.map(t => t.toLowerCase());
    const studentTopicsLower = studentTopics.map(t => t.toLowerCase());

    let matchCount = 0;
    
    // A simple threshold for a "match"
    const SIMILARITY_THRESHOLD = 0.5;

    for (const fTopic of facultyTopicsLower) {
      if (studentTopicsLower.length === 0) break;
      const matches = stringSimilarity.findBestMatch(fTopic, studentTopicsLower);
      if (matches.bestMatch.rating >= SIMILARITY_THRESHOLD) {
        matchCount++;
      }
    }

    // Calculate match percentage based on how many of the faculty's topics the student successfully identified.
    const matchPercentage = matchCount / facultyLog.topics.length;
    
    const status = matchPercentage >= 0.60 ? 'acceptable' : 'flagged';

    // 3. Save the log
    let studentLog = await StudentTopicLog.findOne({ studentId: req.user._id, facultyId, className, date });
    if (studentLog) {
      studentLog.studentTopics = studentTopics;
      studentLog.matchPercentage = matchPercentage;
      studentLog.status = status;
      await studentLog.save();
    } else {
      studentLog = await StudentTopicLog.create({
        tenantId: req.user.tenantId,
        studentId: req.user._id,
        facultyId,
        className,
        date,
        studentTopics,
        matchPercentage,
        status
      });
    }

    res.json({ success: true, matchPercentage, status, log: studentLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFlaggedStudents = async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ success: false, message: 'Only mentors can view flagged students.' });
    }

    // Find all students assigned to this mentor
    const students = await User.find({ assignedMentorId: req.user._id }, '_id');
    const studentIds = students.map(s => s._id);

    const flaggedLogs = await StudentTopicLog.find({ 
      studentId: { $in: studentIds },
      status: 'flagged'
    })
    .populate('studentId', 'name username rollNumber className')
    .populate('facultyId', 'name')
    .sort({ date: -1 });

    res.json({ success: true, flaggedLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFacultyTopics = async (req, res) => {
  try {
    const logs = await ClassTopicLog.find({ facultyId: req.user._id }).sort({ date: -1 });
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
