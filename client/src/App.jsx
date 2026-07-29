import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { getToken } from './services/api';
import StarfieldCanvas from './components/StarfieldCanvas';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import MentorDashboard from './pages/MentorDashboard';
import HODDashboard from './pages/HODDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ParentDashboard from './pages/ParentDashboard';
import ForcePasswordReset from './components/ForcePasswordReset';
import ForceParentCreation from './components/ForceParentCreation';

// ─── Theme Context ────────────────────────────────────────────────────────────
export const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });
export const ToastContext = createContext({ addToast: () => {} });

// ─── Toast Container ──────────────────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-icon">
            {t.type === 'success' && <span>✓</span>}
            {t.type === 'error'   && <span>✕</span>}
            {t.type === 'warning' && <span>⚠</span>}
            {t.type === 'info'    && <span>ℹ</span>}
          </div>
          <div className="toast-content">
            {t.title   && <div className="toast-title">{t.title}</div>}
            {t.message && <div className="toast-message">{t.message}</div>}
          </div>
          <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('talenttrack_user') || '{}');
    } catch {
      return {};
    }
  });

  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;
    if (allowedRoles && !allowedRoles.includes(role)) {
      return <Navigate to="/login" replace />;
    }
    
    // Intercept with forced password reset if needed
    if (user.needsPasswordChange) {
      return <ForcePasswordReset user={user} onComplete={setUser} />;
    }
    
    // Intercept to force parent login creation for students
    if (user.role === 'student' && user.needsParentLogin) {
      return <ForceParentCreation user={user} onComplete={setUser} />;
    }
    
    return children;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('tt_theme') || 'dark');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tt_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const addToast = (type, title, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Global Cmd+K shortcut is wired in individual dashboards
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ToastContext.Provider value={{ addToast }}>
        <Router>
          {theme === 'dark' && <StarfieldCanvas />}
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/mentor/*" element={
              <ProtectedRoute allowedRoles={['mentor']}>
                <MentorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/hod/*" element={
              <ProtectedRoute allowedRoles={['hod']}>
                <HODDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/superadmin/*" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/parent/*" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </Router>
      </ToastContext.Provider>
    </ThemeContext.Provider>
  );
}
