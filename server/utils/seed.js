const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Department = require('../models/Department');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const SystemSetting = require('../models/SystemSetting');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

const genId = () => crypto.randomBytes(8).toString('hex');

const seedData = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/talenttrack_db';
    console.log(`[Seed] Connecting to MongoDB: ${connStr}...`);
    await mongoose.connect(connStr);

    console.log('[Seed] Clearing existing seed data...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Milestone.deleteMany({});
    await Goal.deleteMany({});
    await SystemSetting.deleteMany({});
    await Role.deleteMany({});
    await Permission.deleteMany({});

    console.log('[Seed] Creating System Roles & Permissions...');
    await Role.insertMany([
      { name: 'superadmin', description: 'Global System Administrator', permissions: ['*'] },
      { name: 'admin', description: 'Institutional Administrator', permissions: ['manage_users', 'manage_departments', 'manage_milestones', 'excel_import_export'] },
      { name: 'hod', description: 'Head of Department', permissions: ['view_dept_analytics', 'manage_dept_students'] },
      { name: 'mentor', description: 'Faculty Mentor', permissions: ['verify_milestones', 'provide_feedback', 'view_mentees'] },
      { name: 'student', description: 'Enrolled Student', permissions: ['add_milestones', 'set_goals', 'view_leaderboard'] },
    ]);

    console.log('[Seed] Creating Departments...');
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

    console.log('[Seed] Creating User Hierarchy...');
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

    console.log('[Seed] Creating Initial Milestones & Goals...');
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

    console.log('[Seed] System seed completed successfully.');
    console.log('----------------------------------------------------');
    console.log('Default Accounts Seeded:');
    console.log('Super Admin: superadmin / superadmin123');
    console.log('Admin:       admin / admin123');
    console.log('HOD:         hod1 / hod123');
    console.log('Mentor:      mentor1 / mentor123');
    console.log('Student:     student1 / student123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedData();
