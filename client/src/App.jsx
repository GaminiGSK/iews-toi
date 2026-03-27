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

import axios from 'axios';
import SiteGate from './components/SiteGate';

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

            <Route path="/superadmin" element={<SuperadminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
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
