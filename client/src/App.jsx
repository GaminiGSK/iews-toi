import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SuperadminDashboard from './pages/SuperadminDashboard';
import ChangePassword from './pages/ChangePassword';
import CompanyProfile from './pages/CompanyProfileNew';
import PrivateRoute from './components/PrivateRoute';
import AIAssistant from './components/AIAssistant';
import LiveTaxWorkspace from './pages/LiveTaxWorkspace';
import TaxFormWorkbench from './pages/TaxFormWorkbench';
import { Component } from 'react';

import axios from 'axios';
import SiteGate from './components/SiteGate';

// Simple Error Boundary for admin routes
class AdminErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, background: '#0f172a', minHeight: '100vh', color: '#f87171', fontFamily: 'monospace' }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>⚠ Dashboard Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#94a3b8' }}>{this.state.error?.message}</pre>
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{ marginTop: 24, padding: '10px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Back to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Admin Auth Guard
const AdminGuard = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const allowed = requiredRole === 'superadmin'
      ? user.role === 'superadmin'
      : ['admin', 'superadmin'].includes(user.role);
    if (!allowed) return <Navigate to="/dashboard" replace />;
  } catch (e) { return <Navigate to="/login" replace />; }
  return children;
};

// GLOBAL AXIOS INTERCEPTOR FOR ADMIN / SUPERADMIN SPOOFING
axios.interceptors.request.use(config => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'admin' || user.role === 'superadmin') {
        const lastSelectedBR = localStorage.getItem('lastSelectedBR');
        if (lastSelectedBR) {
          config.headers['x-target-user'] = lastSelectedBR;
        }
      }
    } catch (e) { }
  }
  return config;
});

const AppLayout = ({ children }) => {
  const location = useLocation();
  // Only show AI assistant for unit users on working pages (not admin/superadmin management pages)
  const isAdminRoute = location.pathname === '/admin' || location.pathname === '/superadmin' || location.pathname === '/login';
  const showAI = !isAdminRoute;

  return (
    <>
      {children}
      {showAI && <AIAssistant />}
    </>
  );
};

function App() {
  return (
    <Router>
      <SiteGate>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/superadmin" element={
              <AdminGuard requiredRole="superadmin">
                <AdminErrorBoundary>
                  <SuperadminDashboard />
                </AdminErrorBoundary>
              </AdminGuard>
            } />
            <Route path="/admin" element={
              <AdminGuard requiredRole="admin">
                <AdminErrorBoundary>
                  <AdminDashboard />
                </AdminErrorBoundary>
              </AdminGuard>
            } />
            <Route path="/dashboard" element={<CompanyProfile />} />
            <Route path="/workbench" element={<TaxFormWorkbench />} />

            <Route element={<PrivateRoute />}>
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/tax-live" element={<LiveTaxWorkspace />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </SiteGate>
    </Router>
  );
}

export default App;
