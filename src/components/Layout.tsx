import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, ShieldCheck, Sparkles, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        {/* Executive Master Navigation Bar */}
        <header className="top-navbar">
          <div className="top-navbar-left">
            <div className="term-badge">
              <span className="term-badge-dot"></span>
              <span>Fall 2026 Academic Term • Week 9 of 16</span>
            </div>
            <div className="accreditation-pill" title="Institutional Policy Engine Verified">
              <ShieldCheck size={14} />
              <span>ABET & NAAC A++ Compliant</span>
            </div>
          </div>

          <div className="top-navbar-right">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--panel-border)',
              borderRadius: '20px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <Search size={14} />
              <span>Search policies or courses...</span>
              <span style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '1px 5px',
                borderRadius: '4px',
                color: 'var(--text-secondary)'
              }}>⌘K</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--accent-light)'
            }}>
              <Sparkles size={14} />
              <span>Dean&apos;s Honor List Track</span>
            </div>

            <Link to="/notifications" className="top-icon-btn" title="System Notifications & Policy Updates">
              <Bell size={17} />
              <span className="top-icon-badge"></span>
            </Link>

            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Outlet with standardized container */}
        <div className="page-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
