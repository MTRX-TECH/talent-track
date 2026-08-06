import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Key } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function ResetPasswordModal({ isOpen, onClose, addToast }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      if (res.success) {
        addToast('success', 'OTP Sent', 'Check your email for the verification code.');
        setStep(2);
      } else {
        addToast('error', 'Request Failed', res.message || 'Could not send OTP.');
      }
    } catch (err) {
      addToast('error', 'Server Error', 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast('error', 'Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword })
      });
      if (res.success) {
        addToast('success', 'Password Reset', res.message);
        onClose();
      } else {
        addToast('error', 'Reset Failed', res.message || 'Could not reset password.');
      }
    } catch (err) {
      addToast('error', 'Server Error', 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem' }}>
            <Lock size={20} style={{ color: 'var(--color-purple)' }} /> Reset Password
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        
        <div className="modal-body">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            {step === 1 ? 'Enter your account email address to receive a secure OTP verification code.' : 'Enter the 6-digit OTP sent to your email and set your new password.'}
          </p>

          <form onSubmit={step === 1 ? handleRequestOtp : handleResetPassword}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-faint)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  style={{ paddingLeft: '36px', width: '100%' }}
                  disabled={step === 2}
                />
              </div>
            </div>

            {step === 2 && (
              <>
                <div className="input-group">
                  <label className="input-label">6-Digit OTP</label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-faint)' }} />
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="Enter verification code"
                      style={{ paddingLeft: '36px', width: '100%' }}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-faint)' }} />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      style={{ paddingLeft: '36px', width: '100%' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Processing...' : step === 1 ? 'Send OTP' : 'Verify & Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
