import React from 'react';
import { X, Star, Shield, Zap, Award } from 'lucide-react';

export default function TeamInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999, backdropFilter: 'blur(8px)' }}>
      <div 
        className="modal-card animate-slideup" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          padding: '0', 
          overflow: 'hidden', 
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          maxWidth: '480px'
        }}
      >
        <div style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', 
          padding: '32px 24px', 
          position: 'relative',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none'
          }} />
          <button 
            className="icon-btn" 
            onClick={onClose} 
            style={{ 
              position: 'absolute', top: '16px', right: '16px', 
              color: 'rgba(255,255,255,0.7)', 
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >
            <X size={16} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ 
              padding: '8px', 
              background: 'rgba(99, 102, 241, 0.2)', 
              borderRadius: '12px',
              border: '1px solid rgba(99, 102, 241, 0.3)' 
            }}>
              <Zap size={24} color="#818cf8" />
            </div>
            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.6rem', fontWeight: '900', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>
              TalentTrack <span style={{ color: '#818cf8' }}>Enterprise</span>
            </h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', margin: 0, paddingLeft: '52px', fontWeight: '500' }}>
            Ultra-Premium SaaS Student Management
          </p>
        </div>
        
        <div style={{ padding: '32px 24px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', flex: 1, background: 'var(--card-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '800', letterSpacing: '0.1em' }}>EXECUTIVE LEADERSHIP</span>
            <div style={{ height: '1px', flex: 1, background: 'var(--card-border)' }} />
          </div>

          <div className="flex items-center gap-16 mb-24" style={{ 
            padding: '16px', 
            background: 'linear-gradient(145deg, var(--bg-dark) 0%, rgba(15, 23, 42, 0.4) 100%)', 
            borderRadius: '16px', 
            border: '1px solid var(--card-border)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
          }}>
            <div style={{ 
              width: '48px', height: '48px', 
              borderRadius: '14px', 
              background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-indigo) 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#fff',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
            }}>
               <Star size={24} fill="currentColor" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>MARAPATHRAN V</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-purple)', fontWeight: '600', marginTop: '2px' }}>Founder & Chief Executive Officer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>MTRX TECH</div>
            </div>
          </div>

          <div className="flex items-center gap-16 mb-24" style={{ 
            padding: '16px', 
            background: 'linear-gradient(145deg, var(--bg-dark) 0%, rgba(15, 23, 42, 0.4) 100%)', 
            borderRadius: '16px', 
            border: '1px solid var(--card-border)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)',
            marginTop: '-12px'
          }}>
            <div style={{ 
              width: '48px', height: '48px', 
              borderRadius: '14px', 
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#fff',
              boxShadow: '0 8px 16px rgba(236, 72, 153, 0.25)'
            }}>
               <Star size={24} fill="currentColor" />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-main)', letterSpacing: '0.02em' }}>MANU SHREE M</div>
              <div style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: '600', marginTop: '2px' }}>Lead Web Designer</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>UI/UX & DESIGN</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ height: '1px', flex: 1, background: 'var(--card-border)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '800', letterSpacing: '0.1em' }}>CORE ENGINEERING TEAM</span>
            <div style={{ height: '1px', flex: 1, background: 'var(--card-border)' }} />
          </div>

          <div className="grid-cols-1 mb-24" style={{ gap: '12px' }}>
            {[
              { name: 'MURUGAN S', role: 'Lead Full-Stack Engineer', icon: Shield },
              { name: 'SUNDHARESWARAN S.K', role: 'Systems Architect', icon: Zap }
            ].map((dev, i) => (
              <div key={i} className="flex items-center justify-between" style={{ 
                padding: '14px 20px', 
                background: 'var(--bg-dark)', 
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.03)',
                transition: 'transform 0.2s ease',
                cursor: 'default'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="flex items-center gap-12">
                  <div style={{ color: 'var(--text-dim)' }}>
                    <dev.icon size={16} />
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>{dev.name}</div>
                </div>
                <div style={{ 
                  fontSize: '0.7rem', 
                  fontWeight: '700', 
                  padding: '4px 10px', 
                  background: 'rgba(99, 102, 241, 0.1)', 
                  color: '#818cf8',
                  borderRadius: '100px',
                  letterSpacing: '0.05em'
                }}>
                  {dev.role.toUpperCase()}
                </div>
              </div>
            ))}
          </div>

          <div style={{ 
            textAlign: 'center', 
            padding: '24px', 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)', 
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
             <Award size={24} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
             <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '800', letterSpacing: '0.15em', marginBottom: '8px' }}>PROUDLY DEVELOPED AT</div>
             <div style={{ fontWeight: '900', color: 'var(--text-main)', fontSize: '1.2rem', letterSpacing: '0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
               RAMCO INSTITUTE OF TECHNOLOGY
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
