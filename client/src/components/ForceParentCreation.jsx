import React, { useState, useContext } from 'react';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';

export default function ForceParentCreation({ user, onComplete }) {
  const [form, setForm] = useState({ parentName: '', parentEmail: '', parentPassword: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useContext(ToastContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.parentPassword.length < 6) {
      addToast('error', 'Validation Error', 'Password must be at least 6 characters.');
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiFetch('/students/setup-parent', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      
      addToast('success', 'Parent Account Created', res.message);
      
      // Update local storage and context state with the new user object (which has needsParentLogin = false)
      const updatedUser = { ...user, needsParentLogin: false, ...res.user };
      localStorage.setItem('talenttrack_user', JSON.stringify(updatedUser));
      onComplete(updatedUser);
      
    } catch (err) {
      addToast('error', 'Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '20px' }}>
        <h2 style={{ marginBottom: '8px', color: 'var(--role-primary)' }}>Parent Portal Setup</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '24px' }}>
          Welcome, {user.name}! Before continuing to your dashboard, please set up a login account for your parent/guardian.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Parent/Guardian Full Name</label>
            <input 
              className="form-input" 
              type="text" 
              value={form.parentName}
              onChange={e => setForm({...form, parentName: e.target.value})}
              required 
              placeholder="e.g. Ramesh K"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Parent/Guardian Email</label>
            <input 
              className="form-input" 
              type="email" 
              value={form.parentEmail}
              onChange={e => setForm({...form, parentEmail: e.target.value})}
              required 
              placeholder="parent@example.com"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Set Parent Password</label>
            <input 
              className="form-input" 
              type="password" 
              value={form.parentPassword}
              onChange={e => setForm({...form, parentPassword: e.target.value})}
              required 
              placeholder="Min. 6 characters"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Parent Login & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
