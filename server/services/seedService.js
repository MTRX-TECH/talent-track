const User = require('../models/User');
const Department = require('../models/Department');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const SystemSetting = require('../models/SystemSetting');
const Role = require('../models/Role');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Institution = require('../models/Institution');
const crypto = require('crypto');

const genId = () => crypto.randomBytes(8).toString('hex');

const seedDefaultSubscriptionPlans = async () => {
  const count = await SubscriptionPlan.countDocuments();
  if (count === 0) {
    console.log('[SeedService] Populating database-driven Subscription Plans...');
    await SubscriptionPlan.insertMany([
      {
        planCode: 'basic',
        name: 'Basic',
        monthlyPrice: 600,
        yearlyPrice: 6000,
        monthlySavings: 0,
        yearlySavings: 1200,
        maxStudents: 100,
        maxStorageMB: 1000,
        features: [
          'Limited student capacity (100 students)',
          'Limited storage (1 GB)',
          'Standard reports & analytics',
          'Excel exports',
          'Community support',
        ],
      },
      {
        planCode: 'standard',
        name: 'Standard',
        monthlyPrice: 1200,
        yearlyPrice: 12000,
        monthlySavings: 0,
        yearlySavings: 2400,
        maxStudents: 500,
        maxStorageMB: 5000,
        features: [
          'Increased student capacity (500 students)',
          'Expanded storage (5 GB)',
          'Advanced reports & analytics',
          'Priority support',
          'Custom department modules',
        ],
      },
      {
        planCode: 'premium',
        name: 'Premium',
        monthlyPrice: 2000,
        yearlyPrice: 20000,
        monthlySavings: 0,
        yearlySavings: 4000,
        maxStudents: -1, // Unlimited
        maxStorageMB: -1, // Unlimited
        features: [
          'Unlimited student capacity',
          'Unlimited storage & uploads',
          'Unlimited departments & courses',
          'Full analytics & custom reports',
          'Dedicated 24/7 priority support',
          'All future premium modules included',
        ],
      },
    ]);
  }
};

const autoSeedIfEmpty = async () => {
  try {
    await seedDefaultSubscriptionPlans();

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[SeedService] Database contains ${userCount} users. Skipping initial demo tenant seed.`);
      return { seeded: false, message: 'Database already populated' };
    }

    console.log('[SeedService] Seeding default roles, Super Admin, and initial demo institution...');

    await Role.insertMany([
      { name: 'superadmin', description: 'MTRX TECH Global Administrator', permissions: ['*'] },
      { name: 'admin', description: 'Institutional Administrator', permissions: ['manage_users', 'manage_departments', 'manage_milestones', 'excel_import_export'] },
      { name: 'hod', description: 'Head of Department', permissions: ['view_dept_analytics', 'manage_dept_students'] },
      { name: 'mentor', description: 'Faculty Mentor', permissions: ['verify_milestones', 'provide_feedback', 'view_mentees'] },
      { name: 'student', description: 'Enrolled Student', permissions: ['add_milestones', 'set_goals', 'view_leaderboard'] },
    ]);

    const superAdmin = await User.create({
      tenantId: 'TNT_GLOBAL',
      institutionId: 'INST_GLOBAL',
      customId: genId(),
      name: 'Super Admin',
      username: 'superadmin',
      email: 'superadmin@mtrxtech.com',
      password: 'superadmin123',
      role: 'superadmin',
      domain: 'GLOBAL',
    });

    const tenantId = 'TNT_DEMO_1001';
    const institutionId = 'INST_DEMO_1001';

    const cseDept = await Department.create({
      tenantId,
      institutionId,
      code: 'CSE',
      name: 'Computer Science & Engineering',
      description: 'Department of Computer Science & Engineering',
    });
    await Department.create({
      tenantId,
      institutionId,
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      description: 'Department of Electronics & Communication Engineering',
    });
    await Department.create({
      tenantId,
      institutionId,
      code: 'MECH',
      name: 'Mechanical Engineering',
      description: 'Department of Mechanical Engineering',
    });

    const adminUser = await User.create({
      tenantId,
      institutionId,
      customId: genId(),
      name: 'Admin User',
      username: 'admin',
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin',
      domain: 'CSE',
    });

    const hodUser = await User.create({
      tenantId,
      institutionId,
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
      tenantId,
      institutionId,
      customId: mentorId,
      name: 'Dr. Mentor',
      username: 'mentor1',
      password: 'mentor123',
      role: 'mentor',
      domain: 'CSE',
    });

    const studentUser = await User.create({
      tenantId,
      institutionId,
      customId: genId(),
      name: 'EMPEROR',
      username: 'student1',
      password: 'student123',
      role: 'student',
      domain: 'CSE',
      mentorId: mentorId,
    });

    const now = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);

    await Institution.create({
      tenantId,
      institutionId,
      name: 'Ramco Institute of Technology',
      logo: '',
      address: 'Rajapalayam, Tamil Nadu',
      email: 'info@ritrjpm.ac.in',
      phone: '04563 233700',
      website: 'https://ritrjpm.ac.in',
      adminId: adminUser.customId,
      adminName: adminUser.name,
      adminEmail: adminUser.username,
      adminMobile: '9876543210',
      subscription: {
        planCode: 'premium',
        planName: 'Premium',
        billingCycle: 'yearly',
        status: 'active',
        trialStatus: 'no_trial',
        subscriptionStartDate: now,
        subscriptionExpiryDate: expiry,
        freePremiumStatus: 'enabled',
        sponsoredBy: 'MTRX TECH',
        lastPaymentDate: now,
        nextRenewalDate: expiry,
        maxStudentLimit: -1,
      },
      status: 'active',
    });

    await Milestone.create({
      tenantId,
      institutionId,
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
      tenantId,
      institutionId,
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
      message: 'Database seeded with default accounts & Subscription Plans.',
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

module.exports = { autoSeedIfEmpty, seedDefaultSubscriptionPlans };
