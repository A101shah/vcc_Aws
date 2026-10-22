import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your university email address');
      return;
    }
    if (!password) {
      setError('Please enter your account password');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(email, password);
      setIsLoading(false);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Authentication failed. Please verify your credentials.');
      }
    }, 350);
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      const res = login(demoEmail, demoPass);
      setIsLoading(false);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Demo login failed.');
      }
    }, 300);
  };

  return (
    <div className="auth-page-container">
      {/* Dynamic Ambient Glow Orbs */}
      <div className="auth-ambient-orb auth-orb-1"></div>
      <div className="auth-ambient-orb auth-orb-2"></div>

      <div className="auth-card glass-panel animate-fade-in">
        {/* Header Branding */}
        <div className="auth-header">
          <div className="logo-icon auth-logo">
            <GraduationCap size={28} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span className="policy-badge primary">PortalEngine Academic OS</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• v2.4 Enterprise</span>
          </div>
          <h1 className="auth-title">Student Portal Login</h1>
          <p className="auth-subtitle">Sign in to access real-time continuous evaluation marks & policy radars</p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="auth-error-banner animate-fade-in" role="alert">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">University Email</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="student@example.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="login-password" className="form-label">Password</label>
              <button 
                type="button" 
                onClick={() => handleDemoLogin('aarav@example.edu', 'demoPass123')}
                className="forgot-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Use demo password?
              </button>
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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

          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Keep session authenticated</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} className="text-success" />
              <span>TLS 256-bit Encrypted</span>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            className="auth-primary-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : (
              <>
                <span>Sign In to Executive Dashboard</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast-Track Section */}
        <div className="auth-divider">
          <span>OR INSTANT EXECUTIVE ACCESS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleDemoLogin('aarav@example.edu', 'demoPass123')}
            className="demo-login-btn"
            id="demo-login-btn"
            disabled={isLoading}
          >
            <Sparkles size={18} className="text-accent" />
            <div style={{ textAlign: 'left', flex: 1, padding: '0 8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>1-Click Demo: Aarav Patel</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Data Science (Sem 5) • Dean's Honors List</div>
            </div>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('elena.rostova@example.edu', 'elenaPass123')}
            className="demo-login-btn"
            style={{ borderColor: 'rgba(139, 92, 246, 0.25)', background: 'rgba(139, 92, 246, 0.05)' }}
            disabled={isLoading}
          >
            <UserCheck size={18} style={{ color: 'var(--purple-light)' }} />
            <div style={{ textAlign: 'left', flex: 1, padding: '0 8px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>1-Click Demo: Elena Rostova</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI & Machine Learning (Sem 5) • 9.8 SGPA</div>
            </div>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <p>
            Don't have an enrolled academic profile?{' '}
            <Link to="/signup" className="auth-link">
              Register Student Account →
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
