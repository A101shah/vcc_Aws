import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Hash, 
  BookOpen, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export const SignUp: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    student_id: '',
    department: 'Data Science',
    semester: 5,
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const departments = [
    'Data Science',
    'Computer Science & Engineering',
    'Artificial Intelligence & ML',
    'Software Engineering',
    'Information Technology',
    'Electronics & Communication'
  ];

  // Dynamic Password Strength Meter
  const passwordStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { score: 0, label: 'None', color: 'transparent' };
    let score = 0;
    if (p.length >= 6) score += 1;
    if (p.length >= 9) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p) || /[A-Z]/.test(p)) score += 1;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'var(--danger)' };
    if (score === 2) return { score: 50, label: 'Fair', color: 'var(--warning)' };
    if (score === 3) return { score: 75, label: 'Good', color: 'var(--accent)' };
    return { score: 100, label: 'Institutional Grade', color: 'var(--success)' };
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'semester' ? parseInt(value) || 1 : value
    }));
    if (error) setError('');
  };

  const handleFillSample = () => {
    setFormData({
      name: 'Rohan Sharma',
      student_id: `STU-2026-${Math.floor(100 + Math.random() * 899)}`,
      department: 'Data Science',
      semester: 5,
      email: `rohan.${Math.floor(100 + Math.random() * 899)}@example.edu`,
      password: 'SecurePass2026!',
      confirmPassword: 'SecurePass2026!',
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide your full legal name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide a valid university email address');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-type your password confirmation.');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const res = signup({
        name: formData.name,
        student_id: formData.student_id || `STU-2026-${Math.floor(100 + Math.random() * 899)}`,
        department: formData.department,
        semester: formData.semester,
        email: formData.email,
      }, formData.password);

      setIsLoading(false);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Failed to complete student registration');
      }
    }, 450);
  };

  return (
    <div className="auth-page-container">
      {/* Dynamic Ambient Glow Orbs */}
      <div className="auth-ambient-orb auth-orb-1"></div>
      <div className="auth-ambient-orb auth-orb-2"></div>

      <div className="auth-card auth-card-wide glass-panel animate-fade-in">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="logo-icon auth-logo">
            <GraduationCap size={28} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="policy-badge primary">Student Registry</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Academic Year 2026-27</span>
          </div>
          <h1 className="auth-title">Register Student Account</h1>
          <p className="auth-subtitle">Create your academic profile to track continuous marks, TEE requirements & SGPA</p>
        </div>

        {/* Rapid Testing Auto-fill Banner */}
        <div className="sample-autofill-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={15} className="text-accent" />
            <span>Need to test rapidly without manual typing?</span>
          </div>
          <button type="button" onClick={handleFillSample} className="autofill-btn">
            Auto-fill Sample Student
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-banner animate-fade-in" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="signup-name" className="form-label">Full Legal Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aarav Patel"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-student-id" className="form-label">Student ID / Roll No.</label>
              <div className="input-wrapper">
                <Hash size={18} className="input-icon" />
                <input
                  id="signup-student-id"
                  name="student_id"
                  type="text"
                  className="form-input"
                  placeholder="e.g. STU-2026-001"
                  value={formData.student_id}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="signup-department" className="form-label">Department / Major</label>
              <div className="input-wrapper">
                <BookOpen size={18} className="input-icon" />
                <select
                  id="signup-department"
                  name="department"
                  className="form-input form-select"
                  value={formData.department}
                  onChange={handleChange}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept} style={{ background: '#0d1322' }}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-semester" className="form-label">Current Academic Semester</label>
              <div className="input-wrapper">
                <select
                  id="signup-semester"
                  name="semester"
                  className="form-input form-select"
                  value={formData.semester}
                  onChange={handleChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem} style={{ background: '#0d1322' }}>Semester {sem}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">University Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="signup-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="student@university.edu"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="signup-password" className="form-label">Account Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="signup-confirm-password" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="signup-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div style={{ marginTop: '-6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Password Security:</span>
                <span style={{ color: passwordStrength.color, fontWeight: 700 }}>{passwordStrength.label}</span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${passwordStrength.score}%`, 
                    height: '100%', 
                    background: passwordStrength.color, 
                    transition: 'all 0.3s ease' 
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} className="text-success" />
            <span>By registering, your account is bound to your university's continuous grading policy rules.</span>
          </div>

          <button
            type="submit"
            id="signup-submit-btn"
            className="auth-primary-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Provisioning Student Profile...</span>
            ) : (
              <>
                <span>Complete Registration & Launch Portal</span>
                <UserPlus size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <p>
            Already have an active student account?{' '}
            <Link to="/login" className="auth-link">
              Sign In to Existing Profile →
            </Link>
          </p>
        </div>

        {/* Institutional Accreditation Pill */}
        <div className="auth-features-preview">
          <div className="feature-pill">
            <CheckCircle2 size={13} /> Continuous ICA Weight Tracking
          </div>
          <div className="feature-pill">
            <CheckCircle2 size={13} /> Desired Grades GPA Optimizer
          </div>
        </div>
      </div>
    </div>
  );
};
