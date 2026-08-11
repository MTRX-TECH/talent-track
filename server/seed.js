/**
 * TALENTTRACK ENTERPRISE — DATABASE SEEDER SCRIPT
 * Seeds production database with initial Tenant, Department, Production Accounts,
 * Placement Drives, Companies, Interviews, Offers, and Internships.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Tenant = require('./models/Tenant');
const Department = require('./models/Department');
const Milestone = require('./models/Milestone');
const Goal = require('./models/Goal');
const Company = require('./models/Company');
const PlacementSeason = require('./models/PlacementSeason');
const PlacementDrive = require('./models/PlacementDrive');
const PlacementApplication = require('./models/PlacementApplication');
const InterviewSchedule = require('./models/InterviewSchedule');
const OfferLetter = require('./models/OfferLetter');
const Internship = require('./models/Internship');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/talenttrack';

const seedDatabase = async () => {
  try {
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[SEED] Connected successfully.');

    // 1. Seed Tenant
    let tenant = await Tenant.findOne({ slug: 'tenant-rit' });
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Ramco Institute of Technology',
        slug: 'tenant-rit',
        domain: 'rit.edu',
        subscription: {
          plan: 'Enterprise Gold',
          status: 'ACTIVE',
          settlementStatus: 'SETTLED'
        },
        prsWeights: {
          milestones: 40,
          internships: 30,
          academics: 20,
          softSkills: 0,
          leadership: 10
        }
      });
      console.log('[SEED] Created Tenant: tenant-rit');
    }

    // 2. Seed Department
    let dept = await Department.findOne({ code: 'CSE', tenantId: 'tenant-rit' });
    if (!dept) {
      dept = await Department.create({
        tenantId: 'tenant-rit',
        name: 'Computer Science & Engineering',
        code: 'CSE'
      });
      console.log('[SEED] Created Department: CSE');
    }

    // Use pre-generated secure hashes to avoid committing plaintext credentials
    const superadminHash = '$2a$10$OpObRcla0jQiVC1KJx7UJOZdYipdhnNqul0NlMwj8UybbkHhQv8i.';
    const defaultHash = '$2a$10$jXA0vHyLrTXoi5CvQL9niO7i/3DCFwkYf9uUym.wrxfO0qsOODaXS';

    // 3. Accounts Configuration Matrix
    const accounts = [
      {
        name: 'Marapathran V (MTRX TECH CEO)',
        email: 'founder@mtrx.io',
        username: 'founder@MTRX_TECH',
        passwordHash: superadminHash,
        role: 'superadmin',
        tenantId: 'tenant-rit'
      },
      {
        name: 'Dr. Jane Smith',
        email: 'jane@univ.edu',
        username: 'admin',
        passwordHash: defaultHash,
        role: 'admin',
        tenantId: 'tenant-rit'
      },
      {
        name: 'Prof. Sundhareswaran S.K',
        email: 'hod.cse@rit.edu',
        username: 'hod',
        passwordHash: defaultHash,
        role: 'hod',
        tenantId: 'tenant-rit',
        departmentId: dept._id
      },
      {
        name: 'Dr. Murugan S',
        email: 'mentor.cse@rit.edu',
        username: 'mentor',
        passwordHash: defaultHash,
        role: 'mentor',
        tenantId: 'tenant-rit',
        departmentId: dept._id
      },
      {
        name: 'Student Alpha',
        email: 'alpha@univ.edu',
        username: 'student',
        passwordHash: defaultHash,
        role: 'student',
        tenantId: 'tenant-rit',
        departmentId: dept._id,
        rollNumber: '21CSE042',
        placementReadinessScore: 88
      },
      {
        name: 'Parent of Student Alpha',
        email: 'parent_alpha@univ.edu',
        username: 'parent',
        passwordHash: defaultHash,
        role: 'parent',
        tenantId: 'tenant-rit'
      }
    ];

    for (const acc of accounts) {
      const existing = await User.findOne({ username: acc.username, tenantId: acc.tenantId });
      if (!existing) {
        await User.create({
          ...acc,
          isActive: true
        });
        console.log(`[SEED] Created ${acc.role.toUpperCase()} Account: ${acc.username}`);
      } else {
        existing.passwordHash = acc.passwordHash;
        await existing.save();
        console.log(`[SEED] Updated password for ${acc.username}`);
      }
    }

    // 4. Seed Companies
    let google = await Company.findOne({ name: 'Google India', tenantId: 'tenant-rit' });
    if (!google) {
      google = await Company.create({
        tenantId: 'tenant-rit',
        name: 'Google India',
        industry: 'Software & AI',
        tier: 'Tier 1 (Dream)',
        averageCTC: 24.5,
        verificationStatus: 'VERIFIED'
      });
      console.log('[SEED] Created Company: Google India');
    }

    let microsoft = await Company.findOne({ name: 'Microsoft Research', tenantId: 'tenant-rit' });
    if (!microsoft) {
      microsoft = await Company.create({
        tenantId: 'tenant-rit',
        name: 'Microsoft Research',
        industry: 'Cloud & System Software',
        tier: 'Tier 1 (Dream)',
        averageCTC: 22.0,
        verificationStatus: 'VERIFIED'
      });
      console.log('[SEED] Created Company: Microsoft Research');
    }

    // 5. Seed Placement Drives
    let drive = await PlacementDrive.findOne({ companyName: 'Google India', tenantId: 'tenant-rit' });
    if (!drive) {
      drive = await PlacementDrive.create({
        tenantId: 'tenant-rit',
        companyId: google._id,
        companyName: 'Google India',
        jobRole: 'Software Development Engineer (SDE-1)',
        ctc: 24.5,
        location: 'Bengaluru / Hyderabad',
        driveDate: '2026-08-15',
        applicationDeadline: '2026-08-10',
        status: 'REGISTRATION_OPEN',
        applicantCount: 42
      });
      console.log('[SEED] Created Placement Drive: Google India SDE-1');
    }

    // 6. Seed Student Milestones, Offers, & Internships
    const studentUser = await User.findOne({ username: 'student' });
    if (studentUser) {
      const msCount = await Milestone.countDocuments({ studentId: studentUser._id });
      if (msCount === 0) {
        await Milestone.create([
          {
            tenantId: 'tenant-rit',
            studentId: studentUser._id,
            studentName: studentUser.name,
            title: 'National AI Hackathon 2026 - 1st Rank',
            category: 'Hackathons',
            description: 'Secured 1st place building an agentic campus manager.',
            proofDocumentUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&q=80',
            status: 'APPROVED',
            points: 200,
            reviewedBy: 'Dr. Murugan S'
          },
          {
            tenantId: 'tenant-rit',
            studentId: studentUser._id,
            studentName: studentUser.name,
            title: 'IEEE Research Paper Publication',
            category: 'Research',
            description: 'Published paper on Multi-Agent Reinforcement Learning.',
            proofDocumentUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80',
            status: 'NEEDS_REVISION',
            points: 250,
            rejectionReason: 'Please attach official IEEE digital library DOI link.',
            milestoneName: 'AWS Certified Cloud Practitioner'
          }
        ]);
        console.log('[SEED] Seeded initial milestones for Student Alpha');
      }

      const offerCount = await OfferLetter.countDocuments({ studentId: studentUser._id });
      if (offerCount === 0) {
        await OfferLetter.create({
          tenantId: 'tenant-rit',
          companyName: 'Microsoft Research',
          jobRole: 'Research Fellow - AI & Systems',
          studentId: studentUser._id,
          studentName: studentUser.name,
          ctc: 22.0,
          offerLetterUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&q=80',
          acceptanceStatus: 'ACCEPTED',
          acceptanceDeadline: '2026-08-30',
          joiningDate: '2026-07-01',
          offeredPackage: 1500000
        });
        console.log('[SEED] Seeded initial offer letter for Student Alpha');
      }

      const internCount = await Internship.countDocuments({ studentId: studentUser._id });
      if (internCount === 0) {
        await Internship.create({
          tenantId: 'tenant-rit',
          studentId: studentUser._id,
          studentName: studentUser.name,
          companyName: 'Amazon Web Services',
          role: 'Cloud & AI Engineer Intern',
          durationDays: 60,
          stipendAmount: 25000,
          startDate: '2026-05-01',
          endDate: '2026-07-01',
          status: 'VERIFIED',
          reviewedBy: 'Dr. Murugan S',
          prsContributionPoints: 30
        });
        console.log('[SEED] Seeded initial internship for Student Alpha');
      }
    }

    console.log('=======================================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=======================================================');
    console.log('Super Admin Credentials:');
    console.log('  • Username : founder@MTRX_TECH');
    console.log('  • Password : [See Secure Credentials Block]');
    console.log('=======================================================');

  } catch (err) {
    console.error('[SEED ERROR]', err.message);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
