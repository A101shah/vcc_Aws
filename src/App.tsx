import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CoursePage } from './pages/CoursePage';
import { DesiredGrades } from './pages/DesiredGrades';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Bell } from 'lucide-react';
import { MyCourses } from './pages/MyCourses';
import { VerifyEmail } from './pages/VerifyEmail';

const NotificationsPage: React.FC = () => (
  <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
    <div className="page-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span className="policy-badge primary">Executive Advisory Center</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Real-Time Policy Broadcasts</span>
      </div>
      <h1 className="page-title">Policy Updates & Academic Deadlines</h1>
      <p className="page-subtitle">Continuous Internal Assessment notifications, policy releases, and milestone advisories</p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', borderLeft: '4px solid var(--accent)' }}>
        <div style={{ padding: '10px', background: 'var(--accent-glow)', color: 'var(--accent-light)', borderRadius: '12px' }}>
          <Bell size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              End Semester Final Examination Policy Ratified
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>2 hours ago</span>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Software Engineering (SE201) and Applied Time Series (TS301) final terminal schedules have been locked. Continuous Assessment (ICA) marks must be finalized prior to week 14.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="policy-badge primary">Institutional Policy</span>
            <span className="policy-badge purple">SE201 • TS301</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', borderLeft: '4px solid var(--success)' }}>
        <div style={{ padding: '10px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '12px' }}>
          <Bell size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Target Milestone Achieved: Machine Learning (ML101)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>1 day ago</span>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your cumulative evaluation across Midterm, Lab, and Assignments is currently 86.71% — surpassing your collegiate A+ target!
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="policy-badge success">Target Reached (A+)</span>
            <span className="policy-badge primary">ML101</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', borderLeft: '4px solid var(--purple)' }}>
        <div style={{ padding: '10px', background: 'var(--purple-bg)', color: 'var(--purple-light)', borderRadius: '12px' }}>
          <Bell size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Attendance Policy Clearance Confirmed
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>3 days ago</span>
          </div>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            All 4 registered courses maintain attendance ≥ 80% (well above the institutional 75% threshold). No attendance debarment risk identified.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="policy-badge success">Compliance Cleared</span>
            <span className="policy-badge primary">Academic Audit</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CourseProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-email" element={<VerifyEmail />} />


            {/* Protected Portal Engine Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="courses" element={<MyCourses />} />
              <Route path="courses/:id" element={<CoursePage />} />
              <Route path="desired-grades" element={<DesiredGrades />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CourseProvider>
    </AuthProvider>
  );
};

export default App;
