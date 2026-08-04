import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../services/api';

export default function SystemDiagnosticsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState(null);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/healthcheck');
      if (res && res.diagnostics) {
        setDiagnostics(res);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError('Vercel to Render Proxy Failed. Ensure your vercel.json has the correct Render URL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) runDiagnostics();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem' }}>
            <Activity size={20} style={{ color: 'var(--role-superadmin)' }} /> Cloud Deployment Diagnostics
          </h2>
          <button className="btn-icon" onClick={runDiagnostics} title="Refresh Diagnostics" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Node 1: Vercel Proxy */}
          <div className="stat-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px' }}>
            {error ? <XCircle size={24} color="var(--color-red)" /> : <CheckCircle size={24} color="var(--color-green)" />}
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={16} /> 1. Vercel to Render Connection
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {error ? error : 'Frontend is successfully proxying API requests to the Render backend.'}
              </p>
            </div>
          </div>

          {/* Node 2: Database Connection */}
          {diagnostics && (
            <div className="stat-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderLeft: diagnostics.diagnostics.dbConnected ? '4px solid var(--color-green)' : '4px solid var(--color-red)' }}>
              {diagnostics.diagnostics.dbConnected ? <CheckCircle size={24} color="var(--color-green)" /> : <XCircle size={24} color="var(--color-red)" />}
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={16} /> 2. Render to MongoDB Atlas Connection
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {diagnostics.diagnostics.dbConnected 
                    ? 'Backend is connected to MongoDB Atlas.' 
                    : 'Backend cannot connect to MongoDB. Have you whitelisted IP 0.0.0.0/0 in Atlas Network Access?'}
                </p>
              </div>
            </div>
          )}

          {/* Node 3: Environment Variables */}
          {diagnostics && (
            <div className="stat-card" style={{ padding: '16px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={16} color="var(--color-orange)" /> 3. Render Environment Variables
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Object.entries(diagnostics.diagnostics.envVars).map(([key, isSet]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
                    {isSet ? <CheckCircle size={14} color="var(--color-green)" /> : <XCircle size={14} color="var(--color-red)" />}
                    <span style={{ fontFamily: 'monospace', opacity: isSet ? 1 : 0.6 }}>{key}</span>
                  </div>
                ))}
              </div>
              <p style={{ margin: '12px 0 0 0', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                Missing variables must be added directly in the Render Dashboard.
              </p>
            </div>
          )}

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Close Diagnostics</button>
          </div>
        </div>
      </div>
    </div>
  );
}
