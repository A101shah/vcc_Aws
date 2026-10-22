import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from '../context/CourseContext';
import { 
  COLLEGE_GRADE_SCALE, 
  getGradeForScore, 
  isIcaComponent
} from '../utils/policyEngine';
import { 
  Target, 
  Award, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Zap,
  CheckCircle2,
  Lock,
  Unlock,
  SlidersHorizontal
} from 'lucide-react';
import type { CourseData, ComponentPolicy } from '../types';

const TARGET_STORAGE_KEY = 'portal_engine_desired_grades_targets';

export const DesiredGrades: React.FC = () => {
  const { courses } = useCourses();

  // Selected course filter (ALL or specific course_id)
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  // Store desired target percentage per courseId
  const [targetGrades, setTargetGrades] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(TARGET_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default target: 85% (>85 A+ college tier)
    const defaults: Record<string, number> = {};
    courses.forEach(c => {
      defaults[c.policy.course_id] = 85;
    });
    return defaults;
  });

  // What-If simulated scores for components: { [courseId_componentName]: percentage (0..100) }
  const [simulatedScores, setSimulatedScores] = useState<Record<string, number>>({});

  // Graded components that user explicitly unlocked to simulate alternative scores
  const [unlockedGraded, setUnlockedGraded] = useState<Record<string, boolean>>({});

  // Auto-fill feedback banners per course
  const [autoFillFeedback, setAutoFillFeedback] = useState<Record<string, {
    type: 'success' | 'impossible' | 'secured';
    message: string;
  }>>({});

  useEffect(() => {
    localStorage.setItem(TARGET_STORAGE_KEY, JSON.stringify(targetGrades));
  }, [targetGrades]);

  const handleTargetChange = (courseId: string, targetPercent: number) => {
    setTargetGrades(prev => ({
      ...prev,
      [courseId]: targetPercent
    }));
  };

  const handleSetAllTargets = (targetPercent: number) => {
    const updated: Record<string, number> = {};
    courses.forEach(c => {
      updated[c.policy.course_id] = targetPercent;
    });
    setTargetGrades(updated);
  };

  const handleSimulatedScoreChange = (courseId: string, compName: string, pctValue: number) => {
    const clamped = Math.min(100, Math.max(0, Number(pctValue) || 0));
    setSimulatedScores(prev => ({
      ...prev,
      [`${courseId}_${compName}`]: clamped
    }));
  };

  const handleSimulatedMarksChange = (courseId: string, compName: string, rawMarks: number, maxWeight: number) => {
    if (maxWeight <= 0) return;
    const clampedMarks = Math.min(maxWeight, Math.max(0, Number(rawMarks) || 0));
    const pct = Number(((clampedMarks / maxWeight) * 100).toFixed(1));
    handleSimulatedScoreChange(courseId, compName, pct);
  };

  const toggleUnlockGraded = (courseId: string, compName: string) => {
    const key = `${courseId}_${compName}`;
    setUnlockedGraded(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const resetCourseSimulations = (courseId: string) => {
    setSimulatedScores(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${courseId}_`)) delete next[k];
      });
      return next;
    });
    setUnlockedGraded(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${courseId}_`)) delete next[k];
      });
      return next;
    });
    setAutoFillFeedback(prev => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });
  };

  const resetAllSimulations = () => {
    setSimulatedScores({});
    setUnlockedGraded({});
    setAutoFillFeedback({});
  };

  // Auto-Fill Required Marks Solver: calculates minimum uniform score on remaining components to hit target
  const handleAutoFillRequiredMarks = (courseId: string) => {
    const course = courses.find(c => c.policy.course_id === courseId);
    if (!course) return;

    const target = targetGrades[courseId] ?? 85;

    let acquiredWeightedMarks = 0;
    let completedWeight = 0;
    const pendingComponents: ComponentPolicy[] = [];

    course.policy.components.forEach(comp => {
      if (comp.type === 'attendance') {
        const attendancePoints = (course.attendance.percentage / 100) * comp.weight;
        acquiredWeightedMarks += attendancePoints;
        completedWeight += comp.weight;
        return;
      }

      const assessments = course.assessments.filter(a => a.component_name === comp.name);
      if (assessments.length > 0) {
        let avgPercent = 0;
        assessments.forEach(a => {
          avgPercent += (a.score / a.max_score);
        });
        avgPercent = avgPercent / assessments.length;
        acquiredWeightedMarks += avgPercent * comp.weight;
        completedWeight += comp.weight;
      } else {
        pendingComponents.push(comp);
      }
    });

    const remainingWeight = 100 - completedWeight;
    if (remainingWeight <= 0) {
      setAutoFillFeedback(prev => ({
        ...prev,
        [courseId]: {
          type: 'secured',
          message: 'All syllabus components are already graded! No upcoming assessments remaining.'
        }
      }));
      return;
    }

    const marksNeededFromRemaining = target - acquiredWeightedMarks;
    const requiredPercent = (marksNeededFromRemaining / remainingWeight) * 100;

    const newSim = { ...simulatedScores };

    if (requiredPercent <= 0) {
      // Target already met! Set remaining to safe baseline (40% minimum passing)
      pendingComponents.forEach(comp => {
        newSim[`${courseId}_${comp.name}`] = 40;
      });
      setAutoFillFeedback(prev => ({
        ...prev,
        [courseId]: {
          type: 'secured',
          message: `Target of ${target}% is already secured! Upcoming components filled with safe passing score (40%).`
        }
      }));
    } else if (requiredPercent > 100) {
      // Impossible, set to 100% on all remaining
      pendingComponents.forEach(comp => {
        newSim[`${courseId}_${comp.name}`] = 100;
      });
      const maxPossible = Number((acquiredWeightedMarks + remainingWeight).toFixed(1));
      const maxTier = getGradeForScore(maxPossible);
      setAutoFillFeedback(prev => ({
        ...prev,
        [courseId]: {
          type: 'impossible',
          message: `Target of ${target}% is mathematically unreachable. Set to 100% on remaining. Maximum possible is ${maxPossible}% (Grade ${maxTier.grade}).`
        }
      }));
    } else {
      const roundedPercent = Number(requiredPercent.toFixed(1));
      pendingComponents.forEach(comp => {
        newSim[`${courseId}_${comp.name}`] = roundedPercent;
      });
      setAutoFillFeedback(prev => ({
        ...prev,
        [courseId]: {
          type: 'success',
          message: `Auto-filled: Target of ${target}% requires an average of ${roundedPercent}% on remaining ${remainingWeight} Marks.`
        }
      }));
    }

    setSimulatedScores(newSim);
  };

  // Helper to calculate row-level analysis for each component in a course
  const analyzeCourseComponents = (course: CourseData) => {
    const courseId = course.policy.course_id;
    const target = targetGrades[courseId] ?? 85;

    let totalRealMarks = 0;
    let completedWeight = 0;
    let totalSimulatedMarks = 0;

    const rows = course.policy.components.map(comp => {
      const isAttendance = comp.type === 'attendance';
      const assessments = course.assessments.filter(a => a.component_name === comp.name);
      const isGraded = isAttendance || assessments.length > 0;

      let realMarks = 0;
      let realPercentage = 0;
      let assessmentLabel = '';

      if (isAttendance) {
        realPercentage = course.attendance.percentage;
        realMarks = (realPercentage / 100) * comp.weight;
        assessmentLabel = `${realPercentage}% Attendance verified`;
      } else if (assessments.length > 0) {
        let sumPct = 0;
        assessments.forEach(a => {
          sumPct += (a.score / a.max_score);
        });
        realPercentage = Number(((sumPct / assessments.length) * 100).toFixed(1));
        realMarks = (realPercentage / 100) * comp.weight;
        const first = assessments[0];
        assessmentLabel = assessments.length === 1 
          ? `${first.score}/${first.max_score} pts` 
          : `${assessments.length} submissions avg`;
      }

      const simKey = `${courseId}_${comp.name}`;
      const isUnlocked = isGraded && unlockedGraded[simKey];

      // Desired score percentage
      let desiredPercentage: number;
      if (isGraded && !isUnlocked) {
        desiredPercentage = realPercentage;
      } else if (simulatedScores[simKey] !== undefined) {
        desiredPercentage = simulatedScores[simKey];
      } else {
        desiredPercentage = 80;
      }

      const desiredMarks = Number(((desiredPercentage / 100) * comp.weight).toFixed(2));

      if (isGraded) {
        totalRealMarks += realMarks;
        completedWeight += comp.weight;
      }

      totalSimulatedMarks += desiredMarks;

      return {
        comp,
        isGraded,
        isAttendance,
        isUnlocked,
        realMarks: Number(realMarks.toFixed(2)),
        realPercentage,
        assessmentLabel,
        desiredPercentage,
        desiredMarks,
        isIca: isIcaComponent(comp)
      };
    });

    const remainingWeight = 100 - completedWeight;
    const maxPossibleOverallMarks = Number((totalRealMarks + remainingWeight).toFixed(1));
    const marksNeededFromRemaining = target - totalRealMarks;
    const requiredAverageOnRemaining = remainingWeight > 0 
      ? Number(((marksNeededFromRemaining / remainingWeight) * 100).toFixed(1))
      : (marksNeededFromRemaining <= 0 ? 0 : 999);

    const projectedFinalScore = Number(totalSimulatedMarks.toFixed(1));
    const matchedTier = getGradeForScore(target);
    const projectedTier = getGradeForScore(projectedFinalScore);

    // Feasibility status
    let status: 'secured' | 'achievable' | 'demanding' | 'impossible' = 'achievable';
    let statusMessage = '';

    if (marksNeededFromRemaining <= 0) {
      status = 'secured';
      statusMessage = 'Target already achieved with secured marks!';
    } else if (requiredAverageOnRemaining > 100) {
      status = 'impossible';
      statusMessage = `Mathematically unreachable. Max possible is ${maxPossibleOverallMarks}% (${getGradeForScore(maxPossibleOverallMarks).grade}).`;
    } else if (requiredAverageOnRemaining > 85) {
      status = 'demanding';
      statusMessage = `High focus needed: ${requiredAverageOnRemaining}% required on remaining exams.`;
    } else {
      status = 'achievable';
      statusMessage = `Comfortably achievable: ${requiredAverageOnRemaining}% needed on remaining exams.`;
    }

    return {
      courseId,
      target,
      rows,
      totalRealMarks: Number(totalRealMarks.toFixed(1)),
      completedWeight,
      remainingWeight,
      maxPossibleOverallMarks,
      requiredAverageOnRemaining,
      projectedFinalScore,
      matchedTier,
      projectedTier,
      status,
      statusMessage
    };
  };

  // Filter courses
  const displayedCourses = selectedCourseFilter === 'ALL'
    ? courses
    : courses.filter(c => c.policy.course_id === selectedCourseFilter);

  // Overall Semester Stats
  const allAnalyses = courses.map(c => analyzeCourseComponents(c));
  const avgGoal = courses.length > 0 
    ? (Object.values(targetGrades).reduce((a, b) => a + b, 0) / courses.length).toFixed(1)
    : '0';
  const avgProjected = courses.length > 0
    ? (allAnalyses.reduce((acc, a) => acc + a.projectedFinalScore, 0) / courses.length).toFixed(1)
    : '0';
  const achievableCount = allAnalyses.filter(a => a.status !== 'impossible').length;

  return (
    <div className="animate-fade-in desired-grades-page">
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Target className="text-accent" size={32} /> Desired Grades & What-If Simulator
          </h1>
          <p className="page-subtitle">
            <Sparkles size={18} /> Interactive assessment matrix: compare real achieved marks, simulate desired targets, and solve for required exam scores.
          </p>
        </div>

        {/* Global Presets */}
        <div className="target-global-presets">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Set all to:</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[85, 80, 75, 70, 65, 60].map(pct => {
              const tier = getGradeForScore(pct);
              return (
                <button
                  key={pct}
                  onClick={() => handleSetAllTargets(pct)}
                  className="preset-btn"
                  title={`${tier.grade}: ${tier.description} (${pct}%)`}
                >
                  {tier.grade} ({pct}%)
                </button>
              );
            })}
            <button 
              onClick={resetAllSimulations} 
              className="preset-btn preset-reset-btn" 
              title="Reset all simulated scores"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '28px' }}>
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-title">Target GPA Milestone</span>
            <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)' }}>
              <Award size={24} />
            </div>
          </div>
          <span className="stat-value">{avgGoal}%</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Average target across {courses.length} active courses (Tier: {getGradeForScore(Number(avgGoal)).grade})
          </span>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-title">Achievable Status</span>
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              <CheckCircle size={24} />
            </div>
          </div>
          <span className="stat-value text-success">
            {achievableCount} / {courses.length}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Courses mathematically on track to hit desired targets
          </span>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span className="stat-title">What-If Projected Average</span>
            <div className="stat-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple)' }}>
              <TrendingUp size={24} />
            </div>
          </div>
          <span className="stat-value" style={{ color: 'var(--purple)' }}>
            {avgProjected}%
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Projected semester completion (Grade: {getGradeForScore(Number(avgProjected)).grade} • {getGradeForScore(Number(avgProjected)).description})
          </span>
        </div>
      </div>

      {/* Course Filter Bar */}
      {courses.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Filter Subject:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCourseFilter('ALL')}
            className={`preset-btn ${selectedCourseFilter === 'ALL' ? 'active' : ''}`}
            style={{
              background: selectedCourseFilter === 'ALL' ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
              color: selectedCourseFilter === 'ALL' ? '#fff' : 'var(--text-secondary)',
              borderColor: selectedCourseFilter === 'ALL' ? 'var(--accent-light)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            All Subjects ({courses.length})
          </button>
          {courses.map(c => (
            <button
              key={c.policy.course_id}
              type="button"
              onClick={() => setSelectedCourseFilter(c.policy.course_id)}
              className={`preset-btn ${selectedCourseFilter === c.policy.course_id ? 'active' : ''}`}
              style={{
                background: selectedCourseFilter === c.policy.course_id ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedCourseFilter === c.policy.course_id ? '#fff' : 'var(--text-secondary)',
                borderColor: selectedCourseFilter === c.policy.course_id ? 'var(--accent-light)' : 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {c.policy.course_id}
            </button>
          ))}
        </div>
      )}

      {/* Main Subject Matrix Cards */}
      {displayedCourses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '16px' }}>
          <BookOpen size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>No courses found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px', fontSize: '0.95rem' }}>
            Enroll courses on your courses page to view their assessment matrix and simulate target grades.
          </p>
          <Link to="/courses" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            Go to Courses
          </Link>
        </div>
      ) : (
        displayedCourses.map(course => {
          const analysis = analyzeCourseComponents(course);
          const { policy } = course;
          const courseId = policy.course_id;
          const feedback = autoFillFeedback[courseId];

          return (
            <div key={courseId} className="subject-matrix-card">
              {/* Subject Matrix Header */}
              <div className="subject-matrix-header">
                <div className="subject-matrix-title-area">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                      {policy.course_name}
                    </h3>
                    <span className="policy-badge primary" style={{ fontWeight: 800 }}>
                      {policy.course_id}
                    </span>
                    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-light)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      Total Availability: 100 Marks (50% ICA + 50% TEE)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <span>Faculty: <strong style={{ color: 'var(--text-secondary)' }}>{policy.faculty}</strong></span>
                    <span>• Semester {policy.semester}</span>
                    <span>• Evaluated Weight: <strong style={{ color: '#38bdf8' }}>{analysis.completedWeight}%</strong></span>
                    <span>• Remaining: <strong style={{ color: '#c084fc' }}>{analysis.remainingWeight}%</strong></span>
                  </div>
                </div>

                <div className="subject-matrix-controls">
                  <button
                    type="button"
                    onClick={() => handleAutoFillRequiredMarks(courseId)}
                    className="btn-autofill"
                    title="Automatically calculate the minimum scores needed on upcoming assessments to reach your Desired Grade"
                  >
                    <Zap size={15} style={{ fill: 'currentColor' }} /> Auto-Fill Required Marks
                  </button>
                  <button
                    type="button"
                    onClick={() => resetCourseSimulations(courseId)}
                    className="preset-btn"
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Reset simulations for this subject"
                  >
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>
              </div>

              {/* Auto-Fill Notification Banner if active */}
              {feedback && (
                <div className={`autofill-banner ${feedback.type}`}>
                  {feedback.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
                  {feedback.type === 'impossible' && <AlertTriangle size={16} color="#ef4444" />}
                  {feedback.type === 'secured' && <Sparkles size={16} color="#3b82f6" />}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* 4-Column Layout: Left = Component Matrix (3 Columns) | Right = Desired Grade & Realistic Outcome (Column 4) */}
              <div className="matrix-layout-grid">
                {/* 3-Column Table */}
                <div className="matrix-table-wrap">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th style={{ width: '32%' }}>ICA / Assessment Component</th>
                        <th style={{ width: '28%' }}>Achieved Marks (Real)</th>
                        <th style={{ width: '40%' }}>Desired Marks (Simulator)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.rows.map(row => {
                        const { comp, isGraded, isUnlocked, realMarks, realPercentage, assessmentLabel, desiredPercentage, desiredMarks, isIca } = row;

                        return (
                          <tr key={comp.name}>
                            {/* Column 1: Component */}
                            <td>
                              <div className="matrix-comp-cell">
                                <span className={isIca ? 'ica-tag' : 'non-ica-tag'}>
                                  {isIca ? 'ICA' : 'TEE'}
                                </span>
                                <div className="matrix-comp-info">
                                  <span className="matrix-comp-name">{comp.name}</span>
                                  <span className="matrix-comp-meta">
                                    <strong style={{ color: '#93c5fd' }}>{comp.weight} Marks</strong>
                                    <span>•</span>
                                    <span style={{ textTransform: 'capitalize' }}>{comp.type}</span>
                                    {comp.rules?.minimum_percentage && (
                                      <span>(Min {comp.rules.minimum_percentage}%)</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Achieved Marks (Real) */}
                            <td>
                              {isGraded ? (
                                <div className="achieved-marks-display">
                                  <div>
                                    <div className="achieved-score-combo">
                                      <span className="achieved-val-box text-success">{realMarks}</span>
                                      <span className="achieved-denom">/{comp.weight}M</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                      {assessmentLabel}
                                    </div>
                                  </div>
                                  <span className="achieved-badge graded">
                                    {realPercentage}%
                                  </span>
                                </div>
                              ) : (
                                <div className="achieved-marks-display">
                                  <div>
                                    <div className="achieved-score-combo">
                                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>—</span>
                                      <span className="achieved-denom">/{comp.weight}M</span>
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                      Pending Exam
                                    </div>
                                  </div>
                                  <span className="achieved-badge pending">
                                    Not Graded
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Column 3: Desired Marks (Simulator) */}
                            <td>
                              {isGraded && !isUnlocked ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', whiteSpace: 'nowrap' }}>
                                  <div className="desired-locked-pill">
                                    <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                                    <span>{realMarks}/{comp.weight}M</span>
                                    <span className="desired-pct-pill">{realPercentage}%</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleUnlockGraded(courseId, comp.name)}
                                    className="simulate-toggle-btn"
                                    title="Unlock to test What-If alternate score for this graded assessment"
                                  >
                                    <Unlock size={11} /> Simulate
                                  </button>
                                </div>
                              ) : (
                                <div className="desired-marks-interactive">
                                  <div className="desired-marks-input-row">
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max={comp.weight}
                                      value={desiredMarks}
                                      onChange={(e) => handleSimulatedMarksChange(courseId, comp.name, Number(e.target.value), comp.weight)}
                                      className="desired-num-input"
                                      title="Enter target marks for this component"
                                    />
                                    <span className="desired-denom">/{comp.weight}M</span>
                                    <span className="desired-pct-pill">{desiredPercentage}%</span>
                                    {isGraded && isUnlocked && (
                                      <button
                                        type="button"
                                        onClick={() => toggleUnlockGraded(courseId, comp.name)}
                                        className="simulate-toggle-btn"
                                        style={{ padding: '2px 6px', fontSize: '0.68rem' }}
                                        title="Lock back to actual real marks"
                                      >
                                        <Lock size={11} /> Lock
                                      </button>
                                    )}
                                  </div>

                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={desiredPercentage}
                                    onChange={(e) => handleSimulatedScoreChange(courseId, comp.name, Number(e.target.value))}
                                    className="desired-range-mini"
                                    title={`Slider: ${desiredPercentage}% (${desiredMarks} / ${comp.weight} M)`}
                                  />
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Column 4: Desired Grade & Possible Realistic Grade Command Center */}
                <div className="outcome-command-panel">
                  {/* Desired Grade Selector Block */}
                  <div className="outcome-block">
                    <div className="outcome-block-label">
                      <Target size={14} className="text-accent" /> Desired Target Grade
                    </div>
                    <div className="desired-grade-selector-grid">
                      {[85, 80, 75, 70, 65, 60, 55, 40].map(pct => {
                        const tier = getGradeForScore(pct);
                        const isCurrentTarget = analysis.target === pct;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleTargetChange(courseId, pct)}
                            className={`grade-target-btn ${isCurrentTarget ? 'active' : ''}`}
                            title={`Target ${tier.grade}: >${pct}% (${tier.description})`}
                          >
                            <div>{tier.grade}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{pct}%</div>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAutoFillRequiredMarks(courseId)}
                      className="btn-autofill"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
                      title="Automatically calculate the minimum scores needed on upcoming assessments to reach your Desired Grade"
                    >
                      <Zap size={14} style={{ fill: 'currentColor' }} /> Auto-Fill Required Marks
                    </button>
                  </div>

                  {/* Possible Realistic Grade Showcase Card */}
                  <div 
                    className="realistic-grade-showcase"
                    style={{ '--grade-accent': analysis.projectedTier.color } as React.CSSProperties}
                  >
                    <div className="outcome-block-label" style={{ color: 'var(--text-secondary)' }}>
                      <Award size={14} style={{ color: analysis.projectedTier.color }} /> Possible Realistic Grade
                    </div>

                    <div className="realistic-hero-row">
                      <div className="realistic-letter-badge" style={{ color: analysis.projectedTier.color }}>
                        {analysis.projectedTier.grade}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="realistic-score-tag">
                          {analysis.projectedFinalScore}%
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {analysis.projectedTier.description}
                        </div>
                      </div>
                    </div>

                    {/* Mini progress bar towards 100 */}
                    <div className="progress-bar-container" style={{ height: '6px', margin: '2px 0' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${Math.min(100, analysis.projectedFinalScore)}%`,
                          background: analysis.projectedTier.color
                        }}
                      ></div>
                    </div>

                    {/* Feasibility Verdict */}
                    <div className={`realistic-feasibility-tag ${analysis.status}`}>
                      {analysis.status === 'secured' && <Sparkles size={14} />}
                      {analysis.status === 'achievable' && <CheckCircle size={14} />}
                      {analysis.status === 'demanding' && <SlidersHorizontal size={14} />}
                      {analysis.status === 'impossible' && <AlertTriangle size={14} />}
                      <span>
                        {analysis.status === 'secured' && '★ Target Already Secured'}
                        {analysis.status === 'achievable' && '✓ Realistic & Feasible'}
                        {analysis.status === 'demanding' && '⚡ High Focus Required'}
                        {analysis.status === 'impossible' && '✕ Mathematically Unreachable'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {analysis.statusMessage}
                    </div>

                    {analysis.remainingWeight > 0 && analysis.status !== 'secured' && analysis.status !== 'impossible' && (
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        padding: '8px 10px', 
                        borderRadius: '8px', 
                        fontSize: '0.74rem', 
                        color: '#93c5fd',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>Needed on remaining {analysis.remainingWeight}M:</span>
                        <strong style={{ fontSize: '0.82rem' }}>{analysis.requiredAverageOnRemaining}%</strong>
                      </div>
                    )}
                  </div>

                  {/* Navigation link */}
                  <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                    <Link 
                      to={`/courses/${policy.course_id}`} 
                      className="view-breakdown-link"
                      style={{ fontSize: '0.78rem', width: '100%', justifyContent: 'center' }}
                    >
                      <span>Course Policy & Syllabus</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Matrix Summary Footer Row */}
              <div className="matrix-summary-footer">
                <div className="matrix-summary-stat">
                  <span className="matrix-summary-label">Course Availability:</span>
                  <span className="matrix-summary-val" style={{ color: '#93c5fd' }}>100 Marks (50M ICA + 50M TEE)</span>
                </div>
                <div className="matrix-summary-stat">
                  <span className="matrix-summary-label">Real Marks Secured:</span>
                  <span className="matrix-summary-val" style={{ color: '#34d399' }}>
                    {analysis.totalRealMarks} / {analysis.completedWeight} Marks ({analysis.completedWeight > 0 ? ((analysis.totalRealMarks / analysis.completedWeight) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
                <div className="matrix-summary-stat">
                  <span className="matrix-summary-label">Projected Total Score:</span>
                  <span className="matrix-summary-val" style={{ color: analysis.projectedTier.color }}>
                    {analysis.projectedFinalScore} / 100 Marks (Grade {analysis.projectedTier.grade})
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* College Grading Scale Official Rubric Reference */}
      <div className="grading-scale-container" style={{ marginTop: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <BookOpen className="text-accent" size={22} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
            Official College Assessment Grading Scheme
          </h3>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Standard scale applied across total course marks (50% ICA + 50% TEE). Minimum passing mark is 40% (Grade D).
        </p>

        <div className="grading-scale-grid" style={{ marginTop: '16px' }}>
          {COLLEGE_GRADE_SCALE.map((tier) => (
            <div key={tier.grade} className="grading-scale-item" style={{ borderColor: `${tier.color}30` }}>
              <span className="scale-grade-letter" style={{ color: tier.color }}>{tier.grade}</span>
              <span className="scale-grade-range">
                {tier.minPercentage === 0 ? '< 40%' : `> ${tier.minPercentage}%`}
              </span>
              <span className="scale-grade-desc">{tier.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
