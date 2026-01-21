import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ShopCodeEntry from './pages/ShopCodeEntry';
import Customer from './pages/Customer';
import CyberOperator from './pages/CyberOperator';
import CreateShop from './pages/CreateShop';
import OperatorLogin from './pages/OperatorLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import ReportsAnalytics from './pages/ReportsAnalytics';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <div className="bg-app-background text-text-primary font-sans">
        <Routes>
          <Route path="/" element={<ShopCodeEntry />} />
          <Route path="/upload" element={<Customer />} />
          <Route path="/operator" element={<CyberOperator />} />
          <Route path="/operator/login" element={<OperatorLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/operator/create" element={<CreateShop />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reports-analytics" element={<ReportsAnalytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/operator/printer-setup" element={<Navigate to="/settings?tab=printer" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
