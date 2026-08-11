import React, { useContext, useEffect, useState } from 'react';
import {
  LayoutDashboard, Award, Briefcase, Building, BookOpen, BadgeCheck,
  Bot, Target, Trophy, Users, BarChart3, Settings, ShieldCheck,
  GraduationCap, ClipboardList, FileText, LogOut, ChevronRight, Sparkles, Info, MessageSquare, PanelLeftClose, PanelLeft
} from 'lucide-react';
import TeamInfoModal from './TeamInfoModal';

// Role-specific navigation definitions
const NAV_CONFIG = {
  student: [
    { label: 'MAIN', items: [
      { id: 'dashboard',   label: 'Dashboard',        icon: LayoutDashboard },
      { id: 'drives',      label: 'Placement Drives', icon: Briefcase },
      { id: 'milestones',  label: 'My Milestones',    icon: Award },
    ]},
    { label: 'CAREER', items: [
      { id: 'internships', label: 'My Internships',   icon: Building },
      { id: 'assessments', label: 'Assessments',      icon: BookOpen },
      { id: 'credentials', label: 'Credential Wallet',icon: BadgeCheck },
      { id: 'goals',       label: 'Goals & Roadmap',  icon: Target },
    ]},
    { label: 'INTELLIGENCE', items: [
      { id: 'ai',          label: 'AI Career Advisor', icon: Sparkles },
      { id: 'leaderboard', label: 'Leaderboard',       icon: Trophy },
    ]},
  ],
  mentor: [
    { label: 'MAIN', items: [
      { id: 'dashboard',   label: 'Dashboard',         icon: LayoutDashboard },
      { id: 'queue',       label: 'Verification Queue',icon: ClipboardList },
      { id: 'internships', label: 'Internship Reviews',icon: Building },
    ]},
    { label: 'STUDENTS', items: [
      { id: 'students',    label: 'My Students',        icon: Users },
      { id: 'assessments', label: 'Assessments',        icon: BookOpen },
      { id: 'messages',    label: 'Parent Queries',     icon: MessageSquare },
    ]},
  ],
  hod: [
    { label: 'MAIN', items: [
      { id: 'dashboard',   label: 'Department Overview', icon: LayoutDashboard },
      { id: 'analytics',   label: 'Analytics & Reports', icon: BarChart3 },
      { id: 'mentors',     label: 'Mentor Management',   icon: Users },
    ]},
    { label: 'OPERATIONS', items: [
      { id: 'students',    label: 'Student Reports',     icon: GraduationCap },
      { id: 'milestones',  label: 'Milestone Overview',  icon: Award },
    ]},
  ],
  admin: [
    { label: 'MAIN', items: [
      { id: 'dashboard',   label: 'Dashboard',           icon: LayoutDashboard },
      { id: 'faculty',     label: 'Faculty & Staff',     icon: Users },
      { id: 'drives',      label: 'Manage Drives',       icon: Briefcase },
      { id: 'companies',   label: 'Companies',           icon: Building },
    ]},
    { label: 'OPERATIONS', items: [
      { id: 'interviews',  label: 'Interview Schedule',  icon: ClipboardList },
      { id: 'offers',      label: 'Offer Letters',       icon: FileText },
      { id: 'analytics',   label: 'Placement Intel',     icon: BarChart3 },
      { id: 'billing',     label: 'Billing & Subs',      icon: ShieldCheck },
    ]},
  ],
  superadmin: [
    { label: 'PLATFORM', items: [
      { id: 'dashboard',   label: 'Platform Hub',        icon: LayoutDashboard },
      { id: 'tenants',     label: 'All Institutions',    icon: Building },
      { id: 'analytics',   label: 'Global Analytics',    icon: BarChart3 },
    ]},
    { label: 'SECURITY', items: [
      { id: 'audit',       label: 'Audit Logs',          icon: ShieldCheck },
      { id: 'settings',    label: 'Platform Settings',   icon: Settings },
    ]},
  ],
  parent: [
    { label: 'MAIN', items: [
      { id: 'dashboard',   label: 'Child Overview',      icon: LayoutDashboard },
      { id: 'progress',    label: 'Placement Progress',  icon: Briefcase },
      { id: 'milestones',  label: 'Milestone History',   icon: Award },
      { id: 'messages',    label: 'Mentor Messages',     icon: MessageSquare },
      { id: 'settings',    label: 'Account Settings',    icon: Settings },
    ]},
  ],
};

export default function Sidebar({ role, activePanel, setActivePanel, collapsed, setCollapsed, toggleSidebar, user }) {
  const groups = NAV_CONFIG[role] || NAV_CONFIG.student;
  const [showInfo, setShowInfo] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const initials = user?.name
    ? user.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
    : 'US';

  const handleNavClick = (id) => {
    setActivePanel(id);
    if (typeof window !== 'undefined' && window.innerWidth <= 768 && setCollapsed) {
      setCollapsed(true);
    }
  };

  return (
    <>
      {!collapsed && typeof window !== 'undefined' && window.innerWidth <= 768 && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setCollapsed ? setCollapsed(true) : toggleSidebar ? toggleSidebar() : null}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.65)', zIndex: 9998, backdropFilter: 'blur(3px)' }}
        />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : 'open'}`} data-collapsed={collapsed}>
        {/* Brand Header */}
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="sidebar-brand-logo">T</div>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, overflow: 'hidden' }}>
              <h2 className="sidebar-title" style={{ margin: 0, whiteSpace: 'nowrap' }}>TalentTrack</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="badge badge-role" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
                  {role.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {groups.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <div className="sidebar-section-label">{group.label}</div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.id}
                    className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={collapsed ? item.label : undefined}
                    style={{ minHeight: '40px' }}
                  >
                    <Icon size={16} className="nav-icon" />
                    {!collapsed && <span className="nav-text">{item.label}</span>}
                    {!collapsed && activePanel === item.id && (
                      <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{initials}</div>
            {!collapsed && (
              <div className="user-details">
                <div className="user-name">{user?.name || 'User'}</div>
                <div className="user-meta">{user?.email || role}</div>
              </div>
            )}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', minHeight: '38px', marginTop: '8px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'var(--card-hover)', border: '1px solid var(--card-border)', borderRadius: '8px', color: 'var(--text-main)' }}
            onClick={() => setCollapsed ? setCollapsed(!collapsed) : toggleSidebar ? toggleSidebar() : null}
            title={collapsed ? "Expand Sidebar" : "Minimize Sidebar"}
          >
            {collapsed ? <PanelLeft size={16} color="var(--role-primary)" /> : <PanelLeftClose size={16} color="var(--role-primary)" />}
            {!collapsed && <span style={{ fontWeight: '600' }}>Minimize Sidebar</span>}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', minHeight: '38px', marginTop: '6px', justifyContent: collapsed ? 'center' : 'flex-start', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
            onClick={() => setShowInfo(true)}
            title="About Team & Founders"
          >
            <Info size={15} color="var(--role-primary)" />
            {!collapsed && <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>About Team</span>}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', minHeight: '38px', marginTop: '4px', justifyContent: collapsed ? 'center' : 'flex-start' }}
            onClick={handleLogout}
            title="Sign Out"
          >
            <LogOut size={14} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
        <TeamInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      </aside>
    </>
  );
}
