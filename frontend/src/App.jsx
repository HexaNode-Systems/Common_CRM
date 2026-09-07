import { useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSettings } from './context/SettingsContext.jsx';
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
import ProjectDetailsPage from './pages/ProjectDetailsPage.jsx';
import ProjectFormPage from './pages/ProjectFormPage.jsx';
import TaskManagementPage from './pages/TaskManagementPage.jsx';
import VaultManagementPage from './pages/VaultManagementPage.jsx';
import StorageManagementPage from './pages/StorageManagementPage.jsx';
import LeadsManagementPage from './pages/LeadsManagementPage.jsx';
import WhatsAppInboxPage from './pages/WhatsAppInboxPage.jsx';
import WhatsAppCampaignPage from './pages/WhatsAppCampaignPage.jsx';
import SupportTicketsPage from './pages/SupportTicketsPage.jsx';
import LeadDistributionPage from './pages/LeadDistributionPage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import WorkReportsPage from './pages/WorkReportsPage.jsx';
import AccessoriesManagementPage from './pages/AccessoriesManagementPage.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';
import LandingPage from './pages/LandingPage.jsx';

export default function App() {
  const { settings } = useSettings();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  const splashEnabled = settings?.theme?.splashEnabled ?? true;
  const splashText = settings?.theme?.splashText || 'Loading Premium CRM...';
  const splashDuration = Number(settings?.theme?.splashDuration || 2000);
  const splashLogo = settings?.theme?.splashLogo || settings?.brand?.logo;
  const splashBgStyle = settings?.theme?.splashBgStyle || 'gradient';

  useEffect(() => {
    if (!splashEnabled) {
      setShowSplash(false);
      return;
    }

    // Start fade out slightly before duration ends
    const fadeTimer = setTimeout(() => {
      setFadeSplash(true);
    }, Math.max(splashDuration - 300, 100));

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, splashDuration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [splashEnabled, splashDuration]);

  const getSplashBg = () => {
    if (splashBgStyle === 'primary') return settings?.theme?.primaryColor || '#2563eb';
    if (splashBgStyle === 'secondary') return settings?.theme?.secondaryColor || '#0f172a';
    return 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e293b 100%)';
  };

  const renderSplashScreen = () => {
    if (!showSplash || !splashEnabled) return null;

    const bgStyle = {
      background: getSplashBg(),
      fontFamily: settings?.theme?.fontFamily || 'Inter, system-ui, sans-serif'
    };

    return (
      <div 
        style={bgStyle}
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white transition-opacity duration-300 ${
          fadeSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center space-y-6 max-w-sm px-6 text-center">
          {/* Logo container */}
          <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 p-2 shadow-2xl animate-splash-pulse">
            {splashLogo ? (
              <img src={splashLogo} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <div 
                style={{ backgroundColor: settings?.theme?.primaryColor || '#2563eb' }}
                className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-white"
              >
                {String(settings?.brand?.name || 'CRM').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Text message */}
          <div className="space-y-2 animate-splash-slide-up">
            <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
              {settings?.brand?.name || 'Common CRM'}
            </h2>
            <p className="text-sm font-semibold text-slate-400">
              {splashText}
            </p>
          </div>

          {/* Progress / Loading bar */}
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div 
              style={{ 
                backgroundColor: settings?.theme?.primaryColor || '#2563eb',
                animationDuration: `${splashDuration}ms`
              }} 
              className="absolute left-0 top-0 bottom-0 rounded-full bg-primary animate-splash-progress w-full origin-left"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* {renderSplashScreen()}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        > */}{renderSplashScreen()}
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<ProtectedRoute permission="dashboard:read"><Dashboard /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute permission="users:read"><UsersManagementPage /></ProtectedRoute>} />
          <Route path="catalog" element={<ProtectedRoute permission="catalog:read"><ProjectsManagementPage /></ProtectedRoute>} />
          <Route path="catalog/create" element={<ProtectedRoute permission="catalog:update"><ProjectFormPage /></ProtectedRoute>} />
          <Route path="catalog/edit/:id" element={<ProtectedRoute permission="catalog:update"><ProjectFormPage /></ProtectedRoute>} />
          <Route path="catalog/:id" element={<ProtectedRoute permission="catalog:read"><ProjectDetailsPage /></ProtectedRoute>} />
          <Route path="orders" element={<ProtectedRoute permission="orders:read"><ResourcePage title="Orders / Leads" endpoint="/orders" /></ProtectedRoute>} />
          <Route path="leads" element={<ProtectedRoute permission="leads:read"><LeadsManagementPage /></ProtectedRoute>} />
          <Route path="leads/distribution" element={<ProtectedRoute permission="leads:update"><LeadDistributionPage /></ProtectedRoute>} />
          <Route path="tasks" element={<ProtectedRoute permission="tasks:read"><TaskManagementPage /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute permission="payments:read"><TaskManagementPage /></ProtectedRoute>} />
          <Route path="vault" element={<ProtectedRoute permission="vault:read"><VaultManagementPage /></ProtectedRoute>} />
          <Route path="storage" element={<ProtectedRoute permission="storage:read"><StorageManagementPage /></ProtectedRoute>} />
          <Route path="invoices" element={<ProtectedRoute permission="invoices:read"><ResourcePage title="Invoices" endpoint="/invoices" /></ProtectedRoute>} />
          <Route path="enquiries" element={<ProtectedRoute permission="enquiries:read"><ResourcePage title="Contact Enquiries" endpoint="/enquiries" /></ProtectedRoute>} />
          <Route path="banners" element={<ProtectedRoute permission="banners:read"><ResourcePage title="Banner / Slider Management" endpoint="/banners" /></ProtectedRoute>} />
          <Route path="coupons" element={<ProtectedRoute permission="coupons:read"><ResourcePage title="Coupon / Offer Management" endpoint="/coupons" /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute permission="reports:read"><WorkReportsPage /></ProtectedRoute>} />
          <Route path="Integrations" element={<ProtectedRoute permission="settings:update|whatsapp_integration:read"><IntegrationsPage /></ProtectedRoute>} />
          <Route path="integrations" element={<ProtectedRoute permission="settings:update|whatsapp_integration:read"><IntegrationsPage /></ProtectedRoute>} />
          <Route path="content" element={<ProtectedRoute permission="settings:update"><GeneralSettings section="content" title="Website Content Management" /></ProtectedRoute>} />
          <Route path="theme" element={<ProtectedRoute permission="settings:update"><ThemeSettings /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute permission="settings:update"><GeneralSettings section="general" title="General Settings" /></ProtectedRoute>} />
          <Route path="support" element={<ProtectedRoute permission="support:read"><SupportTicketsPage /></ProtectedRoute>} />
          <Route path="roles" element={<ProtectedRoute permission="roles:read"><RolePermissionsPage /></ProtectedRoute>} />
          <Route path="whatsapp-inbox" element={<ProtectedRoute permission="whatsapp:read"><WhatsAppInboxPage /></ProtectedRoute>} />
          <Route path="whatsapp-campaign" element={<ProtectedRoute permission="whatsapp:read"><WhatsAppCampaignPage /></ProtectedRoute>} />
          <Route path="accessories" element={<ProtectedRoute permission="accessories:read"><AccessoriesManagementPage /></ProtectedRoute>} />
          <Route path="super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="forbidden" element={<ForbiddenPage />} />
          
        </Route>
      </Routes>
    </>
  );
}



