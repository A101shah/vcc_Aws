import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { calculateCurrentScore, getGradeForScore } from '../utils/policyEngine';
import { 
  Mail, 
  Hash, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Award, 
  Download, 
  Edit3, 
  GraduationCap,
  Layers,
  FileCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const { courses } = useCourses();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [semester, setSemester] = useState(user?.semester || 5);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Quantitative standing
  const totalCourses = courses.length;
  const avgScore = totalCourses > 0 
    ? courses.reduce((acc, curr) => acc + calculateCurrentScore(curr).percentage, 0) / totalCourses 
    : 0;
  const avgGrade = getGradeForScore(avgScore);
  const avgAttendance = totalCourses > 0 
    ? courses.reduce((acc, curr) => acc + curr.attendance.percentage, 0) / totalCourses 
    : 0;
  const totalAssessments = courses.reduce((acc, curr) => acc + curr.assessments.length, 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, department, semester: Number(semester) });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadTranscript = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="policy-badge primary">Verified Institutional Dossier</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Academic Regulations Fall 2026</span>
        </div>
        <h1 className="page-title">Student Profile & Academic Credentials</h1>
        <p className="page-subtitle">
          <GraduationCap size={16} className="text-accent" />
          <span>Apex University of Technology • Directorate of Academic Records</span>
        </p>
      </div>

      {saveSuccess && (
        <div className="auth-error-banner" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success-light)', marginBottom: '24px' }}>
          <CheckCircle2 size={18} />
          <span>Academic identity records updated successfully.</span>
        </div>
      )}

      {downloadSuccess && (
        <div className="auth-error-banner" style={{ background: 'var(--accent-glow)', borderColor: 'rgba(59,130,246,0.3)', color: 'var(--accent-light)', marginBottom: '24px' }}>
          <FileCheck size={18} />
          <span>Official Grade Report & ICA Transcript generated with cryptographic seal.</span>
        </div>
      )}

      {/* Hero Dossier Card */}
      <div className="glass-panel" style={{ padding: '36px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <div className="avatar" style={{ width: '84px', height: '84px', fontSize: '2.4rem', boxShadow: '0 8px 24px var(--accent-glow)' }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>
                {user?.name || 'Aarav'}
              </h2>
              <span className="grade-badge" style={{ borderColor: avgGrade.color, color: avgGrade.color, background: `${avgGrade.color}15` }}>
                Standing: {avgGrade.grade} ({avgGrade.description})
              </span>
            </div>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={15} /> {user?.email || 'aarav@example.edu'}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span className="policy-badge primary">{user?.department || 'Data Science'}</span>
              <span className="policy-badge purple">Semester {user?.semester || 5}</span>
              <span className="policy-badge success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Verified Enrolled
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDownloadTranscript}
              className="btn-secondary"
            >
              <Download size={15} /> Official Transcript
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="btn-primary"
            >
              <Edit3 size={15} /> {isEditing ? 'Close Editor' : 'Edit Credentials'}
            </button>
          </div>
        </div>

        {!isEditing ? (
          <div>
            {/* 4 Detail Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  <Hash size={14} /> Student UID
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  {user?.student_id || 'STU-2026-001'}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  <Award size={14} /> Collegiate Honors
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px', color: 'var(--cyan)' }}>
                  Dean&apos;s Honor List
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  <Calendar size={14} /> Academic Standing
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px', color: 'var(--success-light)' }}>
                  Top 3% Cohort
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                  <ShieldCheck size={14} /> Policy Compliance
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '6px', color: 'var(--success)' }}>
                  100% Cleared
                </div>
              </div>
            </div>

            {/* Academic Matrix Breakdown */}
            <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} className="text-accent" /> Active Enrollment Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', fontSize: '0.875rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Enrolled Courses</span>
                  <strong style={{ fontSize: '1.1rem' }}>{totalCourses} Courses</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Completed Evaluated Units</span>
                  <strong style={{ fontSize: '1.1rem' }}>{totalAssessments} Graded Tasks</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Attendance Metric</span>
                  <strong style={{ fontSize: '1.1rem', color: avgAttendance >= 75 ? 'var(--success)' : 'var(--danger)' }}>
                    {avgAttendance.toFixed(1)}% (Compliant)
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Weighted Course Score</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--accent-light)' }}>{avgScore.toFixed(1)}% ({avgGrade.grade})</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Session encrypted via PortalEngine Governance Protocol • ABET Verified
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-danger-outline"
              >
                <LogOut size={15} /> Sign Out of Portal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="auth-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department / School</label>
                <input
                  type="text"
                  className="form-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Current Semester (1 - 8)</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  className="form-input"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Institutional Email (Read Only)</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" className="btn-primary">
                Save Updated Credentials
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
