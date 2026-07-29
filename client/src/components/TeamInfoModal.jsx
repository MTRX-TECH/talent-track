import React from 'react';
import { Info, X, Users, Star, Award, Heart } from 'lucide-react';

export default function TeamInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-card animate-slideup" onClick={e => e.stopPropagation()} style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--role-primary) 0%, var(--color-teal) 100%)', padding: '24px', position: 'relative' }}>
          <button className="icon-btn" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', color: '#fff', background: 'rgba(0,0,0,0.2)' }}>
            <X size={16} />
          </button>
          <h2 style={{ color: '#fff', margin: 0, fontSize: '1.4rem', fontWeight: '800', fontFamily: 'Syne, sans-serif' }}>TalentTrack Enterprise</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '4px' }}>A Next-Generation Higher Education SaaS Platform</p>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div className="section-title mb-16" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>PROJECT LEADERSHIP</div>
          <div className="flex items-center gap-12 mb-20" style={{ padding: '12px', background: 'var(--bg-dark)', borderRadius: 'var(--r-md)', border: '1px solid var(--card-border)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--role-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--role-primary)' }}>
               <Star size={20} />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>MARAPATHRAN V</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MTRX TECH Founder & CEO</div>
            </div>
          </div>

          <div className="section-title mb-16" style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>CORE ENGINEERING DEVELOPERS</div>
          <div className="grid-cols-1 mb-20" style={{ gap: '8px' }}>
            {[
              { name: 'DURGA MIKILA S.V', role: 'Developer 1' },
              { name: 'MURUGAN S', role: 'Developer 2' },
              { name: 'SUNDHARESWARAN S.K', role: 'Developer 3' }
            ].map((dev, i) => (
              <div key={i} className="flex items-center justify-between" style={{ padding: '10px 16px', background: 'var(--bg-dark)', borderRadius: 'var(--r-sm)' }}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{dev.name}</div>
                <div className="badge badge-info">{dev.role}</div>
              </div>
            ))}
          </div>

          <div className="grid-cols-2 mb-20">
            <div className="card card-sm">
               <div className="flex items-center gap-8 mb-8 text-muted" style={{ fontSize: '0.75rem', fontWeight: '700' }}><Heart size={14} color="var(--color-red)"/> WEB DESIGNER</div>
               <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>MANU SHREE M</div>
            </div>
            <div className="card card-sm">
               <div className="flex items-center gap-8 mb-8 text-muted" style={{ fontSize: '0.75rem', fontWeight: '700' }}><Award size={14} color="var(--color-amber)"/> PERSONAL MENTOR</div>
               <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Mrs. C. Krishnakala</div>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Professor & Personal Mentor</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--glass-overlay)', borderRadius: 'var(--r-md)' }}>
             <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '4px' }}>SPECIAL THANKS</div>
             <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '1.1rem' }}>RAMCO INSTITUTE OF TECHNOLOGY</div>
          </div>
        </div>
      </div>
    </div>
  );
}
