import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Target, 
  User, 
  Bell, 
  GraduationCap, 
  LogOut, 
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { courses } = useCourses();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand">
          <div className="logo-icon">
            <GraduationCap size={22} />
          </div>
          <div className="sidebar-brand-text">
            <span className="brand-name">
              PortalEngine
            </span>
            <span className="brand-tag">Academic OS Enterprise</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav">
        <span className="nav-section-label">Executive Cockpit</span>
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} end>
          <div className="nav-item-content">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <div className="nav-item-content">
            <BookOpen size={18} />
            <span>My Courses</span>
          </div>
          <span className="nav-pill">{courses.length}</span>
        </NavLink>

        <span className="nav-section-label">Grade Intelligence</span>
        <NavLink to="/desired-grades" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <div className="nav-item-content">
            <Target size={18} />
            <span>Desired Grades</span>
          </div>
          <span className="nav-pill" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--purple-light)' }}>
            What-If
          </span>
        </NavLink>

        <span className="nav-section-label">Records & Governance</span>
        <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <div className="nav-item-content">
            <User size={18} />
            <span>Student Profile</span>
          </div>
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <div className="nav-item-content">
            <Bell size={18} />
            <span>Policy Updates</span>
          </div>
          <span className="nav-pill" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-light)' }}>
            2
          </span>
        </NavLink>

        {/* Institution Info Card */}
        <div className="sidebar-institution-card" style={{ marginTop: 'auto' }}>
          <div className="sidebar-institution-header">
            <Award size={14} />
            <span>Institutional Honors</span>
          </div>
          <p className="sidebar-institution-sub">Dean&apos;s Honor Roll</p>
          <p className="sidebar-institution-desc">
            Top 5% Cohort Benchmark • 100% Policy Compliant
          </p>
        </div>
      </nav>
      
      {/* Student Identity Bottom Card */}
      <div className="user-profile-small">
        <div className="avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
        </div>
        <div className="user-info-small">
          <h4>{user?.name || 'Aarav'}</h4>
          <p>{user?.student_id || 'STU-2026-001'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-logout-btn"
          title="Sign Out / Switch Academic Profile"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
