import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCourses } from '../context/CourseContext';
import { 
  calculateCurrentScore, 
  COLLEGE_GRADE_SCALE, 
  getGradeForScore,
  isIcaComponent 
} from '../utils/policyEngine';
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Activity, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  RotateCcw, 
  Trash2, 
  Check, 
  Edit3,
  Award,
  Sparkles
} from 'lucide-react';
import type { ComponentPolicy } from '../types';

export const CoursePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    getCourse, 
    setComponentMarks, 
    updateAttendance, 
    clearComponentMarks, 
    resetToDefaults,
    removeCourse 
  } = useCourses();
  
  const courseData = id ? getCourse(id) : undefined;

  // Local draft inputs for marks: { [compName]: { score: string, maxScore: string } }
  const [draftMarks, setDraftMarks] = useState<Record<string, { score: string; maxScore: string }>>({});
  const [draftAttendance, setDraftAttendance] = useState<string>('');
  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});

  if (!id || !courseData) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 className="page-title">Course not found</h2>
        <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Return to Dashboard</Link>
      </div>
    );
  }

  const { policy, attendance, assessments } = courseData;
  const { score, maxPossibleScore, percentage, gradeTier, icaBreakdown } = calculateCurrentScore(courseData);

  const icaComponents = policy.components.filter(isIcaComponent);
  const nonIcaComponents = policy.components.filter(c => !isIcaComponent(c));

  const showSavedBadge = (key: string) => {
    setSavedFeedback(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSavedFeedback(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleSaveAssessmentMarks = (compName: string, defaultMax: number) => {
    const draft = draftMarks[compName];
    const scoreVal = draft?.score !== undefined ? parseFloat(draft.score) : NaN;
    const maxVal = draft?.maxScore !== undefined ? parseFloat(draft.maxScore) : defaultMax;

    if (!isNaN(scoreVal) && !isNaN(maxVal) && maxVal > 0) {
      setComponentMarks(policy.course_id, compName, scoreVal, maxVal);
      showSavedBadge(compName);
    } else {
      alert('Please enter valid numerical marks and a maximum score greater than 0.');
    }
  };

  const handleApplyPreset = (compName: string, percent: number, maxScore: number) => {
    const calculatedScore = Number(((percent / 100) * maxScore).toFixed(1));
    setDraftMarks(prev => ({
      ...prev,
      [compName]: {
        score: calculatedScore.toString(),
        maxScore: maxScore.toString()
      }
    }));
    setComponentMarks(policy.course_id, compName, calculatedScore, maxScore);
    showSavedBadge(compName);
  };

  const handleSaveAttendance = () => {
    const val = draftAttendance !== '' ? parseFloat(draftAttendance) : attendance.percentage;
    if (!isNaN(val) && val >= 0 && val <= 100) {
      updateAttendance(policy.course_id, val);
      showSavedBadge('Attendance');
    } else {
      alert('Please enter attendance percentage between 0 and 100.');
    }
  };

  const handleClearComponent = (compName: string) => {
    clearComponentMarks(policy.course_id, compName);
    setDraftMarks(prev => {
      const copy = { ...prev };
      delete copy[compName];
      return copy;
    });
  };

  const handleResetCourseMarks = () => {
    if (window.confirm('Reset all course marks to the original default sample data?')) {
      resetToDefaults();
      setDraftMarks({});
      setDraftAttendance('');
    }
  };

  const handleDeleteCourse = () => {
    if (window.confirm(`Are you sure you want to remove "${policy.course_name}" (${policy.course_id})? This will permanently delete this course and all its recorded marks.`)) {
      removeCourse(policy.course_id);
      navigate('/');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Top Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 500, transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ margin: 0 }}>{policy.course_name}</h1>
            <span className="policy-badge primary">{policy.course_id}</span>
            <span className="grade-badge" style={{ borderColor: gradeTier.color, color: gradeTier.color, background: `${gradeTier.color}15`, fontSize: '1rem', padding: '4px 14px' }}>
              Overall Grade: {gradeTier.grade}
            </span>
          </div>
          <p className="page-subtitle" style={{ marginTop: '8px' }}>
            <BookOpen size={18} /> {policy.course_id} • {policy.faculty} • {policy.semester}th Semester
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            onClick={handleResetCourseMarks} 
            className="reset-all-marks-btn"
            title="Restore original default demo marks"
          >
            <RotateCcw size={14} /> Reset Marks
          </button>
          <button
            type="button"
            onClick={handleDeleteCourse}
            className="remove-course-header-btn"
            title={`Remove course ${policy.course_name}`}
          >
            <Trash2 size={14} /> Remove Course
          </button>
        </div>
      </div>

      {/* Institutional Evaluation Architecture Banner: Total Availability (100) = ICA (50) + TEE (50) */}
      <div className="glass-panel" style={{ padding: '22px 24px', marginBottom: '28px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(59, 130, 246, 0.22)', borderRadius: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="policy-badge primary">Evaluation Architecture</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• Academic Regulation Standard</span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Total Availability: 100 Marks
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Course grading is strictly balanced into 50% Continuous Internal Assessment (ICA) + 50% Term End Exam (TEE).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="ica-tag" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              ICA Weightage: 50 Marks (50%)
            </span>
            <span className="non-ica-tag" style={{ fontSize: '0.82rem', padding: '6px 14px' }}>
              TEE Weightage: 50 Marks (50%)
            </span>
          </div>
        </div>

        {/* 2-Column Matrix Bar: ICA (50) | TEE (50) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', background: 'rgba(0, 0, 0, 0.28)', padding: '16px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--accent-light)', fontSize: '0.88rem' }}>ICA (50 Marks Capacity)</strong>
              <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-light)', fontWeight: 700 }}>
                {icaBreakdown.icaScore} / {icaBreakdown.icaCompletedWeight} pts ({icaBreakdown.icaPercentage}%)
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Formed by {icaComponents.length} internal components ({icaComponents.map(c => c.name).join(', ')})
            </div>
            <div className="progress-bar-container" style={{ height: '6px' }}>
              <div className="progress-bar" style={{ width: `${(icaBreakdown.icaScore / 50) * 100}%`, background: 'var(--accent)' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <strong style={{ color: 'var(--warning-light)', fontSize: '0.88rem' }}>TEE (50 Marks Capacity)</strong>
              <span style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--warning-light)', fontWeight: 700 }}>
                {icaBreakdown.isTeeCompleted ? `${icaBreakdown.teeScore} / 50 pts recorded` : '50 Marks Terminal'}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Final comprehensive examination conducted at end of term (Weeks 14-16)
            </div>
            <div className="progress-bar-container" style={{ height: '6px' }}>
              <div className="progress-bar" style={{ width: `${icaBreakdown.isTeeCompleted ? (icaBreakdown.teeScore / 50) * 100 : 0}%`, background: 'var(--warning)' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Analytics Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: '36px' }}>
        {/* Card 1: Total ICA Components Assessment */}
        <div className="glass-panel stat-card" style={{ padding: '28px', borderLeft: `4px solid ${icaBreakdown.gradeTier.color}` }}>
          <div className="stat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="stat-title">Total ICA Components</span>
              <span className="ica-tag">Internal Continuous Assessment</span>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <Layers size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '4px 0', flexWrap: 'wrap' }}>
            <span className="stat-value" style={{ fontSize: '3.2rem', color: icaBreakdown.gradeTier.color }}>
              {icaBreakdown.icaPercentage}%
            </span>
            <span className="grade-badge" style={{ borderColor: icaBreakdown.gradeTier.color, color: icaBreakdown.gradeTier.color, background: `${icaBreakdown.gradeTier.color}15`, fontSize: '1.05rem', padding: '4px 12px' }}>
              ICA Grade: {icaBreakdown.gradeTier.grade}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Secured: <strong>{icaBreakdown.icaScore} / {icaBreakdown.icaCompletedWeight} pts</strong> ({icaBreakdown.icaTotalWeight}% Total Weight)
            </span>
            <span style={{ color: icaBreakdown.isPassing ? 'var(--success)' : 'var(--danger)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {icaBreakdown.isPassing ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              {icaBreakdown.isPassing ? 'ICA Cleared (≥ 40%)' : 'Below 40% Passing Cutoff'}
            </span>
          </div>
          <div className="progress-bar-container" style={{ height: '8px', marginTop: '16px' }}>
            <div className="progress-bar" style={{ width: `${icaBreakdown.icaPercentage}%`, background: icaBreakdown.gradeTier.color }}></div>
          </div>
        </div>

        {/* Card 2: Course Overall Score */}
        <div className="glass-panel stat-card" style={{ padding: '28px' }}>
          <div className="stat-header">
            <span className="stat-title">Course Overall Score</span>
            <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)' }}>
              <Activity size={24} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '4px 0', flexWrap: 'wrap' }}>
            <span className="stat-value" style={{ fontSize: '3.2rem' }}>{percentage}%</span>
            <span className="grade-badge" style={{ borderColor: gradeTier.color, color: gradeTier.color }}>
              Overall: {gradeTier.grade} ({gradeTier.description})
            </span>
          </div>
          <span className="stat-title" style={{ color: 'var(--text-secondary)', textTransform: 'none' }}>
            Weighted Marks: {score} / {maxPossibleScore} completed (Max capacity: 100)
          </span>
          <div className="progress-bar-container" style={{ height: '8px', marginTop: '16px' }}>
            <div className="progress-bar" style={{ width: `${percentage}%`, background: gradeTier.color }}></div>
          </div>
        </div>
      </div>

      {/* =========================================================
          SECTION: ICA COMPONENTS & STUDENT MARKS ENTRY
          ========================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="section-title" style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 className="text-accent" size={24} /> ICA Components & Student Marks Entry
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            View each Continuous Internal Assessment component. Enter or update your marks to instantly recalculate your total ICA percentage and college grade.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="ica-tag" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            Total ICA Weight: {icaBreakdown.icaTotalWeight}%
          </span>
          <span className="policy-badge success" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
            Evaluated: {icaBreakdown.completedIcaCount}/{icaBreakdown.totalIcaCount}
          </span>
        </div>
      </div>

      <div className="ica-entry-grid">
        {icaComponents.map((comp: ComponentPolicy) => {
          // Attendance component handling
          if (comp.type === 'attendance') {
            const currentAttendancePct = attendance.percentage;
            const earnedPoints = Number(((currentAttendancePct / 100) * comp.weight).toFixed(1));
            const minReq = comp.rules?.minimum_percentage || 0;
            const isPassingAtt = currentAttendancePct >= minReq;
            const isSaved = !!savedFeedback['Attendance'];

            return (
              <div key={comp.name} className="ica-entry-card is-graded">
                <div className="ica-card-header">
                  <div>
                    <div className="ica-card-title-row">
                      <Clock size={20} style={{ color: 'var(--success)' }} />
                      <h3 className="ica-card-name">{comp.name}</h3>
                      <span className="ica-tag">ICA Component</span>
                      <span className="policy-badge success">Attendance • Weight: {comp.weight}%</span>
                    </div>
                    {minReq > 0 && (
                      <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: isPassingAtt ? 'var(--text-secondary)' : 'var(--danger)' }}>
                        College Requirement: Minimum {minReq}% attendance required {isPassingAtt ? '✓ (Met)' : '⚠ (Below Requirement)'}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isPassingAtt ? 'var(--success)' : 'var(--danger)' }}>
                      {currentAttendancePct}%
                    </span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Contributed: {earnedPoints} / {comp.weight} pts
                    </div>
                  </div>
                </div>

                {/* Interactive Attendance Marks Input */}
                <div className="marks-entry-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Enter Attendance (%):
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={draftAttendance !== '' ? draftAttendance : currentAttendancePct}
                        onChange={(e) => setDraftAttendance(e.target.value)}
                        className="marks-num-input"
                        title="Enter attendance percentage"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAttendance}
                        className="save-btn"
                        title="Save attendance percentage"
                      >
                        {isSaved ? <Check size={16} /> : <Save size={16} />}
                        {isSaved ? 'Saved!' : 'Save'}
                      </button>
                    </div>

                    {/* Quick Presets */}
                    <div className="quick-score-pills">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                      {[100, 95, 90, 85, 80, 75].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setDraftAttendance(pct.toString());
                            updateAttendance(policy.course_id, pct);
                            showSavedBadge('Attendance');
                          }}
                          className="quick-pill-btn"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: `${currentAttendancePct}%`, background: isPassingAtt ? 'var(--success)' : 'var(--danger)' }}></div>
                </div>
              </div>
            );
          }

          // Assessment component handling (Quizzes, Assignments, Midterms, Labs, Projects)
          const compAssessments = assessments.filter(a => a.component_name === comp.name);
          const hasMarks = compAssessments.length > 0;
          const currentAssessment = hasMarks ? compAssessments[0] : null;

          const currentScore = currentAssessment ? currentAssessment.score : 0;
          const currentMax = currentAssessment ? currentAssessment.max_score : (comp.weight <= 25 ? comp.weight : 100);
          const percent = hasMarks && currentMax > 0 ? (currentScore / currentMax) * 100 : 0;
          const compGradeTier = hasMarks ? getGradeForScore(percent) : null;
          const earnedWeightedPoints = hasMarks ? Number(((percent / 100) * comp.weight).toFixed(1)) : 0;
          const isSaved = !!savedFeedback[comp.name];

          const draftScore = draftMarks[comp.name]?.score !== undefined 
            ? draftMarks[comp.name].score 
            : (hasMarks ? currentScore.toString() : '');
          const draftMax = draftMarks[comp.name]?.maxScore !== undefined 
            ? draftMarks[comp.name].maxScore 
            : currentMax.toString();

          return (
            <div key={comp.name} className={`ica-entry-card ${hasMarks ? 'is-graded' : 'is-pending'}`}>
              <div className="ica-card-header">
                <div>
                  <div className="ica-card-title-row">
                    <h3 className="ica-card-name">{comp.name}</h3>
                    <span className="ica-tag">ICA Component</span>
                    <span className={`policy-badge ${comp.type === 'exam' ? 'warning' : comp.type === 'project' ? 'success' : 'purple'}`}>
                      {comp.type}
                    </span>
                    <span className="policy-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                      Weight: {comp.weight}%
                    </span>
                    {hasMarks && compGradeTier && (
                      <span className="grade-badge" style={{ borderColor: compGradeTier.color, color: compGradeTier.color, background: `${compGradeTier.color}15`, fontSize: '0.8rem', padding: '2px 8px' }}>
                        Grade {compGradeTier.grade}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '0.82rem', color: hasMarks ? 'var(--text-secondary)' : 'var(--warning)' }}>
                    {hasMarks ? (
                      <span>Current Standing: <strong>{currentScore} / {currentMax}</strong> ({percent.toFixed(1)}%) • Contributes <strong>{earnedWeightedPoints} / {comp.weight} pts</strong> to course</span>
                    ) : (
                      <span>⚠ No marks recorded yet. Enter your score below to evaluate this {comp.weight}% component.</span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {hasMarks ? (
                    <div>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: compGradeTier?.color || 'var(--text-primary)' }}>
                        {percent.toFixed(1)}%
                      </span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {earnedWeightedPoints} / {comp.weight} weighted pts
                      </div>
                    </div>
                  ) : (
                    <span className="policy-badge warning" style={{ padding: '4px 10px' }}>
                      Pending Marks
                    </span>
                  )}
                </div>
              </div>

              {/* Marks Entry & Editing Input Row */}
              <div className="marks-entry-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Marks:
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Score"
                      value={draftScore}
                      onChange={(e) => setDraftMarks(prev => ({
                        ...prev,
                        [comp.name]: {
                          score: e.target.value,
                          maxScore: draftMax
                        }
                      }))}
                      className="marks-num-input"
                      title="Enter marks secured"
                    />
                    <span className="marks-divider">/</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Max"
                      value={draftMax}
                      onChange={(e) => setDraftMarks(prev => ({
                        ...prev,
                        [comp.name]: {
                          score: draftScore,
                          maxScore: e.target.value
                        }
                      }))}
                      className="marks-num-input"
                      style={{ width: '65px' }}
                      title="Enter maximum marks"
                    />

                    <button
                      type="button"
                      onClick={() => handleSaveAssessmentMarks(comp.name, currentMax)}
                      className="save-btn"
                      title="Save marks for this component"
                    >
                      {isSaved ? <Check size={16} /> : <Save size={16} />}
                      {isSaved ? 'Saved!' : 'Save Marks'}
                    </button>

                    {hasMarks && (
                      <button
                        type="button"
                        onClick={() => handleClearComponent(comp.name)}
                        className="clear-btn"
                        title="Clear marks and mark as pending"
                      >
                        <Trash2 size={14} /> Clear
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="quick-score-pills">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                    {[100, 90, 85, 80, 75, 60].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyPreset(comp.name, pct, parseFloat(draftMax) || currentMax)}
                        className="quick-pill-btn"
                        title={`Set to ${pct}% (${((pct / 100) * (parseFloat(draftMax) || currentMax)).toFixed(1)} / ${parseFloat(draftMax) || currentMax})`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {hasMarks && (
                <div className="progress-bar-container" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: `${percent}%`, background: compGradeTier?.color || 'var(--accent)' }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================================================
          SECTION: TERM END EXAMINATION (TEE) - NON-ICA
          ========================================================= */}
      {nonIcaComponents.length > 0 && (
        <div style={{ marginTop: '40px', marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award className="text-accent" size={22} /> Term End Examination (TEE)
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                University final examination component (conducted after completion of all ICA units).
              </p>
            </div>
            <span className="non-ica-tag" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              Final Exam Weight: {nonIcaComponents.reduce((acc, c) => acc + c.weight, 0)}%
            </span>
          </div>

          {nonIcaComponents.map((comp: ComponentPolicy) => {
            const compAssessments = assessments.filter(a => a.component_name === comp.name);
            const hasMarks = compAssessments.length > 0;
            const currentAssessment = hasMarks ? compAssessments[0] : null;

            const currentScore = currentAssessment ? currentAssessment.score : 0;
            const currentMax = currentAssessment ? currentAssessment.max_score : 100;
            const percent = hasMarks && currentMax > 0 ? (currentScore / currentMax) * 100 : 0;
            const isSaved = !!savedFeedback[comp.name];

            const draftScore = draftMarks[comp.name]?.score !== undefined 
              ? draftMarks[comp.name].score 
              : (hasMarks ? currentScore.toString() : '');
            const draftMax = draftMarks[comp.name]?.maxScore !== undefined 
              ? draftMarks[comp.name].maxScore 
              : currentMax.toString();

            return (
              <div key={comp.name} className={`ica-entry-card ${hasMarks ? 'is-graded' : 'is-pending'}`} style={{ borderLeftColor: 'var(--warning)' }}>
                <div className="ica-card-header">
                  <div>
                    <div className="ica-card-title-row">
                      <h4 className="ica-card-name" style={{ margin: 0 }}>{comp.name}</h4>
                      <span className="non-ica-tag">Term End (TEE)</span>
                      <span className="policy-badge warning">Weight: {comp.weight}%</span>
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.82rem', color: hasMarks ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {hasMarks ? (
                        <span>Recorded Score: <strong>{currentScore} / {currentMax}</strong> ({percent.toFixed(1)}%) • Contributes <strong>{((percent / 100) * comp.weight).toFixed(1)} / {comp.weight} pts</strong></span>
                      ) : (
                        <span>Final exam not yet recorded. Enter your marks or test hypothetical final scores.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="marks-entry-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        TEE Marks:
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Score"
                        value={draftScore}
                        onChange={(e) => setDraftMarks(prev => ({
                          ...prev,
                          [comp.name]: {
                            score: e.target.value,
                            maxScore: draftMax
                          }
                        }))}
                        className="marks-num-input"
                      />
                      <span className="marks-divider">/</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Max"
                        value={draftMax}
                        onChange={(e) => setDraftMarks(prev => ({
                          ...prev,
                          [comp.name]: {
                            score: draftScore,
                            maxScore: e.target.value
                          }
                        }))}
                        className="marks-num-input"
                        style={{ width: '65px' }}
                      />

                      <button
                        type="button"
                        onClick={() => handleSaveAssessmentMarks(comp.name, currentMax)}
                        className="save-btn"
                      >
                        {isSaved ? <Check size={16} /> : <Save size={16} />}
                        {isSaved ? 'Saved!' : 'Save TEE Marks'}
                      </button>

                      {hasMarks && (
                        <button
                          type="button"
                          onClick={() => handleClearComponent(comp.name)}
                          className="clear-btn"
                        >
                          <Trash2 size={14} /> Clear
                        </button>
                      )}
                    </div>

                    <div className="quick-score-pills">
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quick Presets:</span>
                      {[100, 90, 85, 80, 75, 60].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => handleApplyPreset(comp.name, pct, parseFloat(draftMax) || currentMax)}
                          className="quick-pill-btn"
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* College Grading Scale Official Rubric */}
      <div className="grading-scale-container" style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Sparkles className="text-accent" size={22} />
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
            College ICA Components & Evaluation Scale Reference
          </h3>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Grading system applied across all Continuous Internal Assessment (ICA) units and the overall semester course result. Passing requires minimum 40% (Grade D).
        </p>

        <div className="grading-scale-grid">
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


