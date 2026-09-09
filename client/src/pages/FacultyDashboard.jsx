import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CommandPalette from '../components/CommandPalette';
import { apiFetch } from '../services/api';
import { ToastContext } from '../App';
import { Upload, Book, FileText, CheckCircle, Clock } from 'lucide-react';

export default function FacultyDashboard() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const { addToast } = useContext(ToastContext);

  const [materials, setMaterials] = useState([]);
  const [topicLogs, setTopicLogs] = useState([]);
  const user = JSON.parse(localStorage.getItem('talenttrack_user') || '{}');

  // Material Form
  const [className, setClassName] = useState('');
  const [materialType, setMaterialType] = useState('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileData, setFileData] = useState(''); 

  // Topic Form
  const [topicClass, setTopicClass] = useState('');
  const [topicDate, setTopicDate] = useState(new Date().toISOString().split('T')[0]);
  const [topicsInput, setTopicsInput] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'faculty');
    fetchMaterials();
    fetchTopicLogs();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await apiFetch('/materials/faculty');
      if (res.success) setMaterials(res.materials);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTopicLogs = async () => {
    try {
      const res = await apiFetch('/topics/faculty');
      if (res && res.success) setTopicLogs(res.logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/materials', {
        method: 'POST',
        body: JSON.stringify({ className, materialType, title, description, fileData })
      });
      if (res.success) {
        addToast('success', 'Uploaded', 'Material uploaded successfully!');
        setTitle('');
        setDescription('');
        setFileData('');
        fetchMaterials();
      }
    } catch (err) {
      addToast('error', 'Upload Failed', err.message || 'Error uploading material');
    }
  };

  const handleSubmitTopics = async (e) => {
    e.preventDefault();
    try {
      const topics = topicsInput.split(',').map(t => t.trim()).filter(t => t);
      const res = await apiFetch('/topics/faculty', {
        method: 'POST',
        body: JSON.stringify({ className: topicClass, date: topicDate, topics })
      });
      if (res.success) {
        addToast('success', 'Topics Submitted', 'Daily topics submitted successfully!');
        setTopicsInput('');
        fetchTopicLogs(); 
      }
    } catch (err) {
      addToast('error', 'Submission Failed', err.message || 'Error submitting topics');
    }
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'materials':
        return (
          <div className="animate-fadein">
            <div className="section-header">
              <div className="section-title">Class Materials & Notes</div>
            </div>
            <div className="grid-cols-2">
              <div className="card">
                <h3 className="mb-16">Upload Material</h3>
                <form onSubmit={handleUploadMaterial}>
                  <div className="form-group">
                    <label className="form-label">Class Name (e.g. CSE A)</label>
                    <input className="form-input" type="text" value={className} onChange={e => setClassName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={materialType} onChange={e => setMaterialType(e.target.value)}>
                      <option value="note">Notes</option>
                      <option value="assignment">Assignment</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input className="form-input" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description / Content</label>
                    <textarea className="form-input" value={description} onChange={e => setDescription(e.target.value)} rows="3" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Resource Link (URL to Drive, PDF, etc.)</label>
                    <input className="form-input" type="text" value={fileData} onChange={e => setFileData(e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary mt-8">
                    <Upload size={14} /> Upload Material
                  </button>
                </form>
              </div>
  
              <div className="card">
                <h3 className="mb-16">Recent Uploads</h3>
                <div className="materials-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {materials.length === 0 ? <p className="empty-state">No materials uploaded yet.</p> : materials.map(m => (
                    <div key={m._id} style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{m.title}</strong>
                        <span className={`badge ${m.materialType === 'note' ? 'badge-primary' : 'badge-warning'}`}>
                          {m.materialType.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>Class: {m.className}</div>
                      {m.fileData && <a href={m.fileData} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '8px', fontSize: '0.85rem', color: 'var(--color-indigo)' }}>View Resource</a>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'topics':
        return (
          <div className="animate-fadein">
             <div className="section-header">
              <div className="section-title">Daily Topic Submission</div>
            </div>
            <div className="grid-cols-2">
              <div className="card">
                <h3 className="mb-16">End of Day Topic Log</h3>
                <p style={{ color: 'var(--text-dim)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Enter the headings of the topics you taught today. Students will be required to submit matching headings.
                </p>
                <form onSubmit={handleSubmitTopics}>
                  <div className="form-group">
                    <label className="form-label">Class Name</label>
                    <input className="form-input" type="text" value={topicClass} onChange={e => setTopicClass(e.target.value)} required placeholder="e.g. CSE A" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-input" type="date" value={topicDate} onChange={e => setTopicDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Topics Taught (Comma Separated)</label>
                    <textarea 
                      className="form-input"
                      value={topicsInput} 
                      onChange={e => setTopicsInput(e.target.value)} 
                      required 
                      placeholder="e.g. Introduction to AI, Neural Networks, Backpropagation"
                      rows="4"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary mt-8">
                    <FileText size={14} /> Submit Topics
                  </button>
                </form>
              </div>
              <div className="card">
                <h3 className="mb-16">Recent Topic Logs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topicLogs.length === 0 ? <p className="empty-state">No topics logged yet.</p> : topicLogs.map((t, i) => (
                    <div key={i} style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                      <div className="flex items-center justify-between mb-8">
                        <strong>{t.className}</strong>
                        <span className="badge badge-neutral"><Clock size={12}/> {new Date(t.date).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {t.topics.map((topic, idx) => (
                          <span key={idx} style={{ fontSize: '0.75rem', padding: '2px 8px', background: 'var(--bg-card)', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="animate-fadein">
            <div className="page-header">
              <h2 className="page-title">Welcome back, Faculty 👋</h2>
              <div className="page-subtitle">Here is your daily overview.</div>
            </div>
            <div className="grid-cols-3 mb-24">
              <div className="card stat-card" onClick={() => setActivePanel('materials')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon" style={{ color: 'var(--color-indigo)' }}><Book size={20} /></div>
                <div className="stat-label">Total Materials</div>
                <div className="stat-value" style={{ color: 'var(--color-indigo)' }}>{materials.length}</div>
              </div>
              <div className="card stat-card" onClick={() => setActivePanel('topics')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon" style={{ color: 'var(--color-green)' }}><CheckCircle size={20} /></div>
                <div className="stat-label">Topic Logs</div>
                <div className="stat-value" style={{ color: 'var(--color-green)' }}>{topicLogs.length}</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        role="faculty" 
        activePanel={activePanel} 
        setActivePanel={setActivePanel} 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={{ name: user.name || 'Faculty', email: user.email || 'faculty@example.com' }} 
      />
      <div className={`main-wrapper ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Topbar 
          title="Faculty Portal" 
          toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          openCommandPalette={() => setIsCommandOpen(true)} 
          collapsed={sidebarCollapsed} 
        />
        <main className="page-content animate-fadein">{renderPanel()}</main>
      </div>
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
}
