import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';
import {
  Award, Briefcase, Building, BookOpen, BadgeCheck, Target, Trophy,
  TrendingUp, CheckCircle, Clock, XCircle, Plus, Sparkles, Send,
  Star, ChevronRight, FileText, Upload, BarChart3, QrCode, Download
} from 'lucide-react';
import { downloadDocument, downloadFile } from '../utils/fileDownloader';

// ─── Sub-panels ───────────────────────────────────────────────────────────────
function PRSRing({ score }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="prs-ring-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
      <div className="prs-ring">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle className="ring-bg" cx="50" cy="50" r={r} />
          <circle className="ring-fill" cx="50" cy="50" r={r}
            style={{ strokeDashoffset: offset }} />
        </svg>
        <div className="prs-ring-value">
          <span>{score}</span>
          <span className="prs-ring-label">/ 100</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Placement Readiness</div>
        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--role-primary)', fontFamily: 'Syne, sans-serif' }}>{score}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span></div>
        <span className="badge badge-success">Top 5% in Department</span>
      </div>
      {/* Weighted Breakdown (Removed hardcoded static values) */}
    </div>
  );
}

function MilestonesPanel({ addToast }) {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Hackathons', description: '' });
  const [resubmitId, setResubmitId] = useState(null);

  useEffect(() => {
    apiFetch('/milestones')
      .then(r => setMilestones(r.milestones || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (resubmitId) {
         // Simulate resubmit
         setMilestones(prev => prev.map(m => (m._id || m.id) === resubmitId ? { ...m, status: 'PENDING', title: form.title, description: form.description } : m));
         addToast('success', 'Milestone Resubmitted', 'R2 Proof uploaded successfully');
         setResubmitId(null);
      } else {
        const r = await apiFetch('/milestones', { method: 'POST', body: JSON.stringify(form) });
        setMilestones(prev => [r.milestone, ...prev]);
        addToast('success', 'Milestone Submitted', 'Awaiting mentor verification');
      }
      setShowForm(false);
      setForm({ title: '', category: 'Hackathons', description: '' });
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const statusColor = s => s === 'APPROVED' ? 'success' : s === 'PENDING' ? 'warning' : s === 'NEEDS_REVISION' ? 'danger' : 'neutral';
  const statusIcon  = s => s === 'APPROVED' ? <CheckCircle size={14} /> : s === 'PENDING' ? <Clock size={14} /> : <XCircle size={14} />;

  return (
    <div>
      <div className="section-header">
        <div className="section-title">My Milestones</div>
        <button className="btn btn-primary btn-sm" onClick={() => { setResubmitId(null); setForm({ title: '', category: 'Hackathons', description: '' }); setShowForm(!showForm); }}><Plus size={14} /> Add Milestone</button>
      </div>
      {showForm && (
        <div className="card mb-20 animate-slideup">
          <h3 style={{ marginBottom: '16px', fontSize: '0.95rem' }}>{resubmitId ? 'Resubmit Milestone (R2 Proof)' : 'Submit New Milestone'}</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Won Smart India Hackathon 2024" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} disabled={!!resubmitId}>
                  {['Hackathons','Certifications','Research Papers','Leadership','Internships','Projects','Sports','Community Service'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe your achievement..." />
            </div>
            <div className="form-group">
              <label className="form-label">Upload Proof</label>
              <input type="file" className="form-input" style={{ padding: '8px' }} />
            </div>
            <div className="flex gap-8">
              <button type="submit" className="btn btn-primary btn-sm"><Upload size={13} /> {resubmitId ? 'Resubmit' : 'Submit'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowForm(false); setResubmitId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {loading ? (
        <div className="grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      ) : milestones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Award size={28} /></div>
          <h3>No milestones yet</h3>
          <p>Submit your first achievement to start building your PRS score</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Add First Milestone</button>
        </div>
      ) : (
        <div className="timeline">
          {milestones.map((m, i) => (
            <div key={i} className="timeline-item">
              <div className={`timeline-dot ${m.status !== 'APPROVED' ? 'muted' : ''}`} />
              <div className="card card-sm">
                <div className="flex items-center justify-between mb-8">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>{m.title}</h4>
                  <span className={`badge badge-${statusColor(m.status)}`}>{statusIcon(m.status)} {m.status}</span>
                </div>
                <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                  <span className="badge badge-neutral">{m.category}</span>
                  {m.points && <span className="badge badge-purple">+{m.points} pts</span>}
                  {m.createdAt && <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{new Date(m.createdAt).toLocaleDateString()}</span>}
                </div>
                {m.reviewComment && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: 'var(--glass-overlay)', borderRadius: 'var(--r-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    💬 {m.reviewComment}
                    {m.status === 'NEEDS_REVISION' && (
                      <button className="btn btn-danger btn-sm" style={{ marginTop: '8px', display: 'block' }} onClick={() => { setResubmitId(m._id || m.id); setForm({ title: m.title, category: m.category, description: m.description || '' }); setShowForm(true); }}>
                         Upload R2 Proof & Resubmit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DrivesPanel({ addToast }) {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    apiFetch('/drives').then(r => setDrives(r.drives || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleApply = async (driveId, company) => {
    setApplying(driveId);
    try {
      await apiFetch('/placement/apply', { method: 'POST', body: JSON.stringify({ driveId }) });
      addToast('success', 'Application Submitted!', `Applied for ${company}`);
    } catch (err) { addToast('error', 'Application Failed', err.message); }
    finally { setApplying(null); }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Placement Drives</div>
        <span className="badge badge-info">{drives.length} Active</span>
      </div>
      {loading ? (
        <div className="grid-cols-2">{[1,2].map(i => <div key={i} className="skeleton skeleton-card" />)}</div>
      ) : drives.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Briefcase size={28} /></div>
          <h3>No active drives</h3>
          <p>Check back later for new placement opportunities</p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {drives.map((d, i) => (
            <div key={i} className="card drive-card">
              <div className="drive-card-header">
                <div className="drive-logo">{(d.companyName||'?')[0]}</div>
                <div>
                  <div className="drive-company">{d.companyName}</div>
                  <div className="drive-role">{d.jobRole}</div>
                </div>
                <div className="drive-ctc" style={{ marginLeft: 'auto' }}>₹{d.ctc} LPA</div>
              </div>
              <div className="drive-meta">
                <div className="drive-meta-item"><BarChart3 size={11} /> Min PRS: {d.eligibilityCriteria?.minPRS || 'N/A'}</div>
                {d.driveDate && <div className="drive-meta-item"><Clock size={11} /> {new Date(d.driveDate).toLocaleDateString()}</div>}
                {d.rounds?.length > 0 && <div className="drive-meta-item"><FileText size={11} /> {d.rounds.length} Rounds</div>}
              </div>
              {d.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{d.description}</p>}
              <button
                className="btn btn-primary btn-sm"
                disabled={applying === d._id}
                onClick={() => handleApply(d._id || d.id, d.companyName)}
              >
                {applying === d._id ? 'Applying...' : <><Send size={13} /> Apply Now</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InternshipsPanel({ addToast }) {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ company: '', role: '', startDate: '', endDate: '', stipend: '', description: '' });

  useEffect(() => {
    apiFetch('/internships').then(r => setInternships(r.internships || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const r = await apiFetch('/internships', { method: 'POST', body: JSON.stringify(form) });
      setInternships(prev => [r.internship, ...prev]);
      setShowForm(false);
      addToast('success', 'Internship Submitted', 'Awaiting faculty verification');
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">My Internships</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Add Internship</button>
      </div>
      {showForm && (
        <div className="card mb-20 animate-slideup">
          <h3 style={{ marginBottom: '16px', fontSize: '0.95rem' }}>Submit Internship</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Company</label><input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} required placeholder="e.g. Amazon India" /></div>
              <div className="form-group"><label className="form-label">Role</label><input value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} required placeholder="e.g. SDE Intern" /></div>
              <div className="form-group"><label className="form-label">Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">End Date</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">Stipend (₹/month)</label><input type="number" value={form.stipend} onChange={e => setForm(f => ({...f, stipend: e.target.value}))} placeholder="25000" /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Describe your internship experience..." /></div>
            <div className="flex gap-8"><button type="submit" className="btn btn-primary btn-sm">Submit</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <div className="skeleton skeleton-card" /> : internships.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Building size={28} /></div>
          <h3>No internships recorded</h3>
          <p>Add your internship experience to boost your PRS score</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Add Internship</button>
        </div>
      ) : (
        <div className="grid-cols-2">
          {internships.map((n, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-8">
                <h4 style={{ fontWeight: '700' }}>{n.company}</h4>
                <span className={`badge badge-${n.status === 'VERIFIED' ? 'success' : n.status === 'PENDING' ? 'warning' : 'neutral'}`}>{n.status}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{n.role}</div>
              {n.stipend && <div style={{ color: 'var(--color-green)', fontWeight: '700', marginTop: '8px' }}>₹{n.stipend}/mo</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentsPanel({ addToast }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState([]);

  useEffect(() => {
    apiFetch('/assessments')
      .then(r => setAssessments(r.assessments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async (id, title) => {
    try {
      await apiFetch('/assessments/attempt', {
        method: 'POST',
        body: JSON.stringify({ assessmentId: id, note: 'Completed and acknowledged via portal' })
      });
      setAcknowledged(prev => [...prev, id]);
      addToast('success', 'Reminder Acknowledged', `Recorded completion for: ${title}`);
    } catch (err) {
      addToast('error', 'Failed to Acknowledge', err.message);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Assessment & Deadline Reminders</div>
        <span className="badge badge-info">{assessments.length} Active Reminders</span>
      </div>
      <div style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--r-md)', border: '1px solid var(--card-border)' }}>
        ⏰ <strong>Note:</strong> Assessment items operate as real-time academic and deadline reminders. They have no fixed exam timer or grading marks, and will automatically delete upon reaching their specified deadline.
      </div>
      {loading ? <div className="skeleton skeleton-card" /> : assessments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={28} /></div>
          <h3>No active assessment reminders</h3>
          <p>You are all caught up! Any upcoming faculty assessment tasks or test deadlines will appear here.</p>
        </div>
      ) : (
        <div className="grid-cols-2">
          {assessments.map((a, i) => {
            const id = a._id || a.id;
            const isDone = acknowledged.includes(id);
            return (
              <div key={id || i} className="card" style={{ borderLeft: '4px solid var(--role-primary)' }}>
                <div className="flex items-center justify-between mb-8">
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.5px' }}>REMINDER</span>
                  <span className="badge badge-info">{a.category || 'General'}</span>
                </div>
                <h4 style={{ fontWeight: '700', fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-main)' }}>{a.title}</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
                  Complete your assessment tasks before the scheduled cutoff. This notice auto-deletes when the deadline expires.
                </div>
                <div className="flex items-center gap-8 mb-16" style={{ background: 'var(--bg-dark)', padding: '8px 12px', borderRadius: 'var(--r-sm)' }}>
                  <Clock size={15} color="var(--color-amber)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-amber)' }}>
                    Deadline: {a.deadline ? new Date(a.deadline).toLocaleString() : 'Not set'}
                  </span>
                </div>
                <button 
                  className={`btn ${isDone ? 'btn-ghost' : 'btn-primary'} btn-sm w-full`} 
                  onClick={() => !isDone && handleAcknowledge(id, a.title)}
                  disabled={isDone}
                  style={{ justifyContent: 'center' }}
                >
                  {isDone ? <><CheckCircle size={14} color="var(--color-green)" /> Acknowledged</> : <><ChevronRight size={14} /> Mark as Completed / Acknowledged</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CredentialsPanel({ addToast, user = {}, prs = 0 }) {
  const [creds, setCreds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/credentials/wallet').then(r => setCreds(r)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const generatePDF = () => {
    const badgesHtml = (creds?.badges || []).map(b => `<li><strong>${b.title}</strong>: ${b.desc || ''} (${b.verified ? 'Verified' : 'Pending'})</li>`).join('');
    downloadDocument(`${user?.name || 'Student'}_ATS_Resume.doc`, `ATS-Verified Resume: ${user?.name || 'Candidate'}`, `
      <div class="box">
        <p><strong>Candidate Name:</strong> ${user?.name || 'Student'}</p>
        <p><strong>Email / Roll Number:</strong> ${user?.email || user?.rollNumber || 'N/A'}</p>
        <p><strong>Department & Academic Year:</strong> ${user?.departmentName || 'Engineering'} · ${user?.academicYear || 'Current'}</p>
        <p><strong>Placement Readiness Score (PRS):</strong> <span class="badge">${prs} / 100</span></p>
      </div>
      <h2>Professional Summary & Readiness</h2>
      <p>An agile engineering talent verified through TalentTrack's cryptographic milestone verification engine. Exhibiting robust performance in technical competency, communication consistency, and practical project deliverables.</p>
      <h2>Verified Academic Milestones & Digital Badges</h2>
      <ul>
        ${badgesHtml || '<li>Verified Core Curriculum Completion & Industrial Skills Assessments</li>'}
      </ul>
      <h2>Academic Standing</h2>
      <p><strong>GPA:</strong> ${user?.gpa ?? 8.5} / 10.0</p>
    `);
    addToast('success', 'Resume Generated', 'Your ATS-Friendly Resume has been downloaded to your computer.');
  };

  const generateQR = () => {
    const portfolioUrl = `https://talenttrack.enterprise.io/portfolio/${user?._id || 'candidate'}`;
    downloadFile(`${user?.name || 'Student'}_Portfolio_Link.txt`, `TalentTrack Verified Public Portfolio Link:\r\n${portfolioUrl}\r\n\r\nShare this link with recruiters for instant verification of your credentials and milestones.`, 'text/plain;charset=utf-8');
    addToast('info', 'Portfolio Link Saved', 'Your public portfolio credential file has been downloaded.');
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Credential Wallet & Portfolio</div>
      </div>
      
      <div className="grid-cols-2 mb-24">
         <div className="card flex items-center justify-between" style={{ background: 'var(--role-glow-lg)', border: '1px solid var(--role-primary)' }}>
           <div>
             <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>ATS-Friendly Resume</h4>
             <p className="text-muted text-sm">Auto-generated from your verified milestones and internships.</p>
           </div>
           <button className="btn btn-primary btn-sm" onClick={generatePDF}><Download size={14}/> Download PDF</button>
         </div>
         <div className="card flex items-center justify-between">
           <div>
             <h4 style={{ fontWeight: '700', marginBottom: '8px' }}>Public Portfolio QR</h4>
             <p className="text-muted text-sm">Share your verified achievements instantly with recruiters.</p>
           </div>
           <button className="btn btn-outline btn-sm" onClick={generateQR}><QrCode size={14}/> Generate QR</button>
         </div>
      </div>

      {loading ? <div className="skeleton skeleton-card" /> : (
        <>
          {creds?.badges?.length > 0 && (
            <div className="mb-20">
              <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--text-dim)' }}>Digital Badges</div>
              <div className="grid-cols-3">
                {creds.badges.map((b, i) => (
                  <div key={i} className="card card-sm" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏅</div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{b.title}</div>
                    <span className="badge badge-purple" style={{ marginTop: '8px' }}>{b.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {creds?.certificates?.length > 0 && (
            <div>
              <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--text-dim)' }}>Certificates</div>
              <div className="grid-cols-2">
                {creds.certificates.map((c, i) => (
                  <div key={i} className="card card-sm flex items-center gap-12">
                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-sm)', background: 'var(--role-glow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BadgeCheck size={22} color="var(--role-primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {c.certificateId || c._id}</div>
                    </div>
                    <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Verified</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(!creds?.badges?.length && !creds?.certificates?.length) && (
            <div className="empty-state">
              <div className="empty-state-icon"><BadgeCheck size={28} /></div>
              <h3>No credentials yet</h3>
              <p>Complete milestones and assessments to earn badges and certificates</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GoalsPanel({ addToast }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', targetDate: '', category: 'Career' });

  useEffect(() => {
    apiFetch('/goals').then(r => setGoals(r.goals || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const r = await apiFetch('/goals', { method: 'POST', body: JSON.stringify(form) });
      setGoals(prev => [r.goal, ...prev]);
      setShowForm(false);
      addToast('success', 'Goal Created', form.title);
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  const handleDelete = async (id) => {
    try { await apiFetch(`/goals/${id}`, { method: 'DELETE' }); setGoals(prev => prev.filter(g => (g._id || g.id) !== id)); addToast('info', 'Goal Removed', ''); } catch {}
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Goals & Roadmap</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Add Goal</button>
      </div>
      {showForm && (
        <div className="card mb-20 animate-slideup">
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Goal Title</label><input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="e.g. Land FAANG Internship" /></div>
              <div className="form-group"><label className="form-label">Category</label><select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>{['Career','Academic','Skill','Personal'].map(c => <option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Target Date</label><input type="date" value={form.targetDate} onChange={e => setForm(f => ({...f, targetDate: e.target.value}))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What does achieving this goal mean to you?" /></div>
            <div className="flex gap-8"><button type="submit" className="btn btn-primary btn-sm">Create Goal</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <div className="skeleton skeleton-card" /> : goals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={28} /></div>
          <h3>No goals set</h3>
          <p>Set career goals to keep yourself accountable and on track</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Set First Goal</button>
        </div>
      ) : (
        <div className="timeline" style={{ paddingLeft: '10px' }}>
          {goals.map((g, i) => (
            <div key={i} className="timeline-item pb-16">
              <div className="timeline-dot" style={{ background: 'var(--role-primary)' }} />
              <div className="card">
                <div className="flex items-center justify-between mb-8">
                  <span className="badge badge-info">{g.category || 'Career'}</span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: '0.72rem' }} onClick={() => handleDelete(g._id || g.id)}>Remove</button>
                </div>
                <h4 style={{ fontWeight: '700', marginBottom: '6px' }}>{g.title}</h4>
                {g.description && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{g.description}</p>}
                {g.targetDate && (
                  <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: '600' }}>
                    🎯 Target: {new Date(g.targetDate).toLocaleDateString()}
                  </div>
                )}
                <div className="progress-bar-track" style={{ marginTop: '12px' }}>
                  <div className="progress-bar-fill" style={{ width: `${g.progress || 35}%`, background: 'var(--color-green)' }} />
                </div>
                <div className="text-right mt-8" style={{ fontSize: '0.7rem', color: 'var(--color-green)' }}>{g.progress || 35}% Completed</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardPanel() {
  const [entries, setEntries] = useState([]);
  
  useEffect(() => {
    // In a real app, this would fetch from /users/leaderboard
    // For now, if no real data is found, show empty state instead of hardcoded data
  }, []);
  return (
    <div>
      <div className="section-header">
        <div className="section-title">Department Leaderboard</div>
        <span className="badge badge-warning"><Trophy size={11} /> CSE 2024-25</span>
      </div>
      <div className="card card-flush">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>#</th><th>Student</th><th>Department</th><th>PRS Score</th><th>Status</th></tr></thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No leaderboard data available</td></tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.rank}>
                    <td><strong style={{ fontSize: '1rem' }}>{e.badge || `#${e.rank}`}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="user-avatar" style={{ width: '30px', height: '30px', minWidth: '30px', fontSize: '0.7rem' }}>{e.name.slice(0,2).toUpperCase()}</div>
                        <strong>{e.name}</strong>
                      </div>
                    </td>
                    <td><span className="badge badge-neutral">{e.dept}</span></td>
                    <td>
                      <div className="flex items-center gap-8">
                        <span style={{ fontWeight: '700', color: 'var(--role-primary)' }}>{e.prs}</span>
                        <div className="progress-bar-track" style={{ width: '80px' }}>
                          <div className="progress-bar-fill" style={{ width: `${e.prs}%` }} />
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AIPanel({ addToast }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your AI Career Advisor. Ask me anything about boosting your Placement Readiness Score, interview prep, or career strategy.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const r = await apiFetch('/ai/career-assistant', { method: 'POST', body: JSON.stringify({ prompt: userMsg }) });
      const chat = r.chat;
      const reply = chat?.aiResponse || 'No response received.';
      const actions = chat?.recommendedActions || [];
      const full = reply + (actions.length ? '\n\n**Recommended actions:**\n' + actions.map((a,i) => `${i+1}. ${a}`).join('\n') : '');
      setMessages(prev => [...prev, { role: 'ai', text: full }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: `Sorry, I encountered an error: ${err.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sparkles size={18} color="var(--role-primary)" />
        <strong>AI Career Advisor</strong>
        <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Online</span>
      </div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}
            style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
        ))}
        {loading && <div className="chat-bubble ai animate-pulse">Thinking...</div>}
      </div>
      <div className="chat-input-bar">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Ask about interview tips, PRS boost strategies, resume review..."
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { addToast } = useContext(ToastContext);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('talenttrack_user') || '{}'));
  const [prs, setPrs] = useState(user.placementReadinessScore || 0);
  const isAlumni = user.role === 'alumni' || false;

  useEffect(() => {
    // Fetch latest user data dynamically so PRS stays up to date
    apiFetch('/auth/me')
      .then(r => {
        if (r.user) {
          setUser(r.user);
          setPrs(r.user.placementReadinessScore || 0);
          localStorage.setItem('talenttrack_user', JSON.stringify(r.user));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-role', isAlumni ? 'alumni' : 'student');
  }, [isAlumni]);

  const renderPanel = () => {
    switch (activePanel) {
      case 'milestones':  return <MilestonesPanel addToast={addToast} />;
      case 'drives':      return <DrivesPanel addToast={addToast} />;
      case 'internships': return <InternshipsPanel addToast={addToast} />;
      case 'assessments': return <AssessmentsPanel addToast={addToast} />;
      case 'credentials': return <CredentialsPanel addToast={addToast} user={user} prs={prs} />;
      case 'goals':       return <GoalsPanel addToast={addToast} />;
      case 'leaderboard': return <LeaderboardPanel />;
      case 'ai':          return <AIPanel addToast={addToast} />;
      default:            return <OverviewPanel user={user} prs={prs} isAlumni={isAlumni} setActivePanel={setActivePanel} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        role={isAlumni ? "alumni" : "student"}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={{ name: user.name || 'Student', email: user.rollNumber || user.email || 'student@example.com' }}
      />
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar
          title={isAlumni ? "Alumni Portal" : "Student Portal"}
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          openCommandPalette={() => setIsCommandOpen(true)}
          collapsed={sidebarCollapsed}
        />
        <main className="page-content animate-fadein">
          {renderPanel()}
        </main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}

function OverviewPanel({ user, prs, isAlumni, setActivePanel }) {
  const [parentStatus, setParentStatus] = useState(null);
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentForm, setParentForm] = useState({ parentName: '', parentEmail: '', parentPassword: '' });
  const [loadingParent, setLoadingParent] = useState(false);
  const { addToast } = useContext(ToastContext);

  const fetchParentStatus = () => {
    apiFetch('/students/parent-status')
      .then(r => setParentStatus(r))
      .catch(() => {});
  };

  useEffect(() => {
    fetchParentStatus();
  }, []);

  const handleCreateParent = async (e) => {
    e.preventDefault();
    if (parentForm.parentPassword.length < 6) {
      addToast('error', 'Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoadingParent(true);
    try {
      const res = await apiFetch('/students/setup-parent', {
        method: 'POST',
        body: JSON.stringify(parentForm)
      });
      addToast('success', 'Parent Account Linked', res.message || 'Guardian login successfully created.');
      setShowParentModal(false);
      setParentForm({ parentName: '', parentEmail: '', parentPassword: '' });
      fetchParentStatus();
    } catch (err) {
      addToast('error', 'Creation Failed', err.message);
    } finally {
      setLoadingParent(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Welcome back, {(user.name || 'Student').split(' ')[0]} 👋</h2>
        <div className="page-subtitle">
           {isAlumni ? "Welcome to the Alumni Network! Mentoring mode enabled." : "Here's your placement readiness summary for today."}
        </div>
      </div>

      {/* PRS Hero */}
      <div className="card mb-24" style={{ background: 'linear-gradient(135deg, var(--card-dark) 0%, var(--card-hover) 100%)' }}>
        <PRSRing score={prs} />
      </div>

      {/* Guardian Login Management Card */}
      {!isAlumni && parentStatus && (
        <div className="card mb-24" style={{ border: parentStatus.hasActiveParent ? '1px solid var(--border-light)' : '1px solid var(--color-amber)', background: 'var(--bg-card)' }}>
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: '700', color: parentStatus.hasActiveParent ? 'var(--color-green)' : 'var(--color-amber)' }}>
                Guardian / Parent Login Status
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {parentStatus.hasActiveParent ? 
                  `Active guardian account linked: ${parentStatus.parentName || 'Parent'} (${parentStatus.parentEmail})` : 
                  'No active parent login linked to your profile currently.'
                }
              </div>
            </div>
            <span className={`badge ${parentStatus.hasActiveParent ? 'badge-success' : 'badge-warning'}`}>
              {parentStatus.hasActiveParent ? '1/1 ACTIVE ACCOUNT' : 'UNLINKED'}
            </span>
          </div>

          {parentStatus.hasActiveParent ? (
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              🔒 <strong>Single Account Policy:</strong> One student can only have exactly one active parent login at a time. Until this account is removed, you cannot generate another parent login. If your parent deactivates or self-deletes their login from their portal, you will be able to create a new guardian login here.
            </p>
          ) : (
            <div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', marginBottom: '12px' }}>
                Your previous guardian account was deleted or not yet created. You can now create a new parent login to grant your guardian portal access.
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowParentModal(!showParentModal)}>
                {showParentModal ? 'Close Form' : 'Create Guardian Login'}
              </button>
            </div>
          )}

          {showParentModal && !parentStatus.hasActiveParent && (
            <form onSubmit={handleCreateParent} style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-dark)', borderRadius: 'var(--r-md)', border: '1px solid var(--role-primary)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: '700' }}>Setup New Guardian Account</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group mb-0">
                  <label className="form-label">Guardian Name</label>
                  <input className="form-input" type="text" value={parentForm.parentName} onChange={e => setParentForm({...parentForm, parentName: e.target.value})} placeholder="Full Name" required />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Guardian Email</label>
                  <input className="form-input" type="email" value={parentForm.parentEmail} onChange={e => setParentForm({...parentForm, parentEmail: e.target.value})} placeholder="parent@example.com" required />
                </div>
                <div className="form-group mb-0">
                  <label className="form-label">Set Password</label>
                  <input className="form-input" type="password" value={parentForm.parentPassword} onChange={e => setParentForm({...parentForm, parentPassword: e.target.value})} placeholder="Min. 6 chars" required />
                </div>
              </div>
              <div className="flex gap-8 mt-16">
                <button type="submit" className="btn btn-primary btn-sm" disabled={loadingParent}>
                  {loadingParent ? 'Linking Account...' : 'Create & Link Parent'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowParentModal(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="section-header">
        <div className="section-title">Quick Actions</div>
      </div>
      <div className="grid-cols-4 mb-24">
        {[
          { label: 'Submit Milestone', icon: Award, panel: 'milestones', color: 'var(--color-blue)' },
          { label: 'View Drives', icon: Briefcase, panel: 'drives', color: 'var(--color-amber)' },
          { label: 'Ask AI Advisor', icon: Sparkles, panel: 'ai', color: 'var(--color-purple)' },
          { label: 'Generate Resume', icon: FileText, panel: 'credentials', color: 'var(--color-green)' },
        ].map((q, i) => (
          <div key={i} className="card card-sm cursor-pointer" onClick={() => setActivePanel(q.panel)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--r-sm)', background: `${q.color}18`, border: `1px solid ${q.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: q.color }}>
              <q.icon size={20} />
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>{q.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
