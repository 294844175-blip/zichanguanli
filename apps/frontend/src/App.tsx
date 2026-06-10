import { Routes, Route, Navigate } from 'react-router-dom';
import SpaceView from './pages/SpaceView';
import Dashboard from './pages/Dashboard';
import AssetManagement from './pages/AssetManagement';
import CustomerBusiness from './pages/CustomerBusiness';
import Login from './pages/Login';
import SystemLayout from './components/SystemLayout';
import UserManagement from './pages/system/UserManagement';
import RoleManagement from './pages/system/RoleManagement';
import OrgManagement from './pages/system/OrgManagement';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/space-view" element={<ProtectedRoute><SpaceView /></ProtectedRoute>} />
      <Route path="/assets" element={<ProtectedRoute><AssetManagement /></ProtectedRoute>} />
      <Route path="/customer-business" element={<ProtectedRoute><CustomerBusiness /></ProtectedRoute>} />
      <Route path="/system" element={<ProtectedRoute><SystemLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/system/user" replace />} />
        <Route path="user" element={<UserManagement />} />
        <Route path="role" element={<RoleManagement />} />
        <Route path="org" element={<OrgManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
