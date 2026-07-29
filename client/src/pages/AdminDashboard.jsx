import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';
import { Plus, Briefcase, Building, ClipboardList, FileText, BarChart3, CheckCircle, Clock, XCircle, CreditCard, Download, Users, Upload } from 'lucide-react';
import { downloadCSV, downloadDocument } from '../utils/fileDownloader';

function DrivesManagementPanel({ addToast }) {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyName: '', jobRole: '', ctc: '', driveDate: '', description: '', minPRS: 60, minGPA: 6.0 });

  useEffect(() => {
    apiFetch('/drives').then(r => setDrives(r.drives || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const r = await apiFetch('/drives', { method: 'POST', body: JSON.stringify({ ...form, eligibilityCriteria: { minPRS: Number(form.minPRS), minGPA: Number(form.minGPA) } }) });
      setDrives(prev => [r.drive, ...prev]);
      setShowForm(false);
      addToast('success', 'Drive Created', `${form.companyName} drive is now live`);
    } catch (err) { addToast('error', 'Failed', err.message); }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Manage Placement Drives</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}><Plus size={14} /> Create Drive</button>
      </div>
      {showForm && (
        <div className="card mb-20 animate-slideup">
          <h3 style={{ marginBottom: '16px' }}>Create New Drive</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Company Name</label><input value={form.companyName} onChange={e => setForm(f=>({...f,companyName:e.target.value}))} required placeholder="e.g. Google India" /></div>
              <div className="form-group"><label className="form-label">Job Role</label><input value={form.jobRole} onChange={e => setForm(f=>({...f,jobRole:e.target.value}))} required placeholder="e.g. SDE-1" /></div>
              <div className="form-group"><label className="form-label">CTC (LPA)</label><input type="number" value={form.ctc} onChange={e => setForm(f=>({...f,ctc:e.target.value}))} required placeholder="24.5" /></div>
              <div className="form-group"><label className="form-label">Drive Date</label><input type="date" value={form.driveDate} onChange={e => setForm(f=>({...f,driveDate:e.target.value}))} required /></div>
              <div className="form-group"><label className="form-label">Min PRS Score</label><input type="number" value={form.minPRS} onChange={e => setForm(f=>({...f,minPRS:e.target.value}))} /></div>
              <div className="form-group"><label className="form-label">Min GPA</label><input type="number" step="0.1" value={form.minGPA} onChange={e => setForm(f=>({...f,minGPA:e.target.value}))} /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Drive description..." /></div>
            <div className="flex gap-8"><button type="submit" className="btn btn-primary btn-sm">Create Drive</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <div className="skeleton skeleton-card" /> : drives.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><Briefcase size={28} /></div><h3>No drives created yet</h3><button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14} /> Create First Drive</button></div>
      ) : (
        <div className="card card-flush">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Company</th><th>Role</th><th>CTC</th><th>Drive Date</th><th>Min PRS</th><th>Status</th></tr></thead>
              <tbody>
                {drives.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.companyName}</strong></td>
                    <td className="text-muted">{d.jobRole}</td>
                    <td><strong style={{ color: 'var(--color-green)' }}>₹{d.ctc} LPA</strong></td>
                    <td className="text-muted text-sm">{d.driveDate ? new Date(d.driveDate).toLocaleDateString() : '–'}</td>
                    <td><span className="badge badge-info">{d.eligibilityCriteria?.minPRS || '–'}</span></td>
                    <td><span className="badge badge-success">Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function OffersPanel({ addToast }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiFetch('/offers').then(r => setOffers(r.offers || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  return (
    <div>
      <div className="section-header"><div className="section-title">Offer Letters</div><span className="badge badge-info">{offers.length} Issued</span></div>
      {loading ? <div className="skeleton skeleton-card" /> : offers.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><FileText size={28} /></div><h3>No offers issued yet</h3></div>
      ) : (
        <div className="grid-cols-2">
          {offers.map((o, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-8"><h4 style={{ fontWeight: '700' }}>{o.companyName}</h4>
                <span className={`badge badge-${o.status==='ACCEPTED'?'success':o.status==='PENDING'?'warning':'danger'}`}>{o.status}</span>
              </div>
              <div style={{ color: 'var(--color-green)', fontWeight: '800', fontSize: '1.2rem' }}>₹{o.ctc} LPA</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>{o.role}</div>
              {o.joiningDate && <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '8px' }}>Joining: {new Date(o.joiningDate).toLocaleDateString()}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacultyManagementPanel({ addToast, faculty, fetchFaculty }) {
  const [importLoading, setImportLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', email: '', role: 'hod', departmentName: '' });
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
      fetchFaculty();
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
      // Reuse the bulk import endpoint for a single record to get credentials generated
      const users = [{ ...manualForm, status: 'VALID' }];
      const r = await apiFetch('/excel/import', { method: 'POST', body: JSON.stringify({ users }) });
      addToast('success', 'HOD Created', `Successfully created ${manualForm.name}`);
      if (r.credentials && r.credentials.length > 0) {
        setGeneratedCredentials(r.credentials);
      }
      setShowManualForm(false);
      setManualForm({ name: '', email: '', role: 'hod', departmentName: '' });
      fetchFaculty();
    } catch (err) {
      addToast('error', 'Creation Failed', err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this HOD login?")) return;
    try {
      await apiFetch(`/faculty/${id}`, { method: 'DELETE' });
      addToast('success', 'Deleted', 'HOD login has been removed.');
      fetchFaculty();
    } catch (err) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div className="section-title">HOD Management</div>
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
          <h3 style={{ marginBottom: '16px' }}>Create HOD Login</h3>
          <form onSubmit={handleManualCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group"><label className="form-label">Full Name</label><input value={manualForm.name} onChange={e => setManualForm(f=>({...f,name:e.target.value}))} required placeholder="Dr. John Doe" /></div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" value={manualForm.email} onChange={e => setManualForm(f=>({...f,email:e.target.value}))} required placeholder="hod@univ.edu" /></div>
              <div className="form-group"><label className="form-label">Department</label><input type="text" value={manualForm.departmentName || ''} onChange={e => setManualForm(f=>({...f,departmentName:e.target.value}))} required placeholder="e.g. Computer Science" /></div>
            </div>
            <div className="flex gap-8 mt-8">
              <button type="submit" className="btn btn-primary btn-sm" disabled={importLoading}>{importLoading ? 'Creating...' : 'Create HOD'}</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowManualForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {!generatedCredentials && !showManualForm && (
      <div className="card mb-20">
        <h3>Bulk HOD & Mentor Import</h3>
        <p className="text-muted text-sm mb-16">Upload a CSV or Excel file containing faculty details. Columns required: Name, Email, Role (HOD, Mentor, Admin).</p>
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
                <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th></tr></thead>
                <tbody>
                  {preview.preview.map((p, i) => (
                    <tr key={i}>
                      <td>{p.row}</td>
                      <td>{p.name}</td>
                      <td>{p.email}</td>
                      <td>{p.role}</td>
                      <td>{p.departmentName}</td>
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
            <thead><tr><th>HOD Name</th><th>Email</th><th>Department</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {faculty.map((m, i) => (
                <tr key={m._id || i}>
                  <td><strong>{m.name}</strong></td>
                  <td className="text-muted">{m.email}</td>
                  <td>{m.departmentName || <span className="text-muted">Not Set</span>}</td>
                  <td><span className={`badge badge-${m.isActive ? 'success' : 'danger'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-red)' }} onClick={() => handleDelete(m._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {faculty.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No HOD logins created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BillingPanel({ addToast }) {
  return (
    <div>
      <div className="section-header">
        <div className="section-title">Billing & Subscription Details</div>
      </div>
      <div className="grid-cols-2 mb-24">
        <div className="card text-center">
          <div className="stat-icon" style={{ color: 'var(--color-green)', margin: '0 auto' }}><CreditCard size={24} /></div>
          <h3 style={{ marginTop: '16px' }}>Premium Subscription</h3>
          <p className="text-muted text-sm">Billed Annually · ₹12,00,000 / year</p>
          <div className="badge badge-success mt-12 mb-16" style={{ fontSize: '0.85rem' }}>ACTIVE</div>
          <p className="text-sm">Next billing date: <strong>01 Aug 2027</strong></p>
        </div>
        <div className="card">
          <h3 className="mb-16">Invoice History</h3>
          <div className="table-wrapper">
            <table>
              <tbody>
                <tr>
                  <td><strong>INV-2026-001</strong></td>
                  <td className="text-muted">01 Aug 2026</td>
                  <td><strong style={{ color: 'var(--color-green)' }}>₹12,00,000</strong></td>
                  <td><span className="badge badge-success">PAID</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      downloadDocument('Invoice_INV-2026-001.doc', 'Official Tax Invoice - INV-2026-001', `
                        <div class="box">
                          <p><strong>Invoice Reference:</strong> INV-2026-001</p>
                          <p><strong>Date of Billing:</strong> 01 Aug 2026</p>
                          <p><strong>Billed To Institution:</strong> Active Enterprise Tenant</p>
                        </div>
                        <table>
                          <thead><tr><th>Description</th><th>Period</th><th>Amount (INR)</th></tr></thead>
                          <tbody>
                            <tr><td>TalentTrack Enterprise OS Annual Subscription</td><td>2026 - 2027</td><td>₹12,00,000</td></tr>
                          </tbody>
                        </table>
                        <p><strong>Status:</strong> PAID IN FULL</p>
                      `);
                      addToast('success', 'Downloaded', 'Invoice INV-2026-001 downloaded to computer');
                    }}><Download size={14}/></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlacementAnalyticsPanel({ addToast, students = [], offers = [], drives = [] }) {
  const depts = {};
  students.forEach(s => {
    const d = s.departmentName || 'General Engineering';
    if (!depts[d]) depts[d] = { total: 0, prsSum: 0, maxPrs: 0 };
    depts[d].total += 1;
    const prs = s.prs || 0;
    depts[d].prsSum += prs;
    if (prs > depts[d].maxPrs) depts[d].maxPrs = prs;
  });
  const deptRows = Object.keys(depts).map(d => ({
    name: d,
    avg: Math.round(depts[d].prsSum / depts[d].total),
    top: depts[d].maxPrs
  }));

  const placedStudentsCount = students.filter(s => s.hasOffer).length;
  const placementRate = students.length > 0 ? Math.round((placedStudentsCount / students.length) * 100) + '%' : '0%';
  const avgCtc = offers.length > 0 ? (offers.reduce((acc, o) => acc + Number(o.ctc || 0), 0) / offers.length).toFixed(1) + ' LPA' : '0 LPA';
  const overallAvgPRS = students.length > 0 ? (students.reduce((acc, s) => acc + (s.prs || 0), 0) / students.length).toFixed(1) : '0.0';

  return (
    <div>
      <div className="section-header">
        <div className="section-title">Placement Intelligence (TPO)</div>
        <button className="btn btn-primary btn-sm" onClick={() => {
          const rows = students.map(s => [s.rollNumber || 'N/A', s.name || 'Student', s.departmentName || 'N/A', String(s.prs || 0), s.hasOffer ? 'Offer Received' : 'Shortlisted']);
          downloadCSV('Placement_Shortlist.csv', ['Roll Number', 'Student Name', 'Department', 'PRS Score', 'Status'], rows.length > 0 ? rows : [['N/A', 'No eligible students yet', '', '0', '']]);
          addToast('success', 'Export Complete', 'Shortlist CSV saved to your computer.');
        }}><Download size={14} /> Export Shortlist</button>
      </div>

      <div className="grid-cols-2 mb-20">
        <div className="card">
          <h3 className="mb-16">Cross-Department PRS Rankings</h3>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Department</th><th>Avg PRS</th><th>Top Score</th></tr></thead>
              <tbody>
                {deptRows.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No student records available yet.</td></tr>
                ) : (
                  deptRows.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.name}</td>
                      <td><span className={`badge badge-${r.avg >= 70 ? 'success' : 'warning'}`}>{r.avg}</span></td>
                      <td>{r.top}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-16">Accreditation Reports (NAAC/NBA)</h3>
          <p className="text-muted text-sm mb-16">Generate official compliance reports based on audited placement outcomes and verified student milestones.</p>
          <div className="flex flex-col gap-10">
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => {
              downloadDocument('NAAC_Criterion_5_Report.doc', 'NAAC Criterion 5: Student Support & Progression', `
                <div class="box"><p>This official compliance report verifies institution-wide student achievement, career guidance efficacy, and placement transition metrics for NAAC accreditation.</p></div>
                <h2>Audited Outcome Summary</h2>
                <table>
                  <thead><tr><th>Metric Description</th><th>Evaluated Value</th><th>Compliance Status</th></tr></thead>
                  <tbody>
                    <tr><td>Average Institution PRS Score</td><td>${overallAvgPRS} / 100</td><td>COMPLIANT</td></tr>
                    <tr><td>Total Enrolled Students Tracked</td><td>${students.length}</td><td>CERTIFIED</td></tr>
                    <tr><td>Placement & Internship Rate</td><td>${placementRate}</td><td>CERTIFIED</td></tr>
                  </tbody>
                </table>
              `);
              addToast('success', 'Report Downloaded', 'NAAC Criterion 5 file saved to computer.');
            }}><span>Criterion 5: Student Support & Progression (NAAC)</span> <Download size={14}/></button>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => {
              downloadDocument('NBA_Placement_Audit_Report.doc', 'NBA Placement Integrity & Outcome Audit Report', `
                <div class="box"><p>Comprehensive audit record of student placements, recruiter drives, and compensation transparency as required by National Board of Accreditation (NBA).</p></div>
                <h2>Department Placement Integrity</h2>
                <table>
                  <thead><tr><th>Department</th><th>Students Tracked</th><th>Average PRS</th><th>Status</th></tr></thead>
                  <tbody>
                    ${deptRows.length === 0 ? '<tr><td colspan="4">No department records yet</td></tr>' : deptRows.map(r => `<tr><td>${r.name}</td><td>Verified</td><td>${r.avg} / 100</td><td>COMPLIANT</td></tr>`).join('')}
                  </tbody>
                </table>
              `);
              addToast('success', 'Report Downloaded', 'NBA Audit Report saved to computer.');
            }}><span>Placement Integrity Audit Report (NBA)</span> <Download size={14}/></button>
            <button className="btn btn-outline" style={{ justifyContent: 'space-between' }} onClick={() => {
              downloadCSV('Term_Placement_Trends.csv', ['Current Term', 'Total Companies', 'Total Drives', 'Average CTC', 'Placement Rate'], [
                [new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), String(offers.length), String(drives.length), avgCtc, placementRate]
              ]);
              addToast('success', 'Report Downloaded', 'Placement trends CSV saved to computer.');
            }}><span>Term-over-Term Placement Trends</span> <Download size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [drives, setDrives]     = useState([]);
  const [companies, setCompanies] = useState([]);
  const [faculty, setFaculty]     = useState([]);
  const [students, setStudents]   = useState([]);
  const [offers, setOffers]       = useState([]);
  const { addToast }            = useContext(ToastContext);
  const user = JSON.parse(localStorage.getItem('talenttrack_user') || '{}');

  const fetchFaculty = () => {
    apiFetch('/faculty').then(r => setFaculty(r.faculty || [])).catch(() => {});
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'admin');
    Promise.all([
      apiFetch('/drives').catch(() => ({ drives: [] })),
      apiFetch('/companies').catch(() => ({ companies: [] })),
      apiFetch('/faculty').catch(() => ({ faculty: [] })),
      apiFetch('/students').catch(() => ({ students: [] })),
      apiFetch('/offers').catch(() => ({ offers: [] })),
    ]).then(([dr, co, fac, stu, off]) => {
      setDrives(dr.drives || []);
      setCompanies(co.companies || []);
      setFaculty(fac.faculty || []);
      setStudents(stu.students || []);
      setOffers(off.offers || []);
    });
  }, []);

  const placedCount = students.filter(s => s.hasOffer).length;
  const placementRate = students.length > 0 ? Math.round((placedCount / students.length) * 100) + '%' : '0%';
  const avgCtc = offers.length > 0 ? (offers.reduce((acc, o) => acc + Number(o.ctc || 0), 0) / offers.length).toFixed(1) + ' LPA' : '0 LPA';

  const renderPanel = () => {
    switch (activePanel) {
      case 'drives':    return <DrivesManagementPanel addToast={addToast} />;
      case 'offers':    return <OffersPanel addToast={addToast} />;
      case 'faculty':   return <FacultyManagementPanel addToast={addToast} faculty={faculty} fetchFaculty={fetchFaculty} />;
      case 'analytics': return <PlacementAnalyticsPanel addToast={addToast} students={students} offers={offers} drives={drives} />;
      case 'billing':   return <BillingPanel addToast={addToast} />;
      case 'companies': return (
        <div>
          <div className="section-header"><div className="section-title">Corporate Partners</div><span className="badge badge-info">{companies.length} Partners</span></div>
          <div className="grid-cols-3">
            {companies.map((c, i) => (
              <div key={i} className="card card-sm text-center">
                <div className="drive-logo" style={{ margin: '0 auto 12px' }}>{(c.name||'?')[0]}</div>
                <h4 style={{ fontWeight: '700' }}>{c.name}</h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 10px' }}>{c.industry}</div>
                <span className="badge badge-purple">{c.tier} Tier</span>
              </div>
            ))}
            {companies.length === 0 && <div className="empty-state"><div className="empty-state-icon"><Building size={28} /></div><h3>No companies yet</h3></div>}
          </div>
        </div>
      );
      default: return (
        <div>
          <div className="page-header">
            <h2 className="page-title">Institution Admin Portal</h2>
            <div className="page-subtitle">Manage placements, faculty, and institutional operations</div>
          </div>
          <div className="grid-cols-4 mb-24">
            {[
              { label: 'Active Drives', value: drives.length, color: 'var(--role-primary)', icon: <Briefcase size={18} /> },
              { label: 'Partner Companies', value: companies.length, color: 'var(--color-purple)', icon: <Building size={18} /> },
              { label: 'Placement Rate', value: placementRate, color: 'var(--color-green)', icon: <CheckCircle size={18} /> },
              { label: 'Avg CTC', value: avgCtc, color: 'var(--color-amber)', icon: <BarChart3 size={18} /> },
            ].map((s, i) => (
              <div key={i} className="card stat-card" onClick={() => s.label === 'Placement Rate' ? setActivePanel('analytics') : null} style={{ cursor: s.label === 'Placement Rate' ? 'pointer' : 'default' }}>
                <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value accent" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="section-header">
            <div className="section-title">Active Placement Drives</div>
            <button className="btn btn-primary btn-sm" onClick={() => setActivePanel('drives')}><Plus size={13} /> Create Drive</button>
          </div>
          <div className="card card-flush mb-20">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Company</th><th>Role</th><th>CTC</th><th>Drive Date</th><th>Status</th></tr></thead>
                <tbody>
                  {drives.slice(0,5).map((d, i) => (
                    <tr key={i}>
                      <td><div className="flex items-center gap-8"><div className="drive-logo" style={{ width:'28px',height:'28px' }}>{(d.companyName||'?')[0]}</div><strong>{d.companyName}</strong></div></td>
                      <td className="text-muted">{d.jobRole}</td>
                      <td><strong style={{ color: 'var(--color-green)' }}>₹{d.ctc} LPA</strong></td>
                      <td className="text-sm text-muted">{d.driveDate ? new Date(d.driveDate).toLocaleDateString() : '–'}</td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  ))}
                  {drives.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No drives created yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <Sidebar role="admin" activePanel={activePanel} setActivePanel={setActivePanel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={{ name: user.name || 'Admin', email: user.email || 'admin@example.com' }} />
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar title="Institution Admin Portal" toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          openCommandPalette={() => setIsCommandOpen(true)} collapsed={sidebarCollapsed} />
        <main className="page-content animate-fadein">{renderPanel()}</main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
