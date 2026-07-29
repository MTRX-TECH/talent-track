import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Briefcase, Award, Building, Users, ArrowRight } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) { setResults(null); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/search?query=${encodeURIComponent(query)}`);
        setResults(data.results || {});
      } catch { setResults({}); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasResults = results && (
    (results.companies?.length || 0) +
    (results.users?.length || 0) +
    (results.drives?.length || 0) +
    (results.milestones?.length || 0)
  ) > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card command-palette-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <Search size={16} color="var(--role-primary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search students, drives, companies, milestones..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', padding: 0 }}
          />
          <kbd style={{ cursor: 'pointer' }} onClick={onClose}>ESC</kbd>
          <button className="icon-btn" onClick={onClose} style={{ width: '28px', height: '28px' }}><X size={14} /></button>
        </div>

        <div className="modal-body" style={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 8px' }} />
              Searching...
            </div>
          )}

          {!loading && query && !hasResults && results !== null && (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No results for "<strong style={{ color: 'var(--text-dim)' }}>{query}</strong>"
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '16px 18px' }}>
              <div className="cmd-result-label">QUICK ACTIONS</div>
              {[
                { label: 'View Placement Drives', icon: Briefcase },
                { label: 'Submit a Milestone', icon: Award },
                { label: 'Check Leaderboard', icon: Users },
              ].map((a, i) => (
                <div key={i} className="cmd-result-item" onClick={onClose}>
                  <a.icon size={14} color="var(--role-primary)" />
                  <span>{a.label}</span>
                  <ArrowRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                </div>
              ))}
            </div>
          )}

          {results && (
            <>
              {results.companies?.length > 0 && (
                <div className="cmd-result-group">
                  <div className="cmd-result-label">COMPANIES ({results.companies.length})</div>
                  {results.companies.map((c, i) => (
                    <div key={i} className="cmd-result-item">
                      <Building size={14} color="var(--text-muted)" />
                      <div>
                        <strong>{c.name}</strong>
                        <span className="text-muted text-xs" style={{ marginLeft: '8px' }}>{c.industry} · {c.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.drives?.length > 0 && (
                <div className="cmd-result-group">
                  <div className="cmd-result-label">DRIVES ({results.drives.length})</div>
                  {results.drives.map((d, i) => (
                    <div key={i} className="cmd-result-item">
                      <Briefcase size={14} color="var(--text-muted)" />
                      <div>
                        <strong>{d.companyName}</strong>
                        <span className="text-muted text-xs" style={{ marginLeft: '8px' }}>{d.jobRole}</span>
                      </div>
                      <span className="badge badge-success" style={{ marginLeft: 'auto' }}>₹{d.ctc} LPA</span>
                    </div>
                  ))}
                </div>
              )}
              {results.users?.length > 0 && (
                <div className="cmd-result-group">
                  <div className="cmd-result-label">STUDENTS ({results.users.length})</div>
                  {results.users.map((u, i) => (
                    <div key={i} className="cmd-result-item">
                      <Users size={14} color="var(--text-muted)" />
                      <div>
                        <strong>{u.name}</strong>
                        <span className="text-muted text-xs" style={{ marginLeft: '8px' }}>{u.rollNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {results.milestones?.length > 0 && (
                <div className="cmd-result-group">
                  <div className="cmd-result-label">MILESTONES ({results.milestones.length})</div>
                  {results.milestones.map((m, i) => (
                    <div key={i} className="cmd-result-item">
                      <Award size={14} color="var(--text-muted)" />
                      <div>
                        <strong>{m.title}</strong>
                        <span className="text-muted text-xs" style={{ marginLeft: '8px' }}>{m.category}</span>
                      </div>
                      <span className={`badge badge-${m.status === 'APPROVED' ? 'success' : m.status === 'PENDING' ? 'warning' : 'neutral'}`} style={{ marginLeft: 'auto' }}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
