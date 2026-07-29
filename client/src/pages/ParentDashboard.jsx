import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';
import { Award, Briefcase, CheckCircle, Clock, TrendingUp, Star, Download, MessageCircle, AlertCircle, MessageSquare, Settings, Trash2 } from 'lucide-react';
import { downloadDocument } from '../utils/fileDownloader';

export default function ParentDashboard() {
  const [activePanel, setActivePanel]     = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [overview, setOverview]           = useState(null);
  const [children, setChildren]           = useState([]);
  const [activeChild, setActiveChild]     = useState(null);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [loading, setLoading]             = useState(true);
  
  const { addToast }                      = useContext(ToastContext);
  const user = JSON.parse(localStorage.getItem('talenttrack_user') || '{}');

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'parent');
    setLoading(true);
    const endpoint = selectedChildId ? `/parent/placement-tracking?studentId=${selectedChildId}` : '/parent/placement-tracking';
    apiFetch(endpoint)
      .then(r => {
        if (r && r.success) {
          setChildren(r.children || []);
          setActiveChild(r.activeChild || null);
          setOverview(r.placementOverview || {});
          if (!selectedChildId && r.activeChild) {
            setSelectedChildId(r.activeChild.id);
          }
        } else {
          setOverview({ totalApplications: 0, shortlistedCount: 0, offersCount: 0, interviewsCount: 0, applications: [], offers: [], interviews: [], milestones: [] });
        }
      })
      .catch(err => {
        addToast('error', 'Error Loading Portal', err.message || 'Could not fetch ward placement details');
        setOverview({ totalApplications: 0, shortlistedCount: 0, offersCount: 0, interviewsCount: 0, applications: [], offers: [], interviews: [], milestones: [] });
      })
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  const studentName = activeChild?.name || 'No Linked Ward Found';
  const prs         = activeChild?.prs || 0;
  const dept        = activeChild?.dept || 'Department Not Specified';
  const rollNumber  = activeChild?.rollNumber || 'N/A';

  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ - (prs / 100) * circ;

  const [queryForm, setQueryForm] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [subjectText, setSubjectText] = useState('');
  const [queries, setQueries] = useState([]);

  const fetchQueries = () => {
    apiFetch('/parent/contact-mentor')
      .then(r => setQueries(r.queries || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchQueries();
  }, []);
  
  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    try {
      const targetStudentId = activeChild?.id || selectedChildId;
      await apiFetch('/parent/contact-mentor', {
        method: 'POST',
        body: JSON.stringify({
          studentId: targetStudentId,
          subject: subjectText || 'Ward Placement & Academic Inquiry',
          message: queryText
        })
      });
      addToast('success', 'Message Delivered', `Your message regarding ${studentName} has been delivered to the faculty mentor.`);
      setQueryForm(false);
      setQueryText('');
      setSubjectText('');
      fetchQueries();
    } catch (err) {
      addToast('error', 'Message Failed', err.message || 'Could not deliver message to mentor.');
    }
  };

  const handleSelfDelete = async () => {
    if (!window.confirm("ARE YOU SURE? Deleting your guardian account will remove your access to TalentTrack and unlink this account from your student's profile. Your child will be able to set up a new guardian login after this deletion.")) {
      return;
    }
    try {
      await apiFetch('/parent/self-delete', { method: 'DELETE' });
      addToast('success', 'Account Deleted', 'Your guardian account has been successfully deleted and unlinked.');
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      addToast('error', 'Deletion Failed', err.message || 'Failed to delete parent account.');
    }
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'progress': return (
        <div>
          <div className="section-header">
            <div className="section-title">Placement Progress for {studentName}</div>
            <button className="btn btn-outline btn-sm" onClick={() => {
              downloadDocument(`${studentName.replace(/\s+/g, '_')}_Progress_Report.doc`, `Official Term Progress Report: ${studentName}`, `
                <div class="box">
                  <p><strong>Student Name:</strong> ${studentName}</p>
                  <p><strong>Department & Roll No:</strong> ${dept} (${rollNumber})</p>
                  <p><strong>Current Placement Readiness Score (PRS):</strong> <span class="badge">${prs} / 100</span></p>
                  <p><strong>Report Timestamp:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <h2>Placement & Application Summary</h2>
                <table>
                  <thead><tr><th>Metric</th><th>Count</th><th>Status / Note</th></tr></thead>
                  <tbody>
                    <tr><td>Applications Submitted</td><td>${overview?.totalApplications ?? 0}</td><td>Verified in System</td></tr>
                    <tr><td>Offers Received</td><td>${overview?.offersCount ?? 0}</td><td>Official Verification</td></tr>
                    <tr><td>Interviews Scheduled</td><td>${overview?.interviewsCount ?? 0}</td><td>Active / Completed</td></tr>
                    <tr><td>Verified Milestones</td><td>${overview?.milestones?.length ?? 0}</td><td>Faculty Confirmed</td></tr>
                  </tbody>
                </table>
                <p>This report confirms institutional placement records and verified milestones evaluated by the talent track faculty mentor team.</p>
              `);
              addToast('success', 'Report Downloaded', 'Term progress report saved to your device.');
            }}><Download size={14}/> Download Report PDF / DOC</button>
          </div>
          <div className="grid-cols-2 mb-20">
            {[
              { label: 'Applications Submitted', value: overview?.totalApplications ?? 0, color: 'var(--role-primary)' },
              { label: 'Offers Received', value: overview?.offersCount ?? 0, color: 'var(--color-green)' },
              { label: 'Interviews Scheduled', value: overview?.interviewsCount ?? 0, color: 'var(--color-amber)' },
              { label: 'Current PRS Score', value: prs, color: 'var(--color-teal)' },
            ].map((s, i) => (
              <div key={i} className="card stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Dynamic Placement Journey Timeline */}
          <div className="section-header"><div className="section-title">Placement Journey Events</div></div>
          <div className="card">
            {(!overview?.applications?.length && !overview?.offers?.length && !overview?.interviews?.length) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No placement applications, interview invitations, or offers recorded for this student yet.</p>
              </div>
            ) : (
              <div className="timeline" style={{ paddingLeft: '10px' }}>
                {overview?.offers?.map((offer, idx) => (
                  <div key={`offer-${idx}`} className="timeline-item pb-16">
                    <div className="timeline-dot" style={{ background: 'var(--color-green)' }} />
                    <div style={{ paddingBottom: '4px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--color-green)' }}>
                        Offer Received — {offer.companyName || 'Partner Enterprise'} ({offer.packageLPA ? `₹${offer.packageLPA} LPA` : 'Offer Confirmed'})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>Role: {offer.role || offer.title || 'Selected Candidate'} • Status: {offer.status || 'OFFERED'}</div>
                    </div>
                  </div>
                ))}
                {overview?.interviews?.map((int, idx) => (
                  <div key={`int-${idx}`} className="timeline-item pb-16">
                    <div className="timeline-dot" style={{ background: 'var(--color-amber)' }} />
                    <div style={{ paddingBottom: '4px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                        Interview Scheduled — {int.companyName || int.title || 'Technical Round'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>Date: {int.scheduledAt || int.date || 'TBA'} • Mode: {int.mode || int.type || 'Virtual'}</div>
                    </div>
                  </div>
                ))}
                {overview?.applications?.map((app, idx) => (
                  <div key={`app-${idx}`} className="timeline-item pb-16">
                    <div className="timeline-dot" style={{ background: 'var(--role-primary)' }} />
                    <div style={{ paddingBottom: '4px' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.88rem' }}>
                        Applied to Drive — {app.companyName || app.driveTitle || 'Recruitment Drive'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '2px' }}>Status: {app.status || 'UNDER_REVIEW'} • Applied: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
      case 'milestones': 
        const milestones = overview?.milestones || [];
        return (
        <div>
          <div className="section-header"><div className="section-title">Verified Achievement Timeline</div></div>
          <div className="card mb-24">
            <div className="empty-state" style={{ padding: '32px' }}>
              <div className="empty-state-icon"><Award size={28} /></div>
              <h3>{milestones.length} Verified Achievement{milestones.length !== 1 ? 's' : ''}</h3>
              <p>Your ward has earned academic milestones and readiness points evaluated by faculty</p>
            </div>
          </div>
          
          <div className="section-header"><div className="section-title">Milestone Record</div></div>
          {milestones.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No milestone submissions recorded yet for this academic term.
            </div>
          ) : (
            <div className="timeline" style={{ paddingLeft: '10px' }}>
              {milestones.map((m, idx) => (
                <div key={idx} className="timeline-item pb-16">
                  <div className="timeline-dot" style={{ background: m.status === 'VERIFIED' ? 'var(--color-green)' : 'var(--color-amber)' }} />
                  <div className="card card-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>{m.title}</h4>
                      <span className={`badge ${m.status === 'VERIFIED' ? 'badge-success' : 'badge-warning'}`}>{m.status}</span>
                    </div>
                    <div className="flex items-center justify-between" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Category: {m.category}</span>
                      <span>+{m.prsPoints || 0} PRS Points</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
      case 'messages': return (
        <div>
          <div className="section-header">
            <div className="section-title">Faculty Mentor Communications</div>
            <button className="btn btn-primary btn-sm" onClick={() => setQueryForm(!queryForm)}>
              <MessageCircle size={14}/> {queryForm ? 'Close Form' : 'New Inquiry to Mentor'}
            </button>
          </div>
          {queryForm && (
            <div className="card mb-24 animate-slideup" style={{ border: '1px solid var(--role-primary)' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '0.95rem' }}>Send Message to {studentName}'s Faculty Mentor</h3>
              <form onSubmit={handleSendQuery}>
                <div className="form-group">
                  <label className="form-label">Subject / Topic</label>
                  <input type="text" className="form-input" value={subjectText} onChange={e => setSubjectText(e.target.value)} placeholder="e.g. Attendance & Placement Readiness Inquiry" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Message Content</label>
                  <textarea className="form-input" rows="4" value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Type your detailed message to the faculty mentor..." required></textarea>
                </div>
                <div className="flex gap-8">
                  <button type="submit" className="btn btn-primary btn-sm">Send to Mentor</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQueryForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
          <div className="card">
            <h4 style={{ marginBottom: '16px', fontWeight: '700' }}>Inquiry & Reply History</h4>
            {queries.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No messages or queries submitted yet. Use the button above to contact your ward's mentor.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {queries.map((q, idx) => (
                  <div key={idx} style={{ padding: '16px', background: 'var(--bg-dark)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>{q.subject}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Regarding: {q.studentName} · {new Date(q.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`badge badge-${q.status === 'REPLIED' ? 'success' : 'warning'}`}>{q.status}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', margin: '8px 0', color: 'var(--text-main)' }}>{q.message}</p>
                    {q.status === 'REPLIED' && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderLeft: '4px solid var(--color-green)', borderRadius: '4px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-green)', marginBottom: '4px' }}>Reply from {q.repliedBy || 'Faculty Mentor'} ({new Date(q.repliedAt).toLocaleDateString()}):</div>
                        <p style={{ fontSize: '0.85rem', margin: 0 }}>{q.replyMessage}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
      case 'settings': return (
        <div>
          <div className="section-header"><div className="section-title">Guardian Account Settings</div></div>
          <div className="card mb-24">
            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Profile Information</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Logged in as Guardian: <strong>{user.name || 'Ward Parent'}</strong> ({user.email || 'N/A'})
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Linked Ward(s): <strong>{children.map(c => c.name).join(', ') || studentName}</strong>
            </div>
          </div>

          <div className="card" style={{ border: '1px solid var(--color-danger)', background: 'rgba(239, 68, 68, 0.04)' }}>
            <h3 style={{ color: 'var(--color-danger)', fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} /> Deactivate & Delete Guardian Login
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '16px', lineHeight: '1.5' }}>
              Permanently delete this parent/guardian login from TalentTrack. Deleting your account will unlink your credentials from your child's student profile. 
              <br/><br/>
              <strong>Important Note:</strong> Because a student account can only have exactly one active guardian login at a time, deleting your account will release the restriction and allow your student ward to generate a new parent login in the future if required.
            </p>
            <button className="btn btn-danger" onClick={handleSelfDelete}>
              <Trash2 size={16} style={{ display: 'inline', marginRight: '6px' }} /> Delete My Parent Account
            </button>
          </div>
        </div>
      );
      default: 
        const bestOffer = overview?.offers && overview?.offers.length > 0 ? overview.offers[0] : null;
        return (
        <div>
          <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 className="page-title">Parent Portal</h2>
              <div className="page-subtitle">Track your child's placement journey and academic progress in real time</div>
            </div>
            
            {/* Multi-child Selector */}
            {children && children.length > 0 && (
              <div className="form-group mb-0" style={{ minWidth: '220px' }}>
                 <select className="form-input" value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)} style={{ padding: '8px 12px', background: 'var(--bg-dark)' }}>
                   {children.map((c, i) => (
                     <option key={c.id || i} value={c.id}>{c.name} ({c.dept})</option>
                   ))}
                 </select>
              </div>
            )}
          </div>

          {/* Student hero card */}
          <div className="card mb-24" style={{ background: 'linear-gradient(135deg, var(--card-dark) 0%, var(--card-hover) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg, var(--role-primary), var(--color-teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#fff' }}>
                {studentName !== 'No Linked Ward Found' ? studentName.slice(0,2).toUpperCase() : '??'}
              </div>
              <div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: '800', fontSize: '1.2rem' }}>{studentName}</h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dept} • {rollNumber}</div>
                {activeChild && (
                  <span className={`badge badge-${prs >= 75 ? 'success' : 'warning'}`} style={{ marginTop: '6px' }}>
                    <Star size={10} /> {prs >= 75 ? 'Ready for Placement' : 'Active Preparation'}
                  </span>
                )}
              </div>
              {!loading && activeChild && (
                <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                  <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r={r} fill="none" stroke="var(--card-border)" strokeWidth="8" />
                    <circle cx="50" cy="50" r={r} fill="none" stroke={prs >= 75 ? "var(--role-primary)" : "var(--color-amber)"} strokeWidth="8" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 8px ${prs >= 75 ? 'var(--role-primary)' : 'var(--color-amber)'})` }} />
                  </svg>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '-8px' }}>PRS Score: {prs}</div>
                </div>
              )}
            </div>

            {/* Placement result */}
            {bestOffer ? (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--r-md)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={20} color="var(--color-green)" />
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--color-green)' }}>🎉 Placement Offer Confirmed!</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {bestOffer.companyName} — {bestOffer.role || 'Selected Role'} · <strong style={{ color: 'var(--color-green)' }}>{bestOffer.packageLPA ? `₹${bestOffer.packageLPA} LPA` : 'Offer Confirmed'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--r-md)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={20} color="var(--color-amber)" />
                  <div>
                    <div style={{ fontWeight: '700', color: 'var(--color-amber)' }}>Placement In Progress</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Currently preparing profile and participating in campus recruitment drives.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid-cols-3 mb-20">
            {[
              { label: 'Total Applications', value: overview?.totalApplications ?? 0, icon: <Briefcase size={18} />, color: 'var(--role-primary)' },
              { label: 'Offers Received', value: overview?.offersCount ?? 0, icon: <CheckCircle size={18} />, color: 'var(--color-green)' },
              { label: 'Interviews Scheduled', value: overview?.interviewsCount ?? 0, icon: <TrendingUp size={18} />, color: 'var(--color-amber)' },
            ].map((s, i) => (
              <div key={i} className="card stat-card">
                <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Quick nav */}
          <div className="section-header">
            <div className="section-title">Quick Access</div>
            <button className="btn btn-outline btn-sm" onClick={() => setQueryForm(!queryForm)}><MessageCircle size={14}/> Contact Mentor</button>
          </div>
          
          {queryForm && (
            <div className="card mb-20 animate-slideup" style={{ border: '1px solid var(--role-primary)' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '0.95rem' }}>Send Query to Faculty Mentor</h3>
              <form onSubmit={handleSendQuery}>
                <div className="form-group">
                  <textarea className="form-input" rows="3" value={queryText} onChange={e => setQueryText(e.target.value)} placeholder="Type your message or question regarding your child's progress..." required></textarea>
                </div>
                <div className="flex gap-8">
                  <button type="submit" className="btn btn-primary btn-sm">Send Message</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQueryForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid-cols-2">
            {[
              { label: 'View Placement Progress', icon: Briefcase, panel: 'progress', desc: 'Applications, offers & interviews timeline' },
              { label: 'View Achievements', icon: Award, panel: 'milestones', desc: `${overview?.milestones?.length || 0} verified milestones and digital badges` },
              { label: 'Mentor Messages', icon: MessageSquare, panel: 'messages', desc: 'Send inquiries & view faculty mentor replies' },
              { label: 'Account Settings', icon: Settings, panel: 'settings', desc: 'Manage or self-delete your guardian login' },
            ].map((q, i) => (
              <div key={i} className="card cursor-pointer" onClick={() => setActivePanel(q.panel)}>
                <div className="flex items-center gap-12">
                  <div className="stat-icon"><q.icon size={20} /></div>
                  <div>
                    <div style={{ fontWeight: '700' }}>{q.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <Sidebar role="parent" activePanel={activePanel} setActivePanel={setActivePanel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={{ name: user.name || 'Guardian Account', email: user.email || '' }} />
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar title="Parent Portal" toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          openCommandPalette={() => setIsCommandOpen(true)} collapsed={sidebarCollapsed} />
        <main className="page-content animate-fadein">{renderPanel()}</main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
