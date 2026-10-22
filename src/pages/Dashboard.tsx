import React, { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mockStudent } from '../services/mockData';
import { useCourses } from '../context/CourseContext';
import { calculateCurrentScore, getGradeForScore } from '../utils/policyEngine';
import { extractPolicyDetailsFromPdf, type ExtractedPolicyResult } from '../utils/pdfParser';
import { PolicyExtractionModal } from '../components/PolicyExtractionModal';
import { 
  Target, 
  TrendingUp, 
  BookCheck, 
  Clock, 
  Upload, 
  Loader2, 
  Layers, 
  Plus, 
  Trash2,
  Award,
  Search,
  Sliders,
  ChevronRight,
  CheckCircle2,
  Calendar,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import type { CoursePolicy } from '../types';
import { useAuth } from '../context/AuthContext';
import { AddCourseModal } from '../components/AddCourseModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentStudent = user || mockStudent;
  const { courses, addCoursePolicy, removeCourse } = useCourses();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ExtractedPolicyResult | null>(null);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<'all' | 'outstanding' | 'excellent' | 'needs-focus'>('all');

  // Quantitative Analytics
  const totalCourses = courses.length;
  const avgAttendance = totalCourses > 0 
    ? courses.reduce((acc, curr) => acc + curr.attendance.percentage, 0) / totalCourses 
    : 0;

  const avgScore = totalCourses > 0 
    ? courses.reduce((acc, curr) => {
        const { percentage } = calculateCurrentScore(curr);
        return acc + percentage;
      }, 0) / totalCourses 
    : 0;

  const avgGrade = getGradeForScore(avgScore);

  // Average ICA performance across courses
  const avgIcaScore = totalCourses > 0
    ? courses.reduce((acc, curr) => {
        const { icaBreakdown } = calculateCurrentScore(curr);
        return acc + icaBreakdown.icaPercentage;
      }, 0) / totalCourses
    : 0;

  const avgIcaGrade = getGradeForScore(avgIcaScore);

  // Projected SGPA Calculation (10-point collegiate scale)
  const projectedSgpa = totalCourses > 0
    ? (courses.reduce((acc, curr) => {
        const { gradeTier } = calculateCurrentScore(curr);
        return acc + gradeTier.gpaPoint;
      }, 0) / totalCourses).toFixed(2)
    : '0.00';

  // Total evaluated deliverables count
  const totalAssessmentsCount = courses.reduce((acc, curr) => acc + curr.assessments.length, 0);

  // Prepare chart data for Recharts
  const benchmarkChartData = useMemo(() => {
    return courses.map(c => {
      const { percentage, icaBreakdown } = calculateCurrentScore(c);
      return {
        name: c.policy.course_id,
        courseName: c.policy.course_name,
        currentScore: Number(percentage.toFixed(1)),
        icaScore: Number(icaBreakdown.icaPercentage.toFixed(1)),
        targetBenchmark: 85.0
      };
    });
  }, [courses]);

  const weightDistributionData = useMemo(() => {
    let totalIcaAllocated = 0;
    let totalTeeAllocated = 0;
    courses.forEach(c => {
      const { icaBreakdown } = calculateCurrentScore(c);
      totalIcaAllocated += icaBreakdown.icaTotalWeight;
      totalTeeAllocated += (100 - icaBreakdown.icaTotalWeight);
    });
    const avgIca = totalCourses > 0 ? Math.round(totalIcaAllocated / totalCourses) : 70;
    const avgTee = totalCourses > 0 ? Math.round(totalTeeAllocated / totalCourses) : 30;
    return [
      { name: 'Internal Continuous Assessment (ICA)', value: avgIca, fill: '#3b82f6' },
      { name: 'Terminal End Semester Exams (TEE)', value: avgTee, fill: '#8b5cf6' }
    ];
  }, [courses, totalCourses]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setIsExtracting(true);
      try {
        const details = await extractPolicyDetailsFromPdf(file);
        setExtractedResult(details);
        setIsExtractionModalOpen(true);
      } catch (error) {
        console.error('Extraction error:', error);
        alert('Failed to parse syllabus PDF. Please verify format.');
      } finally {
        setIsExtracting(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as CoursePolicy;
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
          alert('Error parsing policy file. Please ensure it is a valid JSON course policy.');
        }
      };
      reader.readAsText(file);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveCourse = (courseId: string, courseName: string) => {
    if (window.confirm(`Confirm De-enrollment: Remove "${courseName}" (${courseId}) and all associated ICA marks?`)) {
      removeCourse(courseId);
    }
  };

  // Filtered course list
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = 
        c.policy.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.policy.course_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.policy.faculty.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const { gradeTier } = calculateCurrentScore(c);
      if (filterTier === 'outstanding') return gradeTier.grade === 'A+';
      if (filterTier === 'excellent') return gradeTier.grade === 'A';
      if (filterTier === 'needs-focus') return gradeTier.grade !== 'A+' && gradeTier.grade !== 'A';
      return true;
    });
  }, [courses, searchQuery, filterTier]);

  return (
    <div className="animate-fade-in">
      {/* Executive Command Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="policy-badge primary">Executive Academic Cockpit</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Academic Year 2026-27</span>
          </div>
          <h1 className="page-title">Executive Overview: {currentStudent.name}</h1>
          <p className="page-subtitle">
            <BookCheck size={16} className="text-accent" />
            <span>{currentStudent.department} • Semester {currentStudent.semester}</span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{currentStudent.student_id}</span>
          </p>
        </div>

        {/* Global Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
          >
            <Plus size={17} /> Add Course Policy
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
            onClick={triggerFileUpload}
            disabled={isExtracting}
            className="btn-secondary"
          >
            {isExtracting ? (
              <><Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}/> Ingesting Syllabus...</>
            ) : (
              <><Upload size={16} /> Ingest Syllabus PDF</>
            )}
          </button>

          <Link to="/desired-grades" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <Sliders size={16} /> What-If Simulator
          </Link>
        </div>
      </div>

      {/* 4 Hero KPI Cockpit Cards */}
      <div className="dashboard-grid">
        {/* Card 1: Projected SGPA */}
        <div className="stat-card card-cyan">
          <div className="stat-header">
            <span className="stat-title">Projected SGPA & Standing</span>
            <div className="stat-icon" style={{ background: 'var(--cyan-bg)', color: 'var(--cyan)' }}>
              <Award size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="stat-value">{projectedSgpa}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 10.0</span>
            <span className="grade-badge" style={{ borderColor: avgGrade.color, color: avgGrade.color, background: `${avgGrade.color}15` }}>
              {avgGrade.grade}
            </span>
          </div>
          <div className="stat-meta">
            <span className="stat-trend positive">Dean&apos;s Honor List</span>
            <span>Top 3% of Department</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${Math.min(100, (parseFloat(projectedSgpa) / 10) * 100)}%`, background: 'var(--cyan)' }}></div>
          </div>
        </div>

        {/* Card 2: Average ICA Score */}
        <div className="stat-card card-purple">
          <div className="stat-header">
            <span className="stat-title">Cohort Benchmark (ICA)</span>
            <div className="stat-icon" style={{ background: 'var(--purple-bg)', color: 'var(--purple-light)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="stat-value">{avgIcaScore.toFixed(1)}%</span>
            <span className="grade-badge" style={{ borderColor: avgIcaGrade.color, color: avgIcaGrade.color, background: `${avgIcaGrade.color}15` }}>
              ICA {avgIcaGrade.grade}
            </span>
          </div>
          <div className="stat-meta">
            <span className="stat-trend positive">+8.4%</span>
            <span>Above institutional cohort median</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${avgIcaScore}%`, background: 'var(--purple)' }}></div>
          </div>
        </div>

        {/* Card 3: Attendance Compliance */}
        <div className="stat-card card-success">
          <div className="stat-header">
            <span className="stat-title">Attendance Compliance</span>
            <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success-light)' }}>
              <Clock size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="stat-value">{avgAttendance.toFixed(1)}%</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--success-light)', fontWeight: 600 }}>Policy Cleared</span>
          </div>
          <div className="stat-meta">
            <span className="stat-trend positive">100% Compliant</span>
            <span>Exceeds mandatory 75% rule</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${avgAttendance}%`, background: avgAttendance < 75 ? 'var(--danger)' : 'var(--success)' }}></div>
          </div>
        </div>

        {/* Card 4: Curriculum Portfolio */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Active Curriculum</span>
            <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)' }}>
              <Target size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="stat-value">{totalCourses}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Courses</span>
          </div>
          <div className="stat-meta">
            <span className="stat-trend neutral">{totalAssessmentsCount} Graded Tasks</span>
            <span>All syllabus components mapped</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: '100%', background: 'var(--accent)' }}></div>
          </div>
        </div>
      </div>

      {/* Executive Visual Analytics Row (Recharts) */}
      <div className="charts-analytics-row">
        {/* Chart 1: Course Performance vs Institutional Target */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Course Performance vs Institutional A+ Benchmark</h3>
              <p className="chart-subtitle">Comparing current weighted ICA against the 85.0% Collegiate Distinction mark</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '2px' }}></span>
                <span>Current ICA</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></span>
                <span>85% Target Goal</span>
              </span>
            </div>
          </div>

          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  domain={[0, 100]} 
                  tickLine={false} 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{
                          background: '#0d1322',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>
                            {data.courseName} ({data.name})
                          </p>
                          <p style={{ margin: '0 0 2px 0', fontSize: '0.8rem', color: 'var(--accent-light)' }}>
                            Evaluated ICA: <b>{data.icaScore}%</b>
                          </p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Collegiate Target: <b>{data.targetBenchmark}%</b> ({data.icaScore >= data.targetBenchmark ? 'Ahead of Target' : 'Needs Focus'})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="icaScore" radius={[6, 6, 0, 0]}>
                  {benchmarkChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.icaScore >= 85 ? '#10b981' : entry.icaScore >= 75 ? '#3b82f6' : '#f59e0b'} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="targetBenchmark" fill="rgba(255, 255, 255, 0.08)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Semester Evaluation Allocation */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Semester Policy Weighting</h3>
              <p className="chart-subtitle">Continuous Internal Assessment (ICA) vs Terminal Exam</p>
            </div>
          </div>

          <div style={{ width: '100%', height: '170px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={weightDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {weightDistributionData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.fill} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0];
                      return (
                        <div style={{
                          background: '#0d1322',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          fontSize: '0.8rem',
                          color: '#fff'
                        }}>
                          <span>{item.name}: <b>{item.value}%</b></span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>ICA: <b>{weightDistributionData[0].value}%</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></span>
              <span style={{ color: 'var(--text-secondary)' }}>TEE Final: <b>{weightDistributionData[1].value}%</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Strategic Telemetry & Milestone Radar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '36px'
      }}>
        {/* Academic Health & Honors Status */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} className="text-accent" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Academic Standing & Honors Classification</h3>
            </div>
            <span className="policy-badge success">Audit Passed</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} className="text-success" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dean&apos;s Honor List Track (Grade A+)</span>
              </div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--success-light)' }}>
                {courses.filter(c => calculateCurrentScore(c).gradeTier.grade === 'A+').length} Courses
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} className="text-accent" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>First Class with Distinction (Grade A)</span>
              </div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--accent-light)' }}>
                {courses.filter(c => calculateCurrentScore(c).gradeTier.grade === 'A').length} Course
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--text-muted)' }}></span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Academic Watchlist / Remedial</span>
              </div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>0 Courses</strong>
            </div>
          </div>
        </div>

        {/* Milestone Radar & Key Assessment Timeline */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="text-purple" />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Semester Evaluation Milestones</h3>
            </div>
            <span className="policy-badge purple">Weeks 9 - 16</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>Continuous Internal Assessment (ICA) Lock</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>60% - 70% weight finalize deadline</span>
              </div>
              <span className="policy-badge primary">Week 13</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#fff', display: 'block' }}>Terminal End-Semester Examinations (TEE)</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>30% - 40% terminal component across 4 courses</span>
              </div>
              <span className="policy-badge warning">Weeks 14 - 16</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--success-light)', display: 'block' }}>Attendance Clearance Threshold Met</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All courses exceed 75% rule (Avg: 90.8%)</span>
              </div>
              <span className="policy-badge success">Cleared</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Portfolio Section Header with Direct Ledger Link */}
      <div className="section-header-row">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="policy-badge primary">Curriculum Standing Snapshot</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• Top-Level Performance Overview</span>
          </div>
          <h2 className="section-title">
            <Layers size={20} className="text-accent" /> Active Course Portfolio Overview
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Snapshot of your current courses. For the complete curriculum data matrix and syllabus policy editor, visit My Courses.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Quick Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--panel-border)',
            borderRadius: '10px'
          }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search course or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.825rem',
                outline: 'none',
                width: '160px'
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button 
              className={`filter-tab-btn ${filterTier === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTier('all')}
            >
              All ({courses.length})
            </button>
            <button 
              className={`filter-tab-btn ${filterTier === 'outstanding' ? 'active' : ''}`}
              onClick={() => setFilterTier('outstanding')}
            >
              Grade A+
            </button>
            <button 
              className={`filter-tab-btn ${filterTier === 'excellent' ? 'active' : ''}`}
              onClick={() => setFilterTier('excellent')}
            >
              Grade A
            </button>
            <button 
              className={`filter-tab-btn ${filterTier === 'needs-focus' ? 'active' : ''}`}
              onClick={() => setFilterTier('needs-focus')}
            >
              Needs Focus
            </button>
          </div>

          <Link
            to="/courses"
            className="btn-primary"
            style={{ textDecoration: 'none' }}
          >
            <BookOpen size={16} /> Open Full Curriculum Ledger ({courses.length}) <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="course-grid">
        {filteredCourses.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', gridColumn: '1 / -1', borderRadius: '18px' }}>
            <BookCheck size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No matching courses found</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
              Try adjusting your search criteria or register a new course policy into the portal engine.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary"
            >
              <Plus size={16} /> Add New Course
            </button>
          </div>
        ) : (
          filteredCourses.map((course) => {
            const { score, maxPossibleScore, percentage, gradeTier, icaBreakdown } = calculateCurrentScore(course);
            const reqAttendance = course.policy.components.find(c => c.type === 'attendance')?.rules?.minimum_percentage || 0;
            const isAttendanceCompliant = course.attendance.percentage >= reqAttendance;

            return (
              <Link 
                key={course.policy.course_id} 
                to={`/courses/${course.policy.course_id}`} 
                className="course-card"
              >
                {/* Header */}
                <div className="course-header">
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="course-code-pill">{course.policy.course_id}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Semester {course.policy.semester}</span>
                    </div>
                    <h3 className="course-title">{course.policy.course_name}</h3>
                    <div className="course-meta">
                      <span>Faculty: {(course.policy.faculty || '').replace(/^(Dr\.[^D]+)\1$/, '$1').replace(/^(Prof\.[^P]+)\1$/, '$1')}</span>
                      <span>•</span>
                      <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Availability: 100 (50% ICA + 50% TEE)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveCourse(course.policy.course_id, course.policy.course_name);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                
                {/* Metrics Breakdown */}
                <div className="course-metrics">
                  {/* Metric 1: Total ICA Performance */}
                  <div className="metric-row">
                    <div className="metric-labels">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Total ICA Components</span>
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
                      <span>Attendance {reqAttendance > 0 ? `(Min Req: ${reqAttendance}%)` : ''}</span>
                      <span className={isAttendanceCompliant ? 'text-success' : 'text-danger'}>
                        {course.attendance.percentage}% {isAttendanceCompliant ? '✓' : '⚠️'}
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

                  {/* Metric 3: Overall Course Score */}
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

                {/* Footer Action link */}
                <div className="course-card-footer">
                  <span>Open Detailed Assessment Ledger</span>
                  <ChevronRight size={16} />
                </div>
              </Link>
            );
          })
        )}
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
        onConfirm={(policy) => addCoursePolicy(policy)}
      />
    </div>
  );
};
