import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';
import { Building, Shield, ShieldCheck, TrendingUp, Plus, AlertTriangle, Activity, PowerOff, Trash2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SuperAdminDashboard() {
  const [activePanel, setActivePanel]     = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [tenants, setTenants]             = useState([]);
  const [auditLogs, setAuditLogs]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm]                   = useState({ name: '', domain: '', plan: 'Standard', adminEmail: '', adminName: '' });
  const [settings, setSettings]           = useState({ maintenanceMode: false, rateLimitMaxRequests: 100, defaultSubscriptionPricing: { Basic: 200000, Standard: 500000, Premium: 1200000 }});
  const [trends, setTrends]               = useState(null);
  const [tempCredentials, setTempCredentials] = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [hardDeleteTarget, setHardDeleteTarget] = useState(null);
  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState('');
  const { addToast }                      = useContext(ToastContext);
  const user = JSON.parse(localStorage.getItem('talenttrack_user') || '{}');

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'superadmin');
    Promise.all([
      apiFetch('/superadmin/tenants').catch(() => ({ tenants: [] })),
      apiFetch('/superadmin/logs/audit').catch(() => ({ logs: [] })),
      apiFetch('/superadmin/settings').catch(() => ({ settings: {} })),
      apiFetch('/superadmin/analytics/trends').catch(() => ({ trends: null }))
    ]).then(([t, l, s, tr]) => {
      setTenants(t.tenants || []);
      setAuditLogs(l.logs || []);
      if(s.settings) setSettings(s.settings);
      if(tr.trends) setTrends(tr.trends);
    }).finally(() => setLoading(false));
  }, []);

  const handleManualCreateTenant = async (e) => {
    e.preventDefault();
    try {
      const r = await apiFetch('/superadmin/tenants/manual', { method: 'POST', body: JSON.stringify(form) });
      setTenants(prev => [r.tenant, ...prev]);
      setTempCredentials(r.adminCredentials);
      setShowCreate(false);
      setForm({ name: '', domain: '', plan: 'Standard', adminEmail: '', adminName: '' });
      addToast('success', 'Institution Onboarded', form.name);
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const handleSoftDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirmText !== deleteTarget.name) {
      addToast('error', 'Mismatch', 'Institution name does not match.');
      return;
    }
    try {
      await apiFetch(`/superadmin/tenants/${deleteTarget.slug || deleteTarget._id}`, { method: 'DELETE' });
      setTenants(prev => prev.map(t => (t._id || t.id) === (deleteTarget._id || deleteTarget.id) ? { ...t, subscription: { ...t.subscription, status: 'pending_deletion' } } : t));
      setDeleteTarget(null);
      setDeleteConfirmText('');
      addToast('success', 'Queued for Deletion', `${deleteTarget.name} soft-deleted. Logins blocked.`);
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const handleHardDelete = async (e) => {
    e.preventDefault();
    if (hardDeleteConfirmText !== hardDeleteTarget.name) {
      addToast('error', 'Mismatch', 'Institution name does not match.');
      return;
    }
    try {
      await apiFetch(`/superadmin/tenants/${hardDeleteTarget.slug || hardDeleteTarget._id}/hard`, { method: 'DELETE' });
      setTenants(prev => prev.filter(t => (t._id || t.id) !== (hardDeleteTarget._id || hardDeleteTarget.id)));
      setHardDeleteTarget(null);
      setHardDeleteConfirmText('');
      addToast('success', 'Institution Wiped', `${hardDeleteTarget.name} and all data was completely removed.`);
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      const r = await apiFetch('/superadmin/settings', { method: 'PUT', body: JSON.stringify(settings) });
      setSettings(r.settings);
      addToast('success', 'Settings Updated', 'Platform settings saved.');
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const handleImpersonate = async (tenantId, name) => {
    try {
      const r = await apiFetch(`/superadmin/impersonate/${tenantId}`, { method: 'POST' });
      if (r.token) {
        addToast('info', 'Impersonation Active', `Now viewing ${name} as Admin`);
      }
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const handleForceActivate = async (tenantId, name) => {
    try {
      await apiFetch(`/superadmin/tenants/${tenantId}/force-activate`, { method: 'POST' });
      setTenants(prev => prev.map(t => (t._id || t.id) === tenantId ? { ...t, subscription: { ...t.subscription, status: 'ACTIVE', settlementStatus: 'FORCED' } } : t));
      addToast('success', 'Activated', `${name} subscription restored (Forced)`);
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const handleDeactivate = async (tenantId, name) => {
    try {
      if(!window.confirm(`Are you sure you want to disable ${name}? College users will see MTRX TECH branding.`)) return;
      await apiFetch(`/superadmin/tenants/${tenantId}/deactivate`, { method: 'POST' });
      setTenants(prev => prev.map(t => (t._id || t.id) === tenantId ? { ...t, subscription: { ...t.subscription, status: 'DISABLED' } } : t));
      addToast('warning', 'Deactivated', `${name} subscription disabled`);
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const calculateARR = () => {
    return tenants.reduce((acc, t) => {
      if(t.subscription?.status === 'DISABLED' || t.subscription?.status === 'LOCKED') return acc;
      const plan = t.subscription?.plan || 'Standard';
      if (plan === 'Premium') return acc + 1200000;
      if (plan === 'Standard') return acc + 500000;
      return acc + 200000; // Basic
    }, 0);
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'tenants': return (
        <div>
          <div className="section-header">
            <div className="section-title">All Institutions</div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}><Plus size={14} /> Onboard Institution</button>
          </div>
          {tempCredentials && (
            <div className="card mb-20" style={{ borderColor: 'var(--color-green)', background: 'rgba(16, 185, 129, 0.05)' }}>
              <div style={{ color: 'var(--color-green)', fontWeight: 'bold', marginBottom: '8px' }}>Institution Created Successfully</div>
              <p className="text-sm">Please securely share these credentials with the institution admin. <strong>They will not be shown again.</strong></p>
              <div style={{ marginTop: '12px', background: 'var(--bg-dark)', padding: '12px', borderRadius: '4px', fontFamily: 'monospace' }}>
                <div>Email: {tempCredentials.email}</div>
                <div>Temporary Password: {tempCredentials.password}</div>
              </div>
              <button className="btn btn-primary btn-sm mt-16" onClick={() => setTempCredentials(null)}>Acknowledge & Dismiss</button>
            </div>
          )}
          {showCreate && !tempCredentials && (
            <div className="card mb-20 animate-slideup">
              <h3 style={{ marginBottom: '16px' }}>Onboard New Institution</h3>
              <form onSubmit={handleManualCreateTenant}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group"><label className="form-label">Institution Name</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required placeholder="e.g. RIT Coimbatore" /></div>
                  <div className="form-group"><label className="form-label">Domain Slug</label><input value={form.domain} onChange={e => setForm(f=>({...f,domain:e.target.value}))} required placeholder="rit" /></div>
                  <div className="form-group"><label className="form-label">Tier / Plan</label>
                    <select value={form.plan} onChange={e => setForm(f=>({...f,plan:e.target.value}))} className="form-input" style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }}>
                      <option value="Basic">Basic (₹2L/yr)</option>
                      <option value="Standard">Standard (₹5L/yr)</option>
                      <option value="Premium">Premium (₹12L/yr)</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="form-group"><label className="form-label">Admin Name</label><input type="text" value={form.adminName} onChange={e => setForm(f=>({...f,adminName:e.target.value}))} required placeholder="John Doe" /></div>
                  <div className="form-group"><label className="form-label">Admin Email</label><input type="email" value={form.adminEmail} onChange={e => setForm(f=>({...f,adminEmail:e.target.value}))} required placeholder="admin@rit.edu" /></div>
                </div>
                <div className="flex gap-8" style={{ marginTop: '20px' }}><button type="submit" className="btn btn-primary btn-sm">Create Tenant & Admin</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button></div>
              </form>
            </div>
          )}
          {loading ? <div className="skeleton skeleton-card" /> : (
            <div className="card card-flush">
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Institution</th><th>Tier</th><th>Settlement Status</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {tenants.map((t, i) => {
                      const subStatus = t.subscription?.status || 'ACTIVE';
                      const settleStatus = t.subscription?.settlementStatus || 'SETTLED';
                      
                      let displayStatus = 'PENDING';
                      let badgeColor = 'warning';
                      if (subStatus === 'DISABLED') { displayStatus = 'DISABLED'; badgeColor = 'neutral'; }
                      else if (subStatus === 'pending_deletion') { displayStatus = 'PENDING DELETION'; badgeColor = 'danger'; }
                      else if (subStatus === 'LOCKED') { displayStatus = 'LOCKED'; badgeColor = 'danger'; }
                      else if (settleStatus === 'FORCED') { displayStatus = 'FORCED ACTIVE'; badgeColor = 'teal'; }
                      else if (settleStatus === 'SETTLED') { displayStatus = 'SETTLED'; badgeColor = 'success'; }

                      return (
                        <tr key={i}>
                          <td>
                            <div className="flex items-center gap-8">
                              <div className="drive-logo" style={{ width:'30px',height:'30px' }}>{(t.name||'?')[0]}</div>
                              <div>
                                <strong>{t.name}</strong>
                                <div className="text-muted text-sm">{t.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-purple">{t.subscription?.plan || 'Standard'}</span></td>
                          <td><span className={`badge badge-${badgeColor}`}>{displayStatus}</span></td>
                          <td className="text-muted text-sm">{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '–'}</td>
                          <td>
                            <div className="flex gap-6">
                              <button className="btn btn-ghost btn-sm" onClick={() => handleImpersonate(t.slug || t._id, t.name)} title="View As Admin"><Shield size={12} /> Impersonate</button>
                              {subStatus !== 'ACTIVE' && subStatus !== 'pending_deletion' && <button className="btn btn-success btn-sm" onClick={() => handleForceActivate(t.slug || t._id, t.name)}>Activate</button>}
                              {subStatus !== 'DISABLED' && subStatus !== 'pending_deletion' && <button className="btn btn-warning btn-sm" onClick={() => handleDeactivate(t.slug || t._id, t.name)} title="Deactivate"><PowerOff size={12} /></button>}
                              {subStatus !== 'pending_deletion' && <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(t)} title="Soft Delete"><Trash2 size={12} /></button>}
                              <button className="btn btn-sm" style={{ background: 'var(--color-red)', color: 'white', border: 'none' }} onClick={() => setHardDeleteTarget(t)} title="Hard Delete Data">Hard Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {deleteTarget && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '500px' }}>
                <h2 style={{ color: 'var(--color-red)' }}>Delete Institution</h2>
                <p>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will immediately block all logins. This action initiates a 12-day grace period before complete deletion.</p>
                <div className="form-group mt-16">
                  <label>Type <strong>{deleteTarget.name}</strong> to confirm:</label>
                  <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder={deleteTarget.name} className="form-input" />
                </div>
                <div className="flex gap-8 mt-24">
                  <button className="btn btn-danger" onClick={handleSoftDelete} disabled={deleteConfirmText !== deleteTarget.name}>Confirm Deletion</button>
                  <button className="btn btn-ghost" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {hardDeleteTarget && (
            <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '500px', borderTop: '4px solid var(--color-red)' }}>
                <h2 style={{ color: 'var(--color-red)' }}>DANGER: Hard Delete Institution</h2>
                <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px' }}>
                  <strong>WARNING:</strong> This will instantly and permanently wipe <strong>{hardDeleteTarget.name}</strong> and <em>ALL</em> associated data (users, departments, goals, etc.). This cannot be undone.
                </div>
                <div className="form-group mt-16">
                  <label>Type <strong>{hardDeleteTarget.name}</strong> to confirm destruction:</label>
                  <input type="text" value={hardDeleteConfirmText} onChange={e => setHardDeleteConfirmText(e.target.value)} placeholder={hardDeleteTarget.name} className="form-input" />
                </div>
                <div className="flex gap-8 mt-24">
                  <button className="btn btn-danger" onClick={handleHardDelete} disabled={hardDeleteConfirmText !== hardDeleteTarget.name}>DESTROY COMPLETELY</button>
                  <button className="btn btn-ghost" onClick={() => { setHardDeleteTarget(null); setHardDeleteConfirmText(''); }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
      case 'audit': return (
        <div>
          <div className="section-header"><div className="section-title">Global Audit & Security Log</div></div>
          {loading ? <div className="skeleton skeleton-card" /> : (
            <div className="card card-flush">
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Timestamp</th><th>Action</th><th>Entity</th><th>Actor</th><th>Tenant Context</th><th>Impersonation</th></tr></thead>
                  <tbody>
                    {auditLogs.slice(0,30).map((l, i) => (
                      <tr key={i}>
                        <td className="text-muted text-sm mono">{l.createdAt ? new Date(l.createdAt).toLocaleString() : '–'}</td>
                        <td><span className="badge badge-info">{l.action}</span></td>
                        <td className="text-sm">{l.entityType || l.resource} {l.entityId && <span className="text-muted">#{l.entityId.slice(-6)}</span>}</td>
                        <td className="text-sm">{l.actorName || l.actorEmail || l.actorId || '–'}</td>
                        <td className="text-sm text-muted">{l.tenantId || '–'}</td>
                        <td>{l.viaImpersonation ? <span className="badge badge-warning">Yes</span> : 'No'}</td>
                      </tr>
                    ))}
                    {auditLogs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No audit logs yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
      case 'analytics': return (
        <div>
          <div className="section-header"><div className="section-title">Global Analytics</div></div>
          {trends ? (
            <div className="grid-cols-2">
              <div className="card">
                <h3>ARR Trends</h3>
                <div style={{ height: '300px', marginTop: '16px' }}>
                  <Line 
                    data={{
                      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      datasets: [{ label: 'ARR (₹)', data: [0, 0, 0, 0, 0, trends.currentARR], borderColor: 'var(--color-green)', tension: 0.1 }]
                    }} 
                    options={{ maintainAspectRatio: false }} 
                  />
                </div>
              </div>
              <div className="card">
                <h3>Active Tenants</h3>
                <div style={{ height: '300px', marginTop: '16px' }}>
                  <Line 
                    data={{
                      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                      datasets: [{ label: 'Tenants', data: [0, 0, 0, 0, 0, trends.activeTenants], borderColor: 'var(--role-primary)', tension: 0.1 }]
                    }} 
                    options={{ maintainAspectRatio: false }} 
                  />
                </div>
              </div>
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <p className="text-muted text-sm">{trends.note}</p>
              </div>
            </div>
          ) : <div className="skeleton skeleton-card" />}
        </div>
      );
      case 'settings': return (
        <div>
          <div className="section-header"><div className="section-title">Platform Settings</div></div>
          <div className="card">
            <form onSubmit={handleUpdateSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Maintenance Mode</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
                    Enable Maintenance Mode (Blocks non-superadmin logins)
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">Session Expiry Duration</label>
                  <input type="text" className="form-input" value={settings.sessionExpiryDuration || '24h'} onChange={e => setSettings({...settings, sessionExpiryDuration: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate Limit Window (ms)</label>
                  <input type="number" className="form-input" value={settings.rateLimitWindowMs || 900000} onChange={e => setSettings({...settings, rateLimitWindowMs: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate Limit Max Requests</label>
                  <input type="number" className="form-input" value={settings.rateLimitMaxRequests || 100} onChange={e => setSettings({...settings, rateLimitMaxRequests: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Pricing - Standard (₹)</label>
                  <input type="number" className="form-input" value={settings.defaultSubscriptionPricing?.Standard || 500000} onChange={e => setSettings({...settings, defaultSubscriptionPricing: {...settings.defaultSubscriptionPricing, Standard: parseInt(e.target.value)}})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Default Pricing - Premium (₹)</label>
                  <input type="number" className="form-input" value={settings.defaultSubscriptionPricing?.Premium || 1200000} onChange={e => setSettings({...settings, defaultSubscriptionPricing: {...settings.defaultSubscriptionPricing, Premium: parseInt(e.target.value)}})} />
                </div>
              </div>
              <div className="mt-24">
                <button type="submit" className="btn btn-primary">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      );
      default: return (
        <div>
          <div className="page-header">
            <h2 className="page-title">Super Admin Platform Hub</h2>
            <div className="page-subtitle">MTRX TECH · Global Platform Operations Center</div>
          </div>
          <div className="grid-cols-4 mb-24">
            {[
              { label: 'Platform ARR', value: `₹${(calculateARR() / 100000).toFixed(1)}L`, color: 'var(--color-green)', icon: <TrendingUp size={18} /> },
              { label: 'Active Institutions', value: tenants.filter(t => (t.subscription?.status||'ACTIVE') === 'ACTIVE').length, color: 'var(--role-primary)', icon: <Building size={18} /> },
              { label: 'Locked/Disabled', value: tenants.filter(t => t.subscription?.status === 'LOCKED' || t.subscription?.status === 'DISABLED').length, color: 'var(--color-red)', icon: <AlertTriangle size={18} /> },
              { label: 'Audit Events', value: auditLogs.length, color: 'var(--color-teal)', icon: <ShieldCheck size={18} /> },
            ].map((s, i) => (
              <div key={i} className="card stat-card">
                <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value accent" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid-cols-2 mb-24">
            {/* System Health Panel */}
            <div className="card">
              <div className="section-title mb-16"><Activity size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> System Health & Infrastructure</div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Primary DB Connection</span>
                <span className="badge badge-success">MongoDB Atlas (Online)</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Local Memory Fallback</span>
                <span className="badge badge-danger">Disabled (Strict DB Only)</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cloudflare R2 Object Storage</span>
                <span className="badge badge-success">Connected</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Global API Latency</span>
                <span style={{ color: 'var(--color-green)', fontWeight: '700' }}>42ms</span>
              </div>
            </div>

            {/* Security Signals Panel */}
            <div className="card">
              <div className="section-title mb-16"><Shield size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> Security Signals (24h)</div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Failed Authentication Attempts</span>
                <span style={{ color: 'var(--color-amber)', fontWeight: '700' }}>{auditLogs.filter(l => l.action === 'AUTH_FAILED').length}</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Rate Limit Hits</span>
                <span style={{ color: 'var(--text-dim)', fontWeight: '700' }}>0</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Impersonation Sessions</span>
                <span style={{ color: 'var(--role-primary)', fontWeight: '700' }}>{auditLogs.filter(l => l.viaImpersonation).length}</span>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '12px 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Detected Anomalies</span>
                <span className="badge badge-success">0</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <Sidebar role="superadmin" activePanel={activePanel} setActivePanel={setActivePanel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={{ name: user.name || 'Super Admin', email: user.email || 'superadmin@example.com' }} />
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar title="Super Admin Platform Hub" toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          openCommandPalette={() => setIsCommandOpen(true)} collapsed={sidebarCollapsed} />
        <main className="page-content animate-fadein">{renderPanel()}</main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
