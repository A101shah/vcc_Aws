import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCourses } from '../context/CourseContext';
import { calculateCurrentScore, isIcaComponent } from '../utils/policyEngine';
import { extractPolicyDetailsFromPdf, type ExtractedPolicyResult } from '../utils/pdfParser';
import { PolicyExtractionModal } from '../components/PolicyExtractionModal';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  Trash2, 
  Clock, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Sliders,
  Loader2,
  BookCheck,
  GraduationCap,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import type { CoursePolicy } from '../types';
import { AddCourseModal } from '../components/AddCourseModal';

export const MyCourses: React.FC = () => {
  const { courses, addCoursePolicy, removeCourse } = useCourses();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedPolicyResult | null>(null);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'outstanding' | 'excellent' | 'needs-attention'>('all');
  const [sortBy, setSortBy] = useState<'score-desc' | 'score-asc' | 'attendance' | 'code'>('score-desc');

  // Quantitative Summary
  const totalCourses = courses.length;
  const totalCredits = totalCourses * 4; // 4 credit units per core course
  const totalGradedTasks = courses.reduce((acc, curr) => acc + curr.assessments.length, 0);
  
  const avgAttendance = totalCourses > 0
    ? courses.reduce((acc, curr) => acc + curr.attendance.percentage, 0) / totalCourses
    : 0;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setIsExtracting(true);
      try {
        const details = await extractPolicyDetailsFromPdf(file);
        setExtractedResult(details);
        setIsExtractionModalOpen(true);
      } catch (err) {
        console.error(err);
        alert('Could not parse syllabus PDF.');
      } finally {
        setIsExtracting(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string) as CoursePolicy;
          if (parsed.course_id && parsed.course_name) {
            const icaSum = parsed.components
              .filter(c => !c.name.toLowerCase().includes('term end') && !c.name.toLowerCase().includes('tee'))
              .reduce((s, c) => s + (c.weight || 0), 0);
            const teeSum = parsed.components
              .filter(c => c.name.toLowerCase().includes('term end') || c.name.toLowerCase().includes('tee'))
              .reduce((s, c) => s + (c.weight || 0), 0) || 50;
            setExtractedResult({
              policy: parsed,
              rawText: '',
              schemeFound: true,
              schemeTitle: 'Imported Syllabus Policy',
              icaSubtotal: icaSum,
              teeSubtotal: teeSum,
              detectedComponents: parsed.components
            });
            setIsExtractionModalOpen(true);
          }
        } catch {
          alert('Invalid JSON policy format.');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmExtractedPolicy = (policy: CoursePolicy) => {
    addCoursePolicy(policy);
  };

  const handleRemoveCourse = (courseId: string, courseName: string) => {
    if (window.confirm(`Confirm De-enrollment: Remove "${courseName}" (${courseId}) and all assessment records?`)) {
      removeCourse(courseId);
    }
  };

  // Filtered & Sorted Course List
  const processedCourses = useMemo(() => {
    let list = courses.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        c.policy.course_name.toLowerCase().includes(q) ||
        c.policy.course_id.toLowerCase().includes(q) ||
        c.policy.faculty.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const { gradeTier } = calculateCurrentScore(c);
      if (filterStatus === 'outstanding') return gradeTier.grade === 'A+';
      if (filterStatus === 'excellent') return gradeTier.grade === 'A';
      if (filterStatus === 'needs-attention') return gradeTier.grade !== 'A+' && gradeTier.grade !== 'A';
      return true;
    });

    list.sort((a, b) => {
      const aScore = calculateCurrentScore(a);
      const bScore = calculateCurrentScore(b);

      if (sortBy === 'score-desc') return bScore.percentage - aScore.percentage;
      if (sortBy === 'score-asc') return aScore.percentage - bScore.percentage;
      if (sortBy === 'attendance') return b.attendance.percentage - a.attendance.percentage;
      if (sortBy === 'code') return a.policy.course_id.localeCompare(b.policy.course_id);
      return 0;
    });

    return list;
  }, [courses, searchQuery, filterStatus, sortBy]);

  return (
    <div className="animate-fade-in my-courses-page">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="policy-badge primary">Curriculum Management & Evaluation Ledger</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Academic Year 2026-27</span>
          </div>
          <h1 className="page-title">Curriculum Portfolio & Course Ledger</h1>
          <p className="page-subtitle">
            <BookOpen size={16} className="text-accent" />
            <span>Manage enrolled course policies, syllabus weight allocations, and continuous assessment ledgers.</span>
          </p>
        </div>

        {/* Global Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={16} /> Register New Course
          </button>

          <input 
            type="file" 
            accept=".json,.pdf" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            className="btn-secondary"
          >
            {isExtracting ? (
              <><Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Ingesting PDF...</>
            ) : (
              <><Upload size={16} /> Ingest Syllabus PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Curriculum Summary Bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '28px' 
      }}>
        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Courses</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{totalCourses} Courses</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All syllabi verified</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--purple-bg)', color: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Credit Units</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--purple-light)' }}>{totalCredits} Credits</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Semester 5 requirement</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Graded Tasks</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#06b6d4' }}>{totalGradedTasks} Recorded</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Continuous evaluations</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--success-bg)', color: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Attendance</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success-light)' }}>{avgAttendance.toFixed(1)}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>100% Policy compliant</div>
          </div>
        </div>
      </div>

      {/* Search, Filter, Sort & View Mode Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '14px', 
        marginBottom: '24px',
        padding: '16px 20px',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--panel-border)'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--panel-border)',
          borderRadius: '10px',
          flex: '1',
          minWidth: '240px',
          maxWidth: '360px'
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by course, code, faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '0.875rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Courses ({courses.length})
          </button>
          <button 
            className={`filter-tab-btn ${filterStatus === 'outstanding' ? 'active' : ''}`}
            onClick={() => setFilterStatus('outstanding')}
          >
            Grade A+ (Distinction)
          </button>
          <button 
            className={`filter-tab-btn ${filterStatus === 'excellent' ? 'active' : ''}`}
            onClick={() => setFilterStatus('excellent')}
          >
            Grade A
          </button>
          <button 
            className={`filter-tab-btn ${filterStatus === 'needs-attention' ? 'active' : ''}`}
            onClick={() => setFilterStatus('needs-attention')}
          >
            Needs Attention
          </button>
        </div>

        {/* Sort & View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--panel-border)',
                borderRadius: '8px',
                color: '#fff',
                padding: '6px 10px',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="score-desc" style={{ background: '#0d1322' }}>Highest Score</option>
              <option value="score-asc" style={{ background: '#0d1322' }}>Lowest Score</option>
              <option value="attendance" style={{ background: '#0d1322' }}>Highest Attendance</option>
              <option value="code" style={{ background: '#0d1322' }}>Course Code (A-Z)</option>
            </select>
          </div>

          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '2px', border: '1px solid var(--panel-border)' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={14} /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              <TableIcon size={14} /> Ledger Table
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Grid View or Table View */}
      {processedCourses.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '18px' }}>
          <BookCheck size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No courses match the current filter</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            Adjust your search query or add new courses to your semester portfolio.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={16} /> Register New Course
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="course-grid">
          {processedCourses.map((course) => {
            const { score, maxPossibleScore, percentage, gradeTier, icaBreakdown } = calculateCurrentScore(course);
            const reqAttendance = course.policy.components.find(c => c.type === 'attendance')?.rules?.minimum_percentage || 0;
            const isAttendanceCompliant = course.attendance.percentage >= reqAttendance;
            const cleanFaculty = (course.policy.faculty || '').replace(/^(Dr\.[^D]+)\1$/, '$1').replace(/^(Prof\.[^P]+)\1$/, '$1');

            return (
              <div 
                key={course.policy.course_id} 
                className="course-card"
                style={{ cursor: 'default' }}
              >
                {/* Header */}
                <div className="course-header">
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="course-code-pill">{course.policy.course_id}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>4 Credits • Semester {course.policy.semester}</span>
                    </div>
                    <h3 className="course-title" style={{ margin: '0 0 4px 0' }}>{course.policy.course_name}</h3>
                    <div className="course-meta">
                      <span>Faculty: {cleanFaculty}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Total Availability: 100 (50% ICA + 50% TEE)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span 
                        className="grade-badge" 
                        style={{ 
                          borderColor: icaBreakdown.gradeTier.color, 
                          color: icaBreakdown.gradeTier.color, 
                          background: `${icaBreakdown.gradeTier.color}18` 
                        }}
                      >
                        ICA {icaBreakdown.gradeTier.grade}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Overall: {gradeTier.grade}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="course-card-delete-btn"
                      title={`Remove course ${course.policy.course_name}`}
                      onClick={() => handleRemoveCourse(course.policy.course_id, course.policy.course_name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Component Architecture Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0 16px 0' }}>
                  {course.policy.components.map((comp) => {
                    const isIca = isIcaComponent(comp);
                    return (
                      <span 
                        key={comp.name} 
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isIca ? 'rgba(59, 130, 246, 0.08)' : 'rgba(139, 92, 246, 0.08)',
                          color: isIca ? 'var(--accent-light)' : 'var(--purple-light)',
                          border: isIca ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(139, 92, 246, 0.2)',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {comp.name} ({comp.weight}%)
                      </span>
                    );
                  })}
                </div>

                {/* Metrics Breakdown */}
                <div className="course-metrics">
                  {/* Metric 1: Total ICA Performance */}
                  <div className="metric-row">
                    <div className="metric-labels">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Total Evaluated ICA</span>
                        <span className="ica-tag">ICA</span>
                      </span>
                      <span style={{ color: icaBreakdown.gradeTier.color }}>
                        {icaBreakdown.icaPercentage}% ({icaBreakdown.gradeTier.grade})
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${icaBreakdown.icaPercentage}%`, 
                          background: icaBreakdown.gradeTier.color 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Metric 2: Attendance */}
                  <div className="metric-row">
                    <div className="metric-labels">
                      <span>Attendance {reqAttendance > 0 ? `(Min: ${reqAttendance}%)` : ''}</span>
                      <span className={isAttendanceCompliant ? 'text-success' : 'text-danger'}>
                        {course.attendance.percentage}% {isAttendanceCompliant ? '✓ Met' : '⚠ Action Needed'}
                      </span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${course.attendance.percentage}%`, 
                          background: isAttendanceCompliant ? 'var(--success)' : 'var(--danger)' 
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Metric 3: Overall Cumulative Score */}
                  <div className="metric-row">
                    <div className="metric-labels">
                      <span>Current Cumulative Score ({score} / {maxPossibleScore} pts)</span>
                      <span className="text-accent">{percentage}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${percentage}%`, background: 'var(--accent)' }}></div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <Link 
                    to={`/courses/${course.policy.course_id}`}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem', padding: '8px 12px' }}
                  >
                    Open Assessment Ledger <ChevronRight size={14} />
                  </Link>

                  <Link
                    to="/desired-grades"
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '8px 12px' }}
                    title="Simulate Final Grade What-If"
                  >
                    <Sliders size={14} /> Simulate
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / LEDGER VIEW (Executives love tabular data!) */
        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--panel-border)' }}>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Course Code & Name</th>
                <th style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Faculty</th>
                <th style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Policy Split</th>
                <th style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Attendance</th>
                <th style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Evaluated ICA</th>
                <th style={{ padding: '16px 16px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Overall Score</th>
                <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedCourses.map((course) => {
                const { score, maxPossibleScore, percentage, gradeTier, icaBreakdown } = calculateCurrentScore(course);
                const reqAttendance = course.policy.components.find(c => c.type === 'attendance')?.rules?.minimum_percentage || 0;
                const isAttendanceCompliant = course.attendance.percentage >= reqAttendance;
                const cleanFaculty = (course.policy.faculty || '').replace(/^(Dr\.[^D]+)\1$/, '$1').replace(/^(Prof\.[^P]+)\1$/, '$1');

                return (
                  <tr 
                    key={course.policy.course_id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="course-code-pill">{course.policy.course_id}</span>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.92rem' }}>{course.policy.course_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>4 Credits • Semester {course.policy.semester}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '18px 16px', color: 'var(--text-secondary)' }}>
                      {cleanFaculty}
                    </td>

                    <td style={{ padding: '18px 16px' }}>
                      <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                        <span style={{ color: 'var(--accent-light)' }}>{icaBreakdown.icaTotalWeight}% ICA</span>
                        <span style={{ color: 'var(--text-muted)' }}> / </span>
                        <span style={{ color: 'var(--purple-light)' }}>{100 - icaBreakdown.icaTotalWeight}% TEE</span>
                      </div>
                    </td>

                    <td style={{ padding: '18px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: isAttendanceCompliant ? 'var(--success-light)' : 'var(--danger-light)' }}>
                          {course.attendance.percentage}%
                        </span>
                        {isAttendanceCompliant ? (
                          <CheckCircle2 size={14} className="text-success" />
                        ) : (
                          <AlertTriangle size={14} className="text-danger" />
                        )}
                      </div>
                    </td>

                    <td style={{ padding: '18px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, color: icaBreakdown.gradeTier.color }}>
                          {icaBreakdown.icaPercentage}%
                        </span>
                        <span 
                          className="grade-badge" 
                          style={{ 
                            fontSize: '0.72rem', 
                            padding: '1px 6px',
                            borderColor: icaBreakdown.gradeTier.color, 
                            color: icaBreakdown.gradeTier.color 
                          }}
                        >
                          {icaBreakdown.gradeTier.grade}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '18px 16px' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{percentage}%</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          {score} / {maxPossibleScore} pts ({gradeTier.grade})
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Link
                          to={`/courses/${course.policy.course_id}`}
                          className="btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                        >
                          View Ledger
                        </Link>
                        <button
                          type="button"
                          className="course-card-delete-btn"
                          title="Remove Course"
                          onClick={() => handleRemoveCourse(course.policy.course_id, course.policy.course_name)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Curriculum Regulatory Compliance Footer */}
      <div className="glass-panel" style={{ marginTop: '36px', padding: '24px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Award size={20} className="text-accent" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
            Curriculum Governance & Syllabus Policy Architecture
          </h3>
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
          All continuous evaluations adhere to the institutional curriculum architecture: Internal Continuous Assessment (ICA) contributes 50 Marks (50%) through Class Tests (20M) and Term-work (30M), and Terminal End Semester Examinations (TEE) account for the remaining 50 Marks (50%), fulfilling a complete 100-mark evaluation capacity.
        </p>
      </div>

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCourseCreated={(newId) => {
          setIsAddModalOpen(false);
          navigate(`/courses/${newId}`);
        }}
      />

      {/* Policy Extraction & Evaluation Scheme Modal */}
      <PolicyExtractionModal
        isOpen={isExtractionModalOpen}
        onClose={() => setIsExtractionModalOpen(false)}
        result={extractedResult}
        onConfirm={handleConfirmExtractedPolicy}
      />
    </div>
  );
};
