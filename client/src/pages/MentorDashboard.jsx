import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';
import { CheckCircle, XCircle, Clock, Award, Building, MessageSquare, Users, TrendingUp, BarChart3, Star, Edit3, HelpCircle } from 'lucide-react';

function VerificationQueue({ addToast }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [reviewState, setReviewState] = useState({ points: '', comment: '', rating: 0 });
  const [processing, setProcessing] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState([]);

  useEffect(() => {
    apiFetch('/milestones')
      .then(r => setMilestones((r.milestones || []).filter(m => m.status === 'PENDING')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id, status) => {
    setProcessing(id);
    try {
      await apiFetch(`/milestones/${id}/verify`, { method: 'PUT', body: JSON.stringify({ status, reviewComment: reviewState.comment, pointsOverride: reviewState.points, rating: reviewState.rating }) });
      setMilestones(prev => prev.filter(m => (m._id || m.id) !== id));
      setSelectedMilestone(null);
      setReviewState({ points: '', comment: '', rating: 0 });
      addToast('success', status === 'APPROVED' ? 'Milestone Approved' : 'Revision Requested', '');
    } catch (err) { addToast('error', 'Action Failed', err.message); }
    finally { setProcessing(null); }
  };

  const handleBulkApprove = async () => {
    setProcessing('bulk');
    try {
      // In a real app we would send the array to /milestones/bulk-verify
      await apiFetch('/milestones/bulk-verify', { method: 'POST', body: JSON.stringify({ milestoneIds: selectedForBulk }) });
      setMilestones(prev => prev.filter(m => !selectedForBulk.includes(m._id || m.id)));
      setSelectedForBulk([]);
      setBulkMode(false);
      addToast('success', 'Bulk Action Successful', `${selectedForBulk.length} milestones approved.`);
    } catch (err) { addToast('error', 'Bulk Approve Failed', err.message); }
    finally { setProcessing(null); }
  };

  const toggleSelection = (id) => {
    setSelectedForBulk(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (loading) return <div className="skeleton skeleton-card" />;

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Pending Verification Queue</div>
        <div className="flex gap-8">
          {bulkMode ? (
            <>
              <button className="btn btn-success btn-sm" onClick={handleBulkApprove} disabled={selectedForBulk.length === 0 || processing === 'bulk'}>Approve Selected ({selectedForBulk.length})</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setBulkMode(false); setSelectedForBulk([]); }}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setBulkMode(true)}><CheckCircle size={14}/> Bulk Action</button>
          )}
        </div>
      </div>
      
      {/* Advanced Review Modal */}
      {selectedMilestone && (
        <div className="modal-overlay" onClick={() => setSelectedMilestone(null)}>
          <div className="modal-content animate-slideup" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '16px' }}>Review: {selectedMilestone.title}</h3>
            <p className="text-muted text-sm mb-16">{selectedMilestone.description}</p>
            
            <div className="form-group">
              <label className="form-label">Feedback (Optional)</label>
              <textarea value={reviewState.comment} onChange={e => setReviewState(prev => ({...prev, comment: e.target.value}))} placeholder="Explain why if rejecting..." className="form-input" />
            </div>
            
            <div className="grid-cols-2 mb-16">
              <div className="form-group mb-0">
                <label className="form-label">Points Override</label>
                <input type="number" value={reviewState.points} onChange={e => setReviewState(prev => ({...prev, points: e.target.value}))} placeholder="Default" className="form-input" />
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Quality Rating</label>
                <div className="flex gap-4 mt-8">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={20} 
                      color={star <= reviewState.rating ? "var(--color-amber)" : "var(--text-faint)"} 
                      fill={star <= reviewState.rating ? "var(--color-amber)" : "none"}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setReviewState(prev => ({...prev, rating: star}))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-8 mt-24">
              <button className="btn btn-success" disabled={processing === (selectedMilestone._id || selectedMilestone.id)} onClick={() => handleVerify(selectedMilestone._id || selectedMilestone.id, 'APPROVED')}><CheckCircle size={14}/> Approve Milestone</button>
              <button className="btn btn-danger" disabled={processing === (selectedMilestone._id || selectedMilestone.id)} onClick={() => handleVerify(selectedMilestone._id || selectedMilestone.id, 'NEEDS_REVISION')}><XCircle size={14}/> Request Revision</button>
              <button className="btn btn-ghost" onClick={() => setSelectedMilestone(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckCircle size={28} /></div>
          <h3>Queue is clear!</h3>
          <p>All student milestones have been reviewed. Great work!</p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {milestones.map((m, i) => (
            <div key={i} className="card card-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-8">
                  {bulkMode && <input type="checkbox" checked={selectedForBulk.includes(m._id || m.id)} onChange={() => toggleSelection(m._id || m.id)} />}
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '700' }}>{m.title}</h4>
                </div>
                <span className="badge badge-warning">PENDING</span>
              </div>
              {m.studentName && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>👤 {m.studentName}</div>}
              {m.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>{m.description.slice(0,80)}...</p>}
              
              {!bulkMode && (
                <div className="flex gap-8">
                  <button className="btn btn-primary btn-sm" onClick={() => setSelectedMilestone(m)}><Edit3 size={12}/> Advanced Review</button>
                  <button className="btn btn-success btn-sm" disabled={processing === (m._id || m.id)} onClick={() => handleVerify(m._id || m.id, 'APPROVED')}><CheckCircle size={12} /> Quick Approve</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InternshipReviewsPanel({ addToast }) {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/internships').then(r => setInternships(r.internships || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await apiFetch(`/internships/${id}/verify`, { method: 'PUT', body: JSON.stringify({ status }) });
      setInternships(prev => prev.map(n => (n._id || n.id) === id ? { ...n, status } : n));
      addToast('success', 'Internship ' + status, '');
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Internship Review Queue</div>
      </div>
      {loading ? <div className="skeleton skeleton-card" /> : internships.filter(n => n.status === 'PENDING').length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Building size={28} /></div>
          <h3>No pending internship reviews</h3>
        </div>
      ) : (
        <div className="grid-cols-2">
          {internships.filter(n => n.status === 'PENDING').map((n, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-8">
                <h4 style={{ fontWeight: '700' }}>{n.company}</h4>
                <span className="badge badge-warning">PENDING</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>{n.role}</div>
              {n.stipend && <div className="badge badge-teal" style={{ marginBottom: '12px' }}>₹{n.stipend}/mo</div>}
              <div className="flex gap-8">
                <button className="btn btn-success btn-sm" onClick={() => handleVerify(n._id || n.id, 'VERIFIED')}><CheckCircle size={13} /> Verify</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleVerify(n._id || n.id, 'REJECTED')}><XCircle size={13} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentsPanel({ addToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importLoading, setImportLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', email: '', role: 'student' });
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = () => {
    setLoading(true);
    apiFetch('/students')
      .then(r => setStudents(r.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
      fetchStudents();
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
      addToast('success', 'Student Created', `Successfully created ${manualForm.name}`);
      if (r.credentials && r.credentials.length > 0) {
        setGeneratedCredentials(r.credentials);
      }
      setShowManualForm(false);
      setManualForm({ name: '', email: '', role: 'student' });
      fetchStudents();
    } catch (err) {
      addToast('error', 'Creation Failed', err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student login?")) return;
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' });
      addToast('success', 'Deleted', 'Student login has been removed.');
      fetchStudents();
    } catch (err) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  if (selectedStudent) {
    return (
      <div>
        <div className="section-header"><div className="section-title">Student Drilldown</div></div>
        <div className="animate-slideup">
          <button className="btn btn-ghost btn-sm mb-16" onClick={() => setSelectedStudent(null)}>← Back to Mentees</button>
          <div className="grid-cols-2 mb-20">
            <div className="card">
              <div className="flex items-center gap-12 mb-16">
                <div className="user-avatar" style={{ width:'48px',height:'48px',fontSize:'1.2rem' }}>{selectedStudent.name.slice(0,2).toUpperCase()}</div>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedStudent.name}</h3>
                  <div className="text-muted text-sm">{selectedStudent.email}</div>
                </div>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span className="text-muted text-sm">Overall PRS</span><strong style={{ color: 'var(--color-green)' }}>{selectedStudent.placementReadinessScore || 0}</strong>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                <span className="text-muted text-sm">Resume Score</span><strong>{selectedStudent.resumeStrengthIndex || 0}</strong>
              </div>
              <div className="flex items-center justify-between" style={{ padding: '10px 0' }}>
                <span className="text-muted text-sm">Status</span><span className={`badge badge-${selectedStudent.isActive ? 'success' : 'danger'}`}>{selectedStudent.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div className="section-title">My Assigned Mentees</div>
      </div>

      {generatedCredentials && (
        <div className="card mb-20 animate-slideup" style={{ borderLeft: '4px solid var(--color-green)' }}>
          <h3 style={{ color: 'var(--color-green)', marginBottom: '8px' }}>Credentials Generated Successfully</h3>
          <p className="text-sm mb-16">Please securely distribute these credentials. They will only be shown once.</p>
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
          <h3 style={{ marginBottom: '16px' }}>Create Student Login</h3>
          <form onSubmit={handleManualCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Full Name</label><input value={manualForm.name} onChange={e => setManualForm(f=>({...f,name:e.target.value}))} required placeholder="Student Name" /></div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" value={manualForm.email} onChange={e => setManualForm(f=>({...f,email:e.target.value}))} required placeholder="student@univ.edu" /></div>
            </div>
            <div className="flex gap-8 mt-8">
              <button type="submit" className="btn btn-primary btn-sm" disabled={importLoading}>{importLoading ? 'Creating...' : 'Create Student'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowManualForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!generatedCredentials && !showManualForm && (
      <div className="card mb-20">
        <h3>Bulk Student Import</h3>
        <p className="text-muted text-sm mb-16">Upload a CSV or Excel file containing student details. Columns required: Name, Email, Role (must be student).</p>
        {!preview ? (
          <div className="flex gap-8">
            <label className={`btn btn-primary ${importLoading ? 'disabled' : ''}`} style={{ cursor: 'pointer' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {importLoading ? 'Processing...' : 'Upload & Preview File'}
              <input type="file" accept=".xlsx, .xls, .csv" style={{ display: 'none' }} onChange={handleFileUpload} disabled={importLoading} />
            </label>
            <button className="btn btn-ghost" onClick={() => setShowManualForm(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Manually
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

      <div className="card card-flush">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Student Name</th><th>Email</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}><div className="skeleton" style={{height:'20px', width:'100px', margin:'0 auto'}}/></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No students assigned yet.</td></tr>
              ) : students.map((s, i) => (
                <tr key={s._id || i}>
                  <td><div className="flex items-center gap-8"><div className="user-avatar" style={{ width:'28px',height:'28px',minWidth:'28px',fontSize:'0.68rem' }}>{s.name.slice(0,2).toUpperCase()}</div><strong>{s.name}</strong></div></td>
                  <td className="text-muted text-sm">{s.email}</td>
                  <td><span className={`badge badge-${s.isActive ? 'success' : 'danger'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelectedStudent(s)}>Drilldown</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-red)', marginLeft: '8px' }} onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AssessmentsPanel({ addToast }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Coding', deadline: '' });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAssessments = () => {
    setLoading(true);
    apiFetch('/assessments')
      .then(r => setAssessments(r.assessments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await apiFetch('/assessments', { method: 'POST', body: JSON.stringify(form) });
      addToast('success', 'Success', 'Assessment reminder created successfully');
      setShowForm(false);
      setForm({ title: '', category: 'Coding', deadline: '' });
      fetchAssessments();
    } catch (err) {
      addToast('error', 'Failed', err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Assessments Dashboard</div>
        {!showForm && <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Create Assessment Reminder</button>}
      </div>

      {showForm && (
        <div className="card mb-20 animate-slideup">
          <h3 className="mb-16">Create New Assessment Reminder</h3>
          <p className="text-muted text-sm mb-16">The assessment will be automatically deleted when the deadline is reached.</p>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Assessment Title</label>
              <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="e.g. Data Structures Mock Test" />
            </div>
            <div className="grid-cols-2 mb-24">
              <div className="form-group mb-0">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="Coding">Coding</option>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Core CS">Core CS</option>
                  <option value="Soft Skills">Soft Skills</option>
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Deadline</label>
                <input type="datetime-local" className="form-input" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} required />
              </div>
            </div>
            <div className="flex gap-8">
              <button type="submit" className="btn btn-primary" disabled={submitLoading}>{submitLoading ? 'Publishing...' : 'Publish Reminder'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="skeleton skeleton-card" style={{ height: '150px' }} />
      ) : assessments.length === 0 ? (
        <div className="card text-center" style={{ padding: '48px 24px' }}>
          <h3 className="mb-16">No Active Assessments</h3>
          <p className="text-muted">There are no assessment reminders right now.</p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {assessments.map((a, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-8">
                <h4 style={{ fontWeight: '700', fontSize: '1rem' }}>{a.title}</h4>
                <span className={`badge badge-${a.status === 'PUBLISHED' ? 'success' : 'warning'}`}>{a.status}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>{a.category}</div>
              <div className="flex items-center gap-12 mt-12 pt-12" style={{ borderTop: '1px solid var(--card-border)' }}>
                <div><span className="text-muted text-sm">Deadline:</span> <strong style={{ color: 'var(--color-red)' }}>{new Date(a.deadline).toLocaleString()}</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ParentQueriesPanel({ addToast }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchQueries = () => {
    setLoading(true);
    apiFetch('/mentor/parent-queries')
      .then(r => setQueries(r.queries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await apiFetch(`/mentor/parent-queries/${id}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ replyMessage: replyText })
      });
      addToast('success', 'Reply Sent', 'Your response has been transmitted to the parent/guardian.');
      setReplyingId(null);
      setReplyText('');
      fetchQueries();
    } catch (err) {
      addToast('error', 'Reply Failed', err.message || 'Could not send reply.');
    }
  };

  if (loading) return <div className="card" style={{ padding: '32px', textAlign: 'center' }}>Loading parent communications...</div>;

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Parent / Guardian Queries & Communications</div>
      </div>
      {queries.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3>No Parent Queries Received</h3>
          <p>When guardians of your assigned students reach out via their parent portal, their inquiries will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {queries.map((q) => (
            <div key={q.id || q._id} className="card" style={{ border: q.status === 'PENDING' ? '1px solid var(--color-amber)' : '1px solid var(--border-light)' }}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--role-primary)' }}>{q.subject}</h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    From Guardian: <strong>{q.parentName}</strong> ({q.parentEmail}) · Regarding Ward: <strong>{q.studentName || 'Student'}</strong>
                  </div>
                </div>
                <span className={`badge badge-${q.status === 'REPLIED' ? 'success' : 'warning'}`}>{q.status}</span>
              </div>
              
              <div style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '6px', marginBottom: '12px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {q.message}
              </div>

              {q.status === 'REPLIED' ? (
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--color-green)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-green)', marginBottom: '4px' }}>
                    Replied by {q.repliedBy || 'You'} on {new Date(q.repliedAt).toLocaleDateString()}:
                  </div>
                  <p style={{ fontSize: '0.88rem', margin: 0 }}>{q.replyMessage}</p>
                </div>
              ) : (
                <div>
                  {replyingId === (q.id || q._id) ? (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--role-primary)', borderRadius: '6px' }}>
                      <label className="form-label mb-8">Write Response to {q.parentName}:</label>
                      <textarea className="form-input mb-12" rows="3" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your detailed response..."></textarea>
                      <div className="flex gap-8">
                        <button className="btn btn-primary btn-sm" onClick={() => handleReply(q.id || q._id)}>Transmit Reply</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setReplyingId(null); setReplyText(''); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => { setReplyingId(q.id || q._id); setReplyText(''); }}>
                      <MessageSquare size={14} style={{ display: 'inline', marginRight: '6px' }} /> Reply to Guardian
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MentorDashboard() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [milestones, setMilestones] = useState([]);
  const [students, setStudents] = useState([]);
  const { addToast } = useContext(ToastContext);
  const user = JSON.parse(localStorage.getItem('talenttrack_user') || '{}');

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'mentor');
    Promise.all([
      apiFetch('/milestones').catch(() => ({ milestones: [] })),
      apiFetch('/students').catch(() => ({ students: [] }))
    ]).then(([ms, stu]) => {
      setMilestones(ms.milestones || []);
      setStudents(stu.students || []);
    });
  }, []);

  const pending   = milestones.filter(m => m.status === 'PENDING').length;
  const approved  = milestones.filter(m => m.status === 'APPROVED').length;

    const renderPanel = () => {
    switch (activePanel) {
      case 'queue':       return <VerificationQueue addToast={addToast} />;
      case 'internships': return <InternshipReviewsPanel addToast={addToast} />;
      case 'students':    return <StudentsPanel addToast={addToast} />;
      case 'assessments': return <AssessmentsPanel addToast={addToast} />;
      case 'messages':    return <ParentQueriesPanel addToast={addToast} />;
      default: return (
        <div>
          <div className="page-header">
            <h2 className="page-title">Faculty Mentor Portal</h2>
            <div className="page-subtitle">Review student milestones and guide their placement journey</div>
          </div>
          <div className="grid-cols-3 mb-24">
            {[
              { label: 'Pending Reviews', value: pending, color: 'var(--color-amber)', icon: <Clock size={20} /> },
              { label: 'Approved Today', value: approved, color: 'var(--color-green)', icon: <CheckCircle size={20} /> },
              { label: 'Students Assigned', value: students.length, color: 'var(--role-primary)', icon: <Users size={20} /> },
            ].map((s, i) => (
              <div key={i} className="card stat-card" onClick={() => s.label === 'Students Assigned' ? setActivePanel('students') : null} style={{ cursor: s.label === 'Students Assigned' ? 'pointer' : 'default' }}>
                <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value accent" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid-cols-2 mb-24">
            <div className="card">
              <div className="section-title mb-16"><Award size={16} style={{ display:'inline', marginRight:'6px' }}/> Point-Value Guidelines</div>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                <li style={{ marginBottom: '8px' }}><strong>Hackathons (National):</strong> 15-20 pts</li>
                <li style={{ marginBottom: '8px' }}><strong>Hackathons (Internal):</strong> 5-10 pts</li>
                <li style={{ marginBottom: '8px' }}><strong>NPTEL / Coursera:</strong> 10 pts per course</li>
                <li style={{ marginBottom: '8px' }}><strong>Paper Publication (IEEE):</strong> 25 pts</li>
                <li><strong>Club Lead / Organiser:</strong> 15 pts</li>
              </ul>
              <div className="mt-16" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <HelpCircle size={12} style={{ display:'inline', marginRight:'4px' }}/> 
                If proof quality is exceptionally high, use the Points Override feature during Advanced Review.
              </div>
            </div>
            <div className="card">
              <div className="section-title mb-16"><TrendingUp size={16} style={{ display:'inline', marginRight:'6px' }}/> Peer Workload Comparison</div>
              <div style={{ padding: '10px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--role-primary)' }}>{students.length > 0 ? (milestones.length / Math.max(1, students.length)).toFixed(1) : '0.0'} milestones / student</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Active verification engagement across assigned mentees</div>
              </div>
            </div>
          </div>

          <div className="section-header">
            <div className="section-title">Recent Milestone Submissions</div>
            <button className="btn btn-primary btn-sm" onClick={() => setActivePanel('queue')}>View Full Queue</button>
          </div>
          <div className="grid-cols-2">
            {milestones.slice(0, 4).map((m, i) => (
              <div key={i} className="card card-sm">
                <div className="flex items-center justify-between mb-8">
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '700' }}>{m.title}</h4>
                  <span className={`badge badge-${m.status === 'APPROVED' ? 'success' : m.status === 'PENDING' ? 'warning' : 'danger'}`}>{m.status}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.category} {m.studentName && `• ${m.studentName}`}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <Sidebar role="mentor" activePanel={activePanel} setActivePanel={setActivePanel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={{ name: user.name || 'Mentor', email: user.email || 'mentor@example.com' }} />
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar title="Faculty Mentor Portal" toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          openCommandPalette={() => setIsCommandOpen(true)} collapsed={sidebarCollapsed} />
        <main className="page-content animate-fadein">{renderPanel()}</main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
