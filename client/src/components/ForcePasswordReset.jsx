import React, { useState, useContext } from 'react';
import { apiFetch, removeToken } from '../services/api';
import { ToastContext } from '../App';
import { Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ForcePasswordReset({ user, onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });
      
      if (res.success) {
        addToast('success', 'Password Updated', 'Your password has been changed successfully.');
        
        // Update local storage so we don't show this again while preserving parent setup required status
        const updatedUser = { ...user, ...(res.user || {}), needsPasswordChange: false };
        localStorage.setItem('talenttrack_user', JSON.stringify(updatedUser));
        
        if (onComplete) onComplete(updatedUser);
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    localStorage.removeItem('talenttrack_user');
    navigate('/login');
  };

  return (
    <div className="login-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass-card-login animate-fadein" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="stat-icon" style={{ color: 'var(--color-amber)', margin: '0 auto 16px' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ marginBottom: '8px' }}>Action Required</h2>
          <p className="text-muted text-sm">
            For security reasons, you must change your temporary password before accessing the {user.role} portal.
          </p>
        </div>

        {error && (
          <div className="error-alert mb-16">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-16">
            <label className="form-label">New Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
              placeholder="Enter new password"
            />
          </div>
          <div className="form-group mb-24">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-input" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              required 
              placeholder="Confirm new password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-block mb-12" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password & Continue'}
          </button>
          
          <button type="button" className="btn btn-ghost btn-block" onClick={handleLogout}>
            <LogOut size={14} style={{ marginRight: '8px' }} /> Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
