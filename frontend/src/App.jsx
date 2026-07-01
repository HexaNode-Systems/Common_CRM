import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import ResourcePage from './pages/ResourcePage.jsx';
import ThemeSettings from './pages/ThemeSettings.jsx';
import GeneralSettings from './pages/GeneralSettings.jsx';
import RolePermissionsPage from './pages/RolePermissionsPage.jsx';
import UsersManagementPage from './pages/UsersManagementPage.jsx';
import ProjectsManagementPage from './pages/ProjectsManagementPage.jsx';
import TaskManagementPage from './pages/TaskManagementPage.jsx';
import VaultManagementPage from './pages/VaultManagementPage.jsx';
import StorageManagementPage from './pages/StorageManagementPage.jsx';
import LeadsManagementPage from './pages/LeadsManagementPage.jsx';
import WhatsAppSettings from './pages/WhatsAppSettings.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<UsersManagementPage />} />
        <Route path="catalog" element={<ProjectsManagementPage />} />
        <Route path="orders" element={<ResourcePage title="Orders / Leads" endpoint="/orders" />} />
        <Route path="leads" element={<LeadsManagementPage />} />
        <Route path="tasks" element={<TaskManagementPage />} />
        <Route path="payments" element={<TaskManagementPage />} />
        <Route path="vault" element={<VaultManagementPage />} />
        <Route path="storage" element={<StorageManagementPage />} />
        <Route path="invoices" element={<ResourcePage title="Invoices" endpoint="/invoices" />} />
        <Route path="enquiries" element={<ResourcePage title="Contact Enquiries" endpoint="/enquiries" />} />
        <Route path="banners" element={<ResourcePage title="Banner / Slider Management" endpoint="/banners" />} />
        <Route path="coupons" element={<ResourcePage title="Coupon / Offer Management" endpoint="/coupons" />} />
        <Route path="reports" element={<Dashboard title="Reports" />} />
        <Route path="content" element={<GeneralSettings section="content" title="Website Content Management" />} />
        <Route path="theme" element={<ThemeSettings />} />
        <Route path="settings" element={<GeneralSettings section="general" title="General Settings" />} />
        <Route path="roles" element={<RolePermissionsPage />} />
        <Route path="whatsapp" element={<WhatsAppSettings />} />
      </Route>
    </Routes>
  );
}



