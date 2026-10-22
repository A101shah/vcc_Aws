import type { CourseData, ComponentPolicy, CoursePolicy } from '../types';

export interface CollegeGradeTier {
  grade: string;
  minPercentage: number;
  description: string;
  color: string;
  badgeClass: string;
  gpaPoint: number;
}

/**
 * College Grading Scale:
 * > 85 : A+ (Outstanding)
 * > 80 : A  (Excellent)
 * > 75 : B+ (Very Good)
 * > 70 : B  (Good)
 * > 65 : B- (Above Average)
 * > 60 : C+ (Average)
 * > 55 : C  (Satisfactory)
 * > 50 : C- (Marginal Pass)
 * > 40 : D  (Minimum Passing threshold)
 * < 40 : F  (Fail / Repeat)
 */
export const COLLEGE_GRADE_SCALE: CollegeGradeTier[] = [
  { grade: 'A+', minPercentage: 85, description: 'Outstanding', color: '#10b981', badgeClass: 'success', gpaPoint: 10 },
  { grade: 'A',  minPercentage: 80, description: 'Excellent', color: '#06b6d4', badgeClass: 'info', gpaPoint: 9 },
  { grade: 'B+', minPercentage: 75, description: 'Very Good', color: '#3b82f6', badgeClass: 'primary', gpaPoint: 8 },
  { grade: 'B',  minPercentage: 70, description: 'Good', color: '#6366f1', badgeClass: 'purple', gpaPoint: 7 },
  { grade: 'B-', minPercentage: 65, description: 'Above Average', color: '#8b5cf6', badgeClass: 'purple', gpaPoint: 6 },
  { grade: 'C+', minPercentage: 60, description: 'Average', color: '#f59e0b', badgeClass: 'warning', gpaPoint: 5 },
  { grade: 'C',  minPercentage: 55, description: 'Satisfactory', color: '#f97316', badgeClass: 'warning', gpaPoint: 4 },
  { grade: 'C-', minPercentage: 50, description: 'Marginal Pass', color: '#eab308', badgeClass: 'warning', gpaPoint: 3 },
  { grade: 'D',  minPercentage: 40, description: 'Minimum Pass', color: '#94a3b8', badgeClass: 'secondary', gpaPoint: 2 },
  { grade: 'F',  minPercentage: 0,  description: 'Fail / Repeat', color: '#ef4444', badgeClass: 'danger', gpaPoint: 0 },
];

/**
 * Look up the corresponding college letter grade for a percentage score
 */
export function getGradeForScore(scorePercent: number): CollegeGradeTier {
  const rounded = Number(scorePercent.toFixed(2));
  for (const tier of COLLEGE_GRADE_SCALE) {
    if (rounded >= tier.minPercentage) {
      return tier;
    }
  }
  return COLLEGE_GRADE_SCALE[COLLEGE_GRADE_SCALE.length - 1];
}

/**
 * Identify if a syllabus assessment component belongs to Internal Continuous Assessment (ICA).
 * Term End Examination (TEE / ESE / Final Exam) represents the terminal 50% examination.
 */
export function isIcaComponent(component: ComponentPolicy): boolean {
  const name = (component.name || '').toLowerCase();
  if (
    name.includes('end semester') ||
    name.includes('term end') ||
    name.includes('ese') ||
    name.includes('tee') ||
    name.includes('final exam') ||
    name.includes('university exam')
  ) {
    return false;
  }
  return true;
}

export function isTeeComponent(component: ComponentPolicy): boolean {
  return !isIcaComponent(component);
}

/**
 * Institutional Course Weight Split Analysis
 * Format: Total Availability = 100 Marks
 * - ICA (Internal Continuous Assessment): 50 Marks (50%)
 * - TEE (Term End Examination): 50 Marks (50%)
 */
export function getPolicySplit(policy: CoursePolicy): {
  icaWeight: number;
  teeWeight: number;
  totalWeight: number;
  isFiftyFifty: boolean;
} {
  let icaWeight = 0;
  let teeWeight = 0;

  policy.components.forEach(c => {
    if (isIcaComponent(c)) {
      icaWeight += Number(c.weight) || 0;
    } else {
      teeWeight += Number(c.weight) || 0;
    }
  });

  return {
    icaWeight: Number(icaWeight.toFixed(1)),
    teeWeight: Number(teeWeight.toFixed(1)),
    totalWeight: Number((icaWeight + teeWeight).toFixed(1)),
    isFiftyFifty: Math.round(icaWeight) === 50 && Math.round(teeWeight) === 50
  };
}

export interface IcaBreakdown {
  totalAvailability: number;        // Standard course capacity: 100 Marks
  icaAvailability: number;          // Standard ICA capacity: 50 Marks
  teeAvailability: number;          // Standard TEE capacity: 50 Marks
  icaScore: number;                 // Weighted marks secured across completed ICA (out of 50)
  icaCompletedWeight: number;       // Evaluated weight of completed ICA components
  icaTotalWeight: number;           // Total weight allocated to all ICA components in syllabus (50%)
  icaPercentage: number;            // Percentage performance on evaluated ICA (out of evaluated weight)
  icaOverallPercentage: number;     // Contribution out of full 50 marks of ICA
  maxPossibleIcaPercentage: number; // Maximum possible percentage if 100% scored on remaining ICA
  gradeTier: CollegeGradeTier;      // Letter grade based on collegiate scale (>85 A+, >80 A, ...)
  isPassing: boolean;               // True if percentage >= 40% (Grade D or higher)
  completedIcaCount: number;
  totalIcaCount: number;
  pendingIcaComponents: ComponentPolicy[];
  icaComponents: ComponentPolicy[];
  nonIcaComponents: ComponentPolicy[];
  teeScore: number;                 // Weighted marks secured on TEE (out of 50)
  teeCompletedWeight: number;       // 50 if TEE written, 0 if pending
  teeTotalWeight: number;           // 50%
  isTeeCompleted: boolean;          // True if TEE marks recorded
}

export function calculateIcaBreakdown(courseData: CourseData): IcaBreakdown {
  const { policy, attendance, assessments } = courseData;
  const icaComponents: ComponentPolicy[] = [];
  const nonIcaComponents: ComponentPolicy[] = [];

  policy.components.forEach(comp => {
    if (isIcaComponent(comp)) {
      icaComponents.push(comp);
    } else {
      nonIcaComponents.push(comp);
    }
  });

  let icaScore = 0;
  let icaCompletedWeight = 0;
  const pendingIcaComponents: ComponentPolicy[] = [];

  icaComponents.forEach(comp => {
    if (comp.type === 'attendance') {
      const attendancePoints = (attendance.percentage / 100) * comp.weight;
      icaScore += attendancePoints;
      icaCompletedWeight += comp.weight;
      return;
    }

    const compAssessments = assessments.filter(a => a.component_name === comp.name);
    if (compAssessments.length > 0) {
      let totalFraction = 0;
      compAssessments.forEach(a => {
        totalFraction += (a.score / a.max_score);
      });
      const avgFraction = totalFraction / compAssessments.length;
      icaScore += avgFraction * comp.weight;
      icaCompletedWeight += comp.weight;
    } else {
      pendingIcaComponents.push(comp);
    }
  });

  const icaTotalWeight = icaComponents.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const icaPercentage = icaCompletedWeight === 0 
    ? 0 
    : Number(((icaScore / icaCompletedWeight) * 100).toFixed(2));
  const icaOverallPercentage = icaTotalWeight === 0 
    ? 0 
    : Number(((icaScore / icaTotalWeight) * 100).toFixed(2));
  
  const remainingIcaWeight = Math.max(0, icaTotalWeight - icaCompletedWeight);
  const maxPossibleIcaPercentage = icaTotalWeight === 0 
    ? 0 
    : Number((((icaScore + remainingIcaWeight) / icaTotalWeight) * 100).toFixed(2));

  const gradeTier = getGradeForScore(icaPercentage);
  const isPassing = icaPercentage >= 40;

  // Calculate TEE (50%) performance if recorded
  let teeScore = 0;
  let teeCompletedWeight = 0;
  const teeTotalWeight = nonIcaComponents.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) || 50;
  let isTeeCompleted = false;

  nonIcaComponents.forEach(comp => {
    const compAssessments = assessments.filter(a => a.component_name === comp.name);
    if (compAssessments.length > 0) {
      let totalFraction = 0;
      compAssessments.forEach(a => {
        totalFraction += (a.score / a.max_score);
      });
      const avgFraction = totalFraction / compAssessments.length;
      teeScore += avgFraction * comp.weight;
      teeCompletedWeight += comp.weight;
      isTeeCompleted = true;
    }
  });

  return {
    totalAvailability: 100,
    icaAvailability: 50,
    teeAvailability: 50,
    icaScore: Number(icaScore.toFixed(2)),
    icaCompletedWeight: Number(icaCompletedWeight.toFixed(2)),
    icaTotalWeight: Number(icaTotalWeight.toFixed(2)),
    icaPercentage,
    icaOverallPercentage,
    maxPossibleIcaPercentage,
    gradeTier,
    isPassing,
    completedIcaCount: icaComponents.length - pendingIcaComponents.length,
    totalIcaCount: icaComponents.length,
    pendingIcaComponents,
    icaComponents,
    nonIcaComponents,
    teeScore: Number(teeScore.toFixed(2)),
    teeCompletedWeight: Number(teeCompletedWeight.toFixed(2)),
    teeTotalWeight: Number(teeTotalWeight.toFixed(2)),
    isTeeCompleted,
  };
}

export function calculateCurrentScore(courseData: CourseData): {
  score: number;
  maxPossibleScore: number;
  percentage: number;
  gradeTier: CollegeGradeTier;
  icaBreakdown: IcaBreakdown;
} {
  let score = 0;
  let maxPossibleScore = 0;

  courseData.policy.components.forEach(component => {
    if (component.type === 'attendance') {
      const attendanceScore = (courseData.attendance.percentage / 100) * component.weight;
      score += attendanceScore;
      maxPossibleScore += component.weight;
      return;
    }

    const assessmentsForComponent = courseData.assessments.filter(a => a.component_name === component.name);
    
    if (assessmentsForComponent.length > 0) {
      let totalPercentage = 0;
      assessmentsForComponent.forEach(a => {
        totalPercentage += (a.score / a.max_score);
      });
      const averagePercentage = totalPercentage / assessmentsForComponent.length;
      
      score += averagePercentage * component.weight;
      maxPossibleScore += component.weight;
    }
  });

  const percentage = maxPossibleScore === 0 ? 0 : Number(((score / maxPossibleScore) * 100).toFixed(2));
  const gradeTier = getGradeForScore(percentage);
  const icaBreakdown = calculateIcaBreakdown(courseData);
  
  return {
    score: Number(score.toFixed(2)),
    maxPossibleScore: Number(maxPossibleScore.toFixed(2)),
    percentage,
    gradeTier,
    icaBreakdown
  };
}
