import React, { useState, useContext, useEffect } from 'react';
import { X, Building, CheckCircle, CreditCard, ChevronRight, AlertCircle, Shield } from 'lucide-react';
import { apiFetch, setToken } from '../services/api';
import { ToastContext } from '../App';
import { useNavigate } from 'react-router-dom';

export default function InstitutionOnboardingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState('Premium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    institutionName: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminUsername: '',
    adminPassword: ''
  });

  const { addToast } = useContext(ToastContext);
  const navigate = useNavigate();

  // Load Razorpay Script
  useEffect(() => {
    if (isOpen) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSlugGen = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // 1. Create Order and Provision Pending Tenant
      const orderRes = await apiFetch('/public/onboard-institution/create-order', {
        method: 'POST',
        body: JSON.stringify({ ...formData, plan })
      });
      
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to create order.');
      }

      setLoading(false);
      setStep(3); // Move to Payment Step (Checkout)

      // 2. Open Razorpay Checkout
      const options = {
        key: orderRes.key_id,
        amount: orderRes.amount,
        currency: 'INR',
        name: formData.institutionName,
        description: `${plan} Plan Subscription`,
        order_id: orderRes.order_id,
        handler: async function (response) {
          // Razorpay returns razorpay_payment_id, razorpay_order_id, razorpay_signature
          // The webhook handles the actual activation.
          // We can just log them in now, since webhook will activate it almost instantly.
          addToast('success', 'Payment Successful', `Welcome to TalentTrack, ${formData.institutionName}!`);
          
          try {
            const loginRes = await apiFetch('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ username: formData.adminUsername, password: formData.adminPassword })
            });
            
            if (loginRes.success && loginRes.token) {
              setToken(loginRes.token);
              localStorage.setItem('talenttrack_user', JSON.stringify(loginRes.user));
              document.documentElement.setAttribute('data-role', 'admin');
              onClose();
              navigate('/admin');
            } else {
              onClose();
              addToast('info', 'Please Login', 'Your account was created successfully. Please login.');
            }
          } catch (loginErr) {
            onClose();
            addToast('info', 'Please Login', 'Your account was created. Please login.');
          }
        },
        prefill: {
          name: formData.adminName,
          email: formData.adminEmail
        },
        theme: {
          color: '#7c3aed'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         setError(`Payment failed: ${response.error.description}`);
         setStep(2); // Go back to let them try again
      });
      rzp.open();

    } catch (err) {
      setError(err.message || 'Failed to initiate onboarding.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card animate-slideup" style={{ padding: '0', overflow: 'hidden', maxWidth: '650px', background: 'var(--surface-dark)' }}>
        
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, var(--role-primary) 0%, var(--color-purple) 100%)', padding: '24px', position: 'relative' }}>
          <button className="icon-btn" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', color: '#fff', background: 'rgba(0,0,0,0.2)' }}>
            <X size={16} />
          </button>
          <div className="flex items-center gap-12" style={{ color: '#fff' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '50%' }}>
              <Building size={24} />
            </div>
            <div>
              <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Institution Onboarding</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '4px' }}>Deploy your private talent intelligence environment.</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          
          {/* STEP 1: Select Plan */}
          {step === 1 && (
            <div className="animate-fadein">
              <div className="section-title mb-16">1. Select Subscription Plan</div>
              <div className="grid-cols-2 mb-20">
                <div 
                  className={`card cursor-pointer ${plan === 'Standard' ? 'border-primary' : ''}`}
                  onClick={() => setPlan('Standard')}
                  style={{ border: plan === 'Standard' ? '2px solid var(--role-primary)' : '2px solid var(--card-border)' }}
                >
                  <h3 className="mb-8">Standard</h3>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>₹6,00,000<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>/yr</span></div>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>Up to 2,000 Students</li>
                    <li>Basic PRS Tracking</li>
                    <li>Standard Support</li>
                  </ul>
                </div>
                <div 
                  className={`card cursor-pointer ${plan === 'Premium' ? 'border-primary' : ''}`}
                  onClick={() => setPlan('Premium')}
                  style={{ border: plan === 'Premium' ? '2px solid var(--color-purple)' : '2px solid var(--card-border)', position: 'relative' }}
                >
                  <span className="badge badge-purple" style={{ position: 'absolute', top: '-10px', right: '10px' }}>RECOMMENDED</span>
                  <h3 className="mb-8">Premium Enterprise</h3>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>₹12,00,000<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>/yr</span></div>
                  <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.6' }}>
                    <li>Unlimited Students</li>
                    <li>Advanced AI Career Advisor</li>
                    <li>Priority Setup & Account Manager</li>
                  </ul>
                </div>
              </div>
              <div className="text-right">
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  Continue to Setup <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Setup Profile */}
          {step === 2 && (
            <div className="animate-fadein">
              <div className="section-title mb-16">2. Setup Environment</div>
              
              {error && (
                <div className="flex items-center gap-8 mb-16" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-red)', borderRadius: 'var(--r-md)', fontSize: '0.9rem' }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleCreateOrder}>
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Institution Name</label>
                    <input 
                      className="form-input" 
                      required 
                      placeholder="e.g. Ramco Institute"
                      value={formData.institutionName}
                      onChange={e => setFormData({ ...formData, institutionName: e.target.value, slug: handleSlugGen(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Domain Slug (Tenant ID)</label>
                    <input 
                      className="form-input" 
                      required 
                      placeholder="e.g. rit"
                      value={formData.slug}
                      onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    />
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: '4px' }}>
                      talenttrack.app/{formData.slug}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--card-border)', margin: '16px 0' }} />
                <h4 className="mb-16 flex items-center gap-8"><Shield size={16} color="var(--color-purple)" /> Primary Admin Account</h4>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label">Admin Full Name</label>
                    <input className="form-input" required placeholder="e.g. Dr. Jane Doe" value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Admin Email</label>
                    <input className="form-input" type="email" required placeholder="admin@univ.edu" value={formData.adminEmail} onChange={e => setFormData({ ...formData, adminEmail: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input className="form-input" required placeholder="johndoe_admin" value={formData.adminUsername} onChange={e => setFormData({ ...formData, adminUsername: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input className="form-input" type="password" required placeholder="Min. 6 characters" value={formData.adminPassword} onChange={e => setFormData({ ...formData, adminPassword: e.target.value })} minLength={6} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-12 mt-12">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Initializing...</>
                    ) : (
                      <><CreditCard size={16} /> Proceed to Payment</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Payment Checkout Pending (Razorpay active) */}
          {step === 3 && (
            <div className="animate-fadein text-center py-20">
              <div className="section-title mb-20">3. Secure Payment Checkout</div>
              <div className="card mb-20" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                <div className="flex items-center justify-between mb-16 pb-16" style={{ borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ fontWeight: '700' }}>{plan} Plan - Annual</div>
                  <div style={{ fontWeight: '800', color: 'var(--role-primary)' }}>{plan === 'Premium' ? '₹12,00,000' : '₹6,00,000'}</div>
                </div>
                <div className="text-center" style={{ color: 'var(--text-muted)' }}>
                  Please complete the payment in the secure Razorpay window.
                  <br /><br />
                  If the window closed, <span style={{ color: 'var(--role-primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setStep(2)}>click here to try again</span>.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
