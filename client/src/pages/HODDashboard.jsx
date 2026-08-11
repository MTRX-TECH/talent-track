import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';
import { Users, Award, TrendingUp, AlertTriangle, BarChart3, CheckCircle, Clock, Replace, Upload, Plus } from 'lucide-react';

function MentorManagementPanel({ mentors, fetchMentors, addToast, handleReassign }) {
  const [importLoading, setImportLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', email: '', role: 'mentor' });
  const [generatedCredentials, setGeneratedCredentials] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64 = evt.target.result.split(',')[1];
        const r = await apiFetch('/excel/preview-import', { method: 'POST', body: JSON.stringify({ fileData: base64 }) });
        setPreview(r);
        addToast('info', 'Preview Generated', `Found ${r.validCount} valid records.`);
      } catch (err) {
        addToast('error', 'Import Failed', err.message);
      } finally {
        setImportLoading(false);
        e.target.value = null; // reset input
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteImport = async () => {
    setImportLoading(true);
    try {
      const r = await apiFetch('/excel/import', { method: 'POST', body: JSON.stringify({ users: preview.preview.filter(p => p.status === 'VALID') }) });
      addToast('success', 'Import Complete', r.message);
      if (r.credentials && r.credentials.length > 0) {
        setGeneratedCredentials(r.credentials);
      }
      setPreview(null);
      fetchMentors();
    } catch (e) {
      addToast('error', 'Execution Failed', e.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleManualCreate = async (e) => {
    e.preventDefault();
    setImportLoading(true);
    try {
      const users = [{ ...manualForm, status: 'VALID' }];
      const r = await apiFetch('/excel/import', { method: 'POST', body: JSON.stringify({ users }) });
      addToast('success', 'Mentor Created', `Successfully created ${manualForm.name}`);
      if (r.credentials && r.credentials.length > 0) {
        setGeneratedCredentials(r.credentials);
      }
      setShowManualForm(false);
      setManualForm({ name: '', email: '', role: 'mentor' });
      fetchMentors();
    } catch (err) {
      addToast('error', 'Creation Failed', err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mentor?")) return;
    try {
      await apiFetch(`/faculty/${id}`, { method: 'DELETE' });
      addToast('success', 'Deleted', 'Mentor has been removed from the system.');
      fetchMentors();
    } catch (err) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Mentor Workload & Management</div>
      </div>
      
      {generatedCredentials && (
        <div className="card mb-20 animate-slideup" style={{ borderLeft: '4px solid var(--color-green)' }}>
          <h3 style={{ color: 'var(--color-green)', marginBottom: '8px' }}>Credentials Generated Successfully</h3>
          <p className="text-sm mb-16">Please securely distribute these credentials to the new mentors.</p>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Email</th><th>Temporary Password</th></tr></thead>
              <tbody>
                {generatedCredentials.map((c, i) => (
                  <tr key={i}>
                    <td>{c.email}</td>
                    <td><code style={{ background: 'var(--bg-faint)', padding: '4px 8px', borderRadius: '4px' }}>{c.tempPassword}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-outline btn-sm mt-16" onClick={() => setGeneratedCredentials(null)}>Dismiss</button>
        </div>
      )}

      {showManualForm && !generatedCredentials && (
        <div className="card mb-20 animate-slideup">
          <h3 style={{ marginBottom: '16px' }}>Create Department Mentor</h3>
          <form onSubmit={handleManualCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Full Name</label><input value={manualForm.name} onChange={e => setManualForm(f=>({...f,name:e.target.value}))} required placeholder="Dr. John Doe" /></div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" value={manualForm.email} onChange={e => setManualForm(f=>({...f,email:e.target.value}))} required placeholder="mentor@univ.edu" /></div>
            </div>
            <div className="flex gap-8 mt-8">
              <button type="submit" className="btn btn-primary btn-sm" disabled={importLoading}>{importLoading ? 'Creating...' : 'Create Mentor'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowManualForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!generatedCredentials && !showManualForm && (
      <div className="card mb-20">
        <h3>Add Mentors</h3>
        <p className="text-muted text-sm mb-16">Upload a CSV or Excel file containing mentor details or create one manually.</p>
        {!preview ? (
          <div className="flex gap-8">
            <label className={`btn btn-primary ${importLoading ? 'disabled' : ''}`} style={{ cursor: 'pointer' }}>
              <Upload size={14} /> {importLoading ? 'Processing...' : 'Upload & Preview File'}
              <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} onChange={handleFileUpload} disabled={importLoading} />
            </label>
            <button className="btn btn-ghost" onClick={() => setShowManualForm(true)}>
              <Plus size={14} /> Add Manually
            </button>
          </div>
        ) : (
        <div className="animate-slideup">
          <div className="table-wrapper mb-16">
            <table>
              <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {preview.preview.map((p, i) => (
                  <tr key={i}>
                    <td>{p.row}</td>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.role}</td>
                    <td><span className={`badge badge-${p.status === 'VALID' ? 'success' : 'danger'}`}>{p.status}</span><span className="text-sm text-muted" style={{ marginLeft: '8px' }}>{p.errors}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-success" onClick={handleExecuteImport} disabled={importLoading}><CheckCircle size={14}/> Execute Import</button>
            <button className="btn btn-ghost" onClick={() => setPreview(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
    )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Mentor Name</th><th>Email</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {mentors.map((m, i) => (
                <tr key={m._id || i}>
                  <td><strong>{m.name}</strong></td>
                  <td className="text-muted">{m.email}</td>
                  <td><span className={`badge badge-${m.isActive ? 'success' : 'danger'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-red)' }} onClick={() => handleDelete(m._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {mentors.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No mentors assigned to this department yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function HODDashboard() {
  const [activePanel, setActivePanel]     = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [drives, setDrives]               = useState([]);
  const [milestones, setMilestones]       = useState([]);
  const [mentors, setMentors]             = useState([]);
  const [students, setStudents]           = useState([]);
  const [filterClass, setFilterClass]     = useState('All');
  const [filterMentor, setFilterMentor]   = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading]             = useState(true);
  const { addToast }                      = useContext(ToastContext);
  const user = JSON.parse(localStorage.getItem('talenttrack_user') || '{}');

  const fetchMentors = () => {
    apiFetch('/faculty').then(r => setMentors(r.faculty || [])).catch(() => {});
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'hod');
    Promise.all([
      apiFetch('/drives').catch(() => ({ drives: [] })),
      apiFetch('/milestones').catch(() => ({ milestones: [] })),
      apiFetch('/faculty').catch(() => ({ faculty: [] })),
      apiFetch('/students').catch(() => ({ students: [] }))
    ]).then(([dr, ms, fac, stu]) => {
      setDrives(dr.drives || []);
      setMilestones(ms.milestones || []);
      setMentors(fac.faculty || []);
      setStudents(stu.students || []);
    }).finally(() => setLoading(false));
  }, []);

  const approved = milestones.filter(m => m.status === 'APPROVED').length;
  const pending  = milestones.filter(m => m.status === 'PENDING').length;
  const deptStudents = students.filter(s => !user.departmentName || s.departmentName === user.departmentName || user.departmentName === 'All' || !s.departmentName);
  const avgPRS = deptStudents.length > 0 ? Math.round(deptStudents.reduce((acc, s) => acc + (s.prs || 0), 0) / deptStudents.length) : 0;
  const placedCount = deptStudents.filter(s => s.hasOffer).length;
  const placementRate = deptStudents.length > 0 ? Math.round((placedCount / deptStudents.length) * 100) + '%' : '0%';
  const atRiskList = deptStudents.filter(s => (s.prs || 0) < 50);

  const uniqueClasses = ['All', ...new Set(deptStudents.map(s => s.className).filter(Boolean))];
  const uniqueMentors = ['All', ...new Set(deptStudents.map(s => {
    const m = mentors.find(mnt => (mnt._id || mnt.id) === s.assignedMentorId);
    return m ? m.name : (s.assignedMentorId ? 'Assigned' : 'Unassigned');
  }))];

  const filteredStudents = deptStudents.filter(s => {
    if (filterClass !== 'All' && s.className !== filterClass) return false;
    if (filterMentor !== 'All') {
      const m = mentors.find(mnt => (mnt._id || mnt.id) === s.assignedMentorId);
      const mName = m ? m.name : (s.assignedMentorId ? 'Assigned' : 'Unassigned');
      if (mName !== filterMentor) return false;
    }
    return true;
  });

  const handleReassign = () => {
    addToast('success', 'Mentor Reassigned', 'Student reassigned and audit log updated.');
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'analytics':
        return (
          <div>
            <div className="section-header">
              <div className="section-title">Department Analytics</div>
            </div>
            
            {/* Verification Throughput & PRS Histogram */}
            <div className="grid-cols-2 mb-20">
              <div className="card">
                <div className="section-title" style={{ marginBottom: '16px' }}>PRS Distribution (Histogram)</div>
                {deptStudents.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No student data available.</div>
                ) : (
                  <div>
                    {[
                      { label: 'High Readiness (PRS >= 70)', count: deptStudents.filter(s => (s.prs||0) >= 70).length, color: 'var(--color-green)' },
                      { label: 'Moderate Readiness (40-69)', count: deptStudents.filter(s => (s.prs||0) >= 40 && (s.prs||0) < 70).length, color: 'var(--color-amber)' },
                      { label: 'At-Risk (< 40)', count: deptStudents.filter(s => (s.prs||0) < 40).length, color: 'var(--color-red)' }
                    ].map((row, i) => {
                      const pct = Math.round((row.count / Math.max(deptStudents.length, 1)) * 100);
                      return (
                        <div key={i} style={{ marginBottom: '12px' }}>
                          <div className="flex items-center justify-between mb-4">
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{row.label}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: row.color }}>{row.count} ({pct}%)</span>
                          </div>
                          <div className="progress-bar-track">
                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: row.color, boxShadow: `0 0 8px ${row.color}40` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="card">
                <div className="section-title" style={{ marginBottom: '16px' }}>Milestone Bottlenecks (Pending Time)</div>
                {pending === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No pending bottlenecks detected.</div>
                ) : (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-amber)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800' }}>{pending}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>milestone(s) awaiting verification</div>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="section-title" style={{ marginBottom: '16px' }}>Milestone Status Breakdown</div>
              {[
                { label: 'Approved', count: approved, color: 'var(--color-green)', pct: Math.round((approved / Math.max(milestones.length,1)) * 100) },
                { label: 'Pending Review', count: pending, color: 'var(--color-amber)', pct: Math.round((pending / Math.max(milestones.length,1)) * 100) },
                { label: 'Needs Revision', count: milestones.filter(m=>m.status==='NEEDS_REVISION').length, color: 'var(--color-red)', pct: Math.round((milestones.filter(m=>m.status==='NEEDS_REVISION').length / Math.max(milestones.length,1)) * 100) },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div className="flex items-center justify-between mb-4">
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>{s.label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: s.color }}>{s.count}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${s.pct}%`, background: s.color, boxShadow: `0 0 8px ${s.color}40` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'mentors':
        return <MentorManagementPanel mentors={mentors} fetchMentors={fetchMentors} addToast={addToast} handleReassign={handleReassign} />;
      case 'students':
        if (selectedStudent) {
          return (
            <div>
              <div className="section-header"><div className="section-title">Student Report</div></div>
              <div className="animate-slideup">
                <button className="btn btn-ghost btn-sm mb-16" onClick={() => setSelectedStudent(null)}>← Back to Student List</button>
                <div className="grid-cols-2 mb-20">
                  <div className="card">
                    <div className="flex items-center gap-12 mb-16">
                      <div className="user-avatar" style={{ width:'48px',height:'48px',fontSize:'1.2rem' }}>{(selectedStudent.name || 'ST').slice(0,2).toUpperCase()}</div>
                      <div>
                        <h3 style={{ margin: 0 }}>{selectedStudent.name}</h3>
                        <div className="text-muted text-sm">{selectedStudent.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                      <span className="text-muted text-sm">Class Details</span><strong>{selectedStudent.className || 'N/A'}</strong>
                    </div>
                    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                      <span className="text-muted text-sm">Overall PRS</span><strong style={{ color: 'var(--color-green)' }}>{selectedStudent.prs || 0}</strong>
                    </div>
                    <div className="flex items-center justify-between" style={{ padding: '10px 0' }}>
                      <span className="text-muted text-sm">Status</span><span className={`badge badge-${selectedStudent.isActive !== false ? 'success' : 'danger'}`}>{selectedStudent.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  
                  <div className="card">
                    <h4 className="mb-16">Approved Milestones</h4>
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>Title</th><th>Category</th><th>Points</th></tr></thead>
                        <tbody>
                          {milestones.filter(m => (m.studentId === selectedStudent._id || m.studentId === selectedStudent.id) && m.status === 'APPROVED').length === 0 ? (
                            <tr><td colSpan="3" className="text-center text-muted" style={{ padding: '24px' }}>No approved milestones yet.</td></tr>
                          ) : (
                            milestones.filter(m => (m.studentId === selectedStudent._id || m.studentId === selectedStudent.id) && m.status === 'APPROVED').map((m, i) => (
                              <tr key={i}>
                                <td><strong>{m.title}</strong></td>
                                <td><span className="badge badge-neutral">{m.category}</span></td>
                                <td><span className="badge badge-purple">+{m.points || 0}</span></td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div>
            <div className="section-header"><div className="section-title">Student Reports</div></div>
            
            <div className="flex gap-16 mb-16">
              <div className="form-group" style={{ minWidth: '200px' }}>
                <label className="form-label">Filter by Class</label>
                <select className="form-input" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                  {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: '200px' }}>
                <label className="form-label">Filter by Mentor</label>
                <select className="form-input" value={filterMentor} onChange={e => setFilterMentor(e.target.value)}>
                  {uniqueMentors.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Student</th><th>Roll No & Class</th><th>Mentor</th><th>PRS Score</th><th>Risk Level</th><th>Action</th></tr></thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No students match the filters.</td></tr>
                    ) : (
                      filteredStudents.map((s, idx) => {
                        const isAtRisk = (s.prs || 0) < 50;
                        const m = mentors.find(mnt => (mnt._id || mnt.id) === s.assignedMentorId);
                        const mentorName = m ? m.name : 'Unassigned';
                        
                        return (
                          <tr key={s._id || idx}>
                            <td><strong>{s.name}</strong><br/><span className="text-muted text-sm">{s.email}</span></td>
                            <td>
                              {s.rollNumber || 'N/A'}
                              <br/><span className="text-muted text-sm">{s.className || 'No Class'}</span>
                            </td>
                            <td>{mentorName}</td>
                            <td><span className={`badge badge-${isAtRisk ? 'danger' : 'success'}`}>{s.prs || 0}</span></td>
                            <td>
                              {isAtRisk ? <span className="badge badge-danger">High Risk</span> : <span className="badge badge-success">On Track</span>}
                            </td>
                            <td>
                              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(s)}>View Report</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'milestones':
        return (
          <div>
            <div className="section-header"><div className="section-title">All Department Milestones</div></div>
            {loading ? <div className="skeleton skeleton-card" /> : (
              <div className="card card-flush">
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Title</th><th>Category</th><th>Student</th><th>Points</th><th>Status</th></tr></thead>
                    <tbody>
                      {milestones.slice(0,10).map((m, i) => (
                        <tr key={i}>
                          <td><strong>{m.title}</strong></td>
                          <td><span className="badge badge-neutral">{m.category}</span></td>
                          <td className="text-muted text-sm">{m.studentName || '–'}</td>
                          <td>{m.points ? <span className="badge badge-purple">+{m.points}</span> : '–'}</td>
                          <td><span className={`badge badge-${m.status==='APPROVED'?'success':m.status==='PENDING'?'warning':'danger'}`}>{m.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div>
            <div className="page-header">
              <h2 className="page-title">HOD Department Portal</h2>
              <div className="page-subtitle">Department of {user.departmentName || 'Engineering'}</div>
            </div>
            <div className="grid-cols-3 mb-24">
              {[
                { label: 'Dept Avg PRS', value: avgPRS, sub: '/100', color: 'var(--role-primary)', icon: <TrendingUp size={20} />, change: `${deptStudents.length} Tracked`, up: true },
                { label: 'Placement Rate', value: placementRate, sub: '', color: 'var(--color-green)', icon: <CheckCircle size={20} />, change: `${placedCount} with Offers`, up: true },
                { label: 'At-Risk Students', value: String(atRiskList.length), sub: '', color: 'var(--color-red)', icon: <AlertTriangle size={20} />, change: 'PRS < 50', up: false },
              ].map((s, i) => (
                <div key={i} className="card stat-card" onClick={() => s.label === 'At-Risk Students' ? setActivePanel('students') : null} style={{ cursor: s.label === 'At-Risk Students' ? 'pointer' : 'default' }}>
                  <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{s.sub}</span></div>
                  <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.change}</div>
                </div>
              ))}
            </div>

            <div className="grid-cols-2 mb-24">
              <div className="card">
                <div className="section-title mb-16">Milestone Pipeline</div>
                {[
                  { label: 'Total Submitted', count: milestones.length, color: 'var(--text-dim)' },
                  { label: 'Approved', count: approved, color: 'var(--color-green)' },
                  { label: 'Pending Review', count: pending, color: 'var(--color-amber)' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.label}</span>
                    <strong style={{ color: s.color, fontSize: '1.1rem' }}>{s.count}</strong>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="section-title mb-16">Mentor Performance Alerts</div>
                {mentors.length === 0 ? (
                  <p className="text-muted text-sm">No mentors assigned to this department yet.</p>
                ) : (
                  mentors.slice(0, 3).map((m, i) => (
                    <div key={i} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.email}</div>
                      </div>
                      <span className={`badge badge-${m.isActive ? 'success' : 'danger'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar role="hod" activePanel={activePanel} setActivePanel={setActivePanel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={{ name: user.name || 'HOD', email: user.email || 'hod@example.com' }} />
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar title="HOD Department Portal" toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          openCommandPalette={() => setIsCommandOpen(true)} collapsed={sidebarCollapsed} />
        <main className="page-content animate-fadein">{renderPanel()}</main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
