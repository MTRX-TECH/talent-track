const User = require('../models/User');
const Department = require('../models/Department');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const SystemSetting = require('../models/SystemSetting');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[SeedService] Database already contains ${userCount} users. Skipping auto-seed.`);
      return { seeded: false, message: 'Database already populated' };
    }

    console.log('[SeedService] Database is empty. Seeding initial accounts & reference data...');

    await Role.insertMany([
      { name: 'superadmin', description: 'Global System Administrator', permissions: ['*'] },
      { name: 'admin', description: 'Institutional Administrator', permissions: ['manage_users', 'manage_departments', 'manage_milestones', 'excel_import_export'] },
      { name: 'hod', description: 'Head of Department', permissions: ['view_dept_analytics', 'manage_dept_students'] },
      { name: 'mentor', description: 'Faculty Mentor', permissions: ['verify_milestones', 'provide_feedback', 'view_mentees'] },
      { name: 'student', description: 'Enrolled Student', permissions: ['add_milestones', 'set_goals', 'view_leaderboard'] },
    ]);

    const cseDept = await Department.create({
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science & Engineering',
    });
    await Department.create({
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      description: 'Department of Electronics & Communication Engineering',
    });
    await Department.create({
      code: 'MECH',
      name: 'Mechanical Engineering',
      description: 'Department of Mechanical Engineering',
    });

    const superAdmin = await User.create({
      customId: genId(),
      name: 'Super Admin',
      username: 'superadmin',
      password: 'superadmin123',
      role: 'superadmin',
      domain: 'GLOBAL',
    });

    const adminUser = await User.create({
      customId: genId(),
      name: 'Admin User',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      domain: 'CSE',
    });

    const hodUser = await User.create({
      customId: genId(),
      name: 'Dr. HOD CSE',
      username: 'hod1',
      password: 'hod123',
      role: 'hod',
      domain: 'CSE',
    });

    cseDept.hodId = hodUser.customId;
    await cseDept.save();

    const mentorId = genId();
    const mentorUser = await User.create({
      customId: mentorId,
      name: 'Dr. Mentor',
      username: 'mentor1',
      password: 'mentor123',
      role: 'mentor',
      domain: 'CSE',
    });

    const studentUser = await User.create({
      customId: genId(),
      name: 'EMPEROR',
      username: 'student1',
      password: 'student123',
      role: 'student',
      domain: 'CSE',
      mentorId: mentorId,
    });

    await Milestone.create({
      customId: genId(),
      studentId: studentUser.customId,
      studentName: studentUser.name,
      title: 'Smart City Hackathon Winner',
      description: 'First prize in national level IoT Smart City hackathon project.',
      category: 'Hackathon',
      date: new Date().toISOString().split('T')[0],
      verified: 'true',
      mentorFeedback: 'Outstanding work! Very proud of your achievement.',
    });

    await Goal.create({
      customId: genId(),
      studentId: studentUser.customId,
      target: 5,
      achieved: 1,
      unit: 'milestones',
      dueDate: '2026-12-31',
    });

    console.log('[SeedService] Auto-seeding completed successfully!');
    return {
      seeded: true,
      message: 'Database seeded with default accounts.',
      accounts: {
        superadmin: 'superadmin / superadmin123',
        admin: 'admin / admin123',
        hod: 'hod1 / hod123',
        mentor: 'mentor1 / mentor123',
        student: 'student1 / student123',
      },
    };
  } catch (err) {
    console.error('[SeedService Error]', err);
    return { seeded: false, error: err.message };
  }
};

module.exports = { autoSeedIfEmpty };
