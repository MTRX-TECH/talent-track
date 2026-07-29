import React, { useContext, useEffect, useRef, useState } from 'react';
import { PanelLeftClose, PanelLeft, Search, Sun, Moon, Bell } from 'lucide-react';
import { ThemeContext } from '../App';
import { apiFetch } from '../services/api';

export default function Topbar({ title, toggleSidebar, openCommandPalette, collapsed }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [notifs, setNotifs]   = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    apiFetch('/notifications')
      .then(res => setNotifs(res.notifications || []))
      .catch(() => {});
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openCommandPalette]);

  const unread = notifs.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await apiFetch('/notifications/all/read', { method: 'PUT' });
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  return (
    <header className="topbar">
      <div className="flex items-center gap-12">
        <button className="icon-btn mobile-topbar-toggle" onClick={toggleSidebar} title={collapsed ? "Open Sidebar" : "Close Sidebar"} aria-label="Toggle Sidebar" style={{ minWidth: '40px', minHeight: '40px' }}>
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-actions flex items-center gap-8">


        {/* Search shortcut */}
        <button className="search-hotkey" onClick={openCommandPalette}>
          <Search size={14} />
          <span>Search...</span>
          <kbd>⌘K</kbd>
        </button>

        {/* Theme toggle */}
        <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme" style={{ minWidth: '38px', minHeight: '38px' }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button className="icon-btn" onClick={() => setShowNotifs(!showNotifs)} title="Notifications" style={{ minWidth: '38px', minHeight: '38px' }}>
            <Bell size={16} />
            {unread > 0 && <span className="notif-dot" />}
          </button>

          {showNotifs && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span>Notifications {unread > 0 && <span className="badge badge-danger" style={{ marginLeft: '6px' }}>{unread}</span>}</span>
                {unread > 0 && (
                  <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No notifications
                </div>
              ) : (
                notifs.slice(0, 6).map((n, i) => (
                  <div key={i} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                    {!n.isRead && <div className="notif-dot-badge" />}
                    <div style={{ flex: 1 }}>
                      <div className="notif-text"><strong>{n.title || 'Update'}</strong> {n.message}</div>
                      <div className="notif-time">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Just now'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
