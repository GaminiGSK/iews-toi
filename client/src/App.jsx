import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ChangePassword from './pages/ChangePassword';
import CompanyProfile from './pages/CompanyProfile';
import PrivateRoute from './components/PrivateRoute';
import AIAssistant from './components/AIAssistant';
import LiveTaxWorkspace from './pages/LiveTaxWorkspace';

import SiteGate from './components/SiteGate';

const AppLayout = ({ children }) => {
  const location = useLocation();
  // Don't show AI on login page
  const showAI = location.pathname !== '/login';

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

            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<CompanyProfile />} />

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
