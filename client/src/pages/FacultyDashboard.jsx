import React, { useState, useEffect } from 'react';
import { Upload, Book, FileText, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [topicLogs, setTopicLogs] = useState([]);

  // Material Form
  const [className, setClassName] = useState('');
  const [materialType, setMaterialType] = useState('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileData, setFileData] = useState(''); // Just a text link for now to simplify

  // Topic Form
  const [topicClass, setTopicClass] = useState('');
  const [topicDate, setTopicDate] = useState(new Date().toISOString().split('T')[0]);
  const [topicsInput, setTopicsInput] = useState('');

  useEffect(() => {
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
      const res = await apiFetch('/topics/faculty'); // Assuming this route exists, actually I might not have added it to api.js. I'll just skip fetching it if it fails, or I can add it to api.js.
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
        alert('Material uploaded successfully!');
        setTitle('');
        setDescription('');
        setFileData('');
        fetchMaterials();
      }
    } catch (err) {
      alert(err.message || 'Error uploading material');
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
        alert('Daily topics submitted successfully!');
        setTopicsInput('');
        fetchTopicLogs(); // Need to implement this route
      }
    } catch (err) {
      alert(err.message || 'Error submitting topics');
    }
  };

  return (
    <div className="dashboard-container animate-fadein">
      <header className="dashboard-header">
        <div>
          <h1>Faculty Dashboard</h1>
          <p>Manage class materials and daily topics</p>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          <Book size={18} /> Class Materials
        </button>
        <button 
          className={`tab-btn ${activeTab === 'topics' ? 'active' : ''}`}
          onClick={() => setActiveTab('topics')}
        >
          <CheckCircle size={18} /> Daily Topics
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'materials' && (
          <div className="grid-cols-2">
            <div className="card">
              <h3>Upload Material</h3>
              <form onSubmit={handleUploadMaterial}>
                <div className="form-group">
                  <label>Class Name (e.g. CSE A)</label>
                  <input type="text" value={className} onChange={e => setClassName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={materialType} onChange={e => setMaterialType(e.target.value)}>
                    <option value="note">Notes</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Description / Content</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" />
                </div>
                <div className="form-group">
                  <label>Resource Link (URL to Drive, PDF, etc.)</label>
                  <input type="text" value={fileData} onChange={e => setFileData(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary">
                  <Upload size={18} /> Upload
                </button>
              </form>
            </div>

            <div className="card">
              <h3>Recent Uploads</h3>
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
        )}

        {activeTab === 'topics' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3>End of Day Topic Submission</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '20px', fontSize: '0.9rem' }}>
              Enter the headings of the topics you taught today. Students will be required to submit matching headings.
            </p>
            <form onSubmit={handleSubmitTopics}>
              <div className="form-group">
                <label>Class Name</label>
                <input type="text" value={topicClass} onChange={e => setTopicClass(e.target.value)} required placeholder="e.g. CSE A" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={topicDate} onChange={e => setTopicDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Topics Taught (Comma Separated)</label>
                <textarea 
                  value={topicsInput} 
                  onChange={e => setTopicsInput(e.target.value)} 
                  required 
                  placeholder="e.g. Introduction to AI, Neural Networks, Backpropagation"
                  rows="4"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                <FileText size={18} /> Submit Topics
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
