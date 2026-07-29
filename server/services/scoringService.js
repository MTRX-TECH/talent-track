/**
 * PROPRIETARY ALGORITHMIC PLACEMENT READINESS SCORE (PRS) CALCULATOR
 * Tenant-Configurable Weightings & Cohort-Normalized Scoring Engine
 */

function calculatePRS(milestones = [], studentMeta = {}, customWeights = null) {
  // Default Tenant Weights
  const weights = customWeights || {
    milestones: 40,
    internships: 30,
    academics: 20,
    softSkills: 0,
    leadership: 10
  };

  let milestoneRaw = 0;
  let internshipRaw = 0;
  let academicRaw = 0;
  let leadershipRaw = 0;

  // 1. Milestone Category Accumulation
  milestones.filter(m => m.status === 'APPROVED' || m.status === 'verified').forEach(m => {
    switch (m.category) {
      case 'Patents':
        milestoneRaw += 30;
        break;
      case 'Publications':
      case 'Research':
        milestoneRaw += 25;
        break;
      case 'Hackathons':
      case 'Competitions':
        milestoneRaw += 15;
        break;
      case 'Certifications':
        milestoneRaw += 10;
        break;
      default:
        milestoneRaw += 5;
    }
  });

  // Task 4: Cohort Normalization Factor based on Academic Year
  // Earlier academic year students get cohort scaling factor so they aren't unfairly disadvantaged
  let cohortMultiplier = 1.0;
  const academicYear = studentMeta.academicYear || '2025-2026';
  if (studentMeta.yearLevel === 1) cohortMultiplier = 1.6;
  else if (studentMeta.yearLevel === 2) cohortMultiplier = 1.35;
  else if (studentMeta.yearLevel === 3) cohortMultiplier = 1.15;

  const milestoneScore = Math.min(Math.round(milestoneRaw * cohortMultiplier), weights.milestones);
  let rawSum = milestoneScore;
  let activeMaxPossible = weights.milestones;
  
  const missingComponents = [];
  let internshipScore = 0;
  let academicScore = 0;
  let leadershipScore = 0;

  // 2. Internship Weight Calculation
  if (studentMeta.internshipDays != null) {
    const internshipDays = studentMeta.internshipDays;
    internshipScore = Math.min(Math.round((internshipDays / 90) * weights.internships), weights.internships);
    rawSum += internshipScore;
    activeMaxPossible += weights.internships;
  } else {
    missingComponents.push('internshipDays');
  }

  // 3. Academic Weight Calculation
  if (studentMeta.gpa != null) {
    const gpa = studentMeta.gpa;
    academicScore = Math.min(Math.round((gpa / 10) * weights.academics), weights.academics);
    rawSum += academicScore;
    activeMaxPossible += weights.academics;
  } else {
    missingComponents.push('gpa');
  }

  // 4. Leadership & Clubs Weight Calculation
  if (studentMeta.hasLeadershipRole != null) {
    leadershipScore = studentMeta.hasLeadershipRole ? weights.leadership : 0;
    rawSum += leadershipScore;
    activeMaxPossible += weights.leadership;
  } else {
    missingComponents.push('hasLeadershipRole');
  }

  // Total Composite Placement Readiness Score (Capped at 100)
  // Scale the PRS up to 100 based only on the ACTIVE max possible weights
  const prs = activeMaxPossible > 0 ? Math.min(Math.round((rawSum / activeMaxPossible) * 100), 100) : 0;

  // Resume Strength Index (RSI) Calculation
  const rsi = Math.min(Math.round(prs * 0.92 + 8), 100);

  return {
    prs,
    rsi,
    weights,
    incompleteProfile: missingComponents.length > 0,
    missingComponents,
    breakdown: {
      milestoneScore,
      internshipScore,
      academicScore,
      leadershipScore
    }
  };
}

module.exports = { calculatePRS };
