import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ChangePassword from './pages/ChangePassword';
import CompanyProfile from './pages/CompanyProfile';
import PrivateRoute from './components/PrivateRoute';

import SiteGate from './components/SiteGate';

function App() {
  return (
    <Router>
      <SiteGate>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<CompanyProfile />} />

          <Route element={<PrivateRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SiteGate>
    </Router>
  );
}

export default App;
