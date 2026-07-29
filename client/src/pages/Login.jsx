import React, { useState, useEffect, useContext } from 'react';
import { Shield, Building, UserCheck, GraduationCap, Users, LogIn, Sparkles, ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, setToken } from '../services/api';
import { ToastContext } from '../App';
import TeamInfoModal from '../components/TeamInfoModal';
import InstitutionOnboardingModal from '../components/InstitutionOnboardingModal';

const ROLES = [
  { id: 'superadmin', label: 'Super Admin',  icon: Shield,        desc: 'Platform level' },
  { id: 'admin',      label: 'Admin',         icon: Building,      desc: 'Institution' },
  { id: 'hod',        label: 'HOD',           icon: UserCheck,     desc: 'Department head' },
  { id: 'mentor',     label: 'Mentor',        icon: Users,         desc: 'Faculty guide' },
  { id: 'student',    label: 'Student',       icon: GraduationCap, desc: 'Learner portal' },
  { id: 'parent',     label: 'Parent',        icon: Users,         desc: 'Family access' },
];

export default function Login() {
  const [role, setRole]       = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { addToast }          = useContext(ToastContext);
  const navigate              = useNavigate();

  const handleRoleSelect = (r) => {
    setRole(r);
    setError('');
    document.documentElement.setAttribute('data-role', r);
    setUsername('');
    setPassword('');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-role', role);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data.success && data.token) {
        setToken(data.token);
        localStorage.setItem('talenttrack_user', JSON.stringify(data.user));
        addToast('success', 'Welcome back!', `Signed in as ${data.user.name}`);
        navigate(`/${data.user.role}`);
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.id === role);

  return (
    <div className="login-wrapper">
      <div className="glass-card-login animate-fadein">
        {/* Logo */}
        <div className="login-logo">T</div>
        <h1 className="login-brand-title">TalentTrack</h1>
        <p className="login-subtitle">Enterprise Campus Management & Placement Intelligence Platform</p>

        {/* Role Selector */}
        <div className="role-grid" style={{ marginBottom: '24px' }}>
          {ROLES.map(r => {
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                className={`role-tab ${role === r.id ? 'active' : ''}`}
                onClick={() => handleRoleSelect(r.id)}
              >
                <Icon size={16} />
                <span>{r.label}</span>
                <span style={{ fontSize: '0.62rem', opacity: 0.7 }}>{r.desc}</span>
              </button>
            );
          })}
        </div>



        {/* Error */}
        {error && (
          <div className="error-alert">
            <Lock size={14} /> {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">{role.toUpperCase()} Username or Email</label>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value)} required
              placeholder="Enter username..."
            />
          </div>
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="input-label" style={{ margin: 0 }}>Account Password</label>
              <span 
                style={{ fontSize: '0.72rem', color: 'var(--role-primary)', cursor: 'pointer', fontWeight: '500' }}
                onClick={() => addToast('info', 'Forgot Password', 'Please contact your institution Admin or Super Admin to reset your password.')}
              >
                Forgot Password?
              </span>
            </div>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)} required
              placeholder="Enter password..."
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? (
              <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Signing In...</>
            ) : (
              <><LogIn size={16} /> Sign In to Enterprise Portal</>
            )}
          </button>
        </form>

        {role === 'admin' && (
          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-outline btn-block" onClick={() => setShowOnboarding(true)}>
              <Sparkles size={16} style={{ color: 'var(--color-purple)' }} /> Onboard Institution (Payment & Setup)
            </button>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
          Protected by Multi-Tenant Zero-Trust JWT Authentication
          <br />
          <strong style={{ color: 'var(--text-muted)' }}>MTRX TECH</strong> · Enterprise Edition · <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowInfo(true)}>About Team</span>
        </div>
      </div>
      <TeamInfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      <InstitutionOnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
}
