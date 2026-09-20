import { useState, useEffect, Suspense, lazy } from 'react';
import { HelmetProvider } from "react-helmet-async";
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSettings } from './context/SettingsContext.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import LandingPage from './pages/LandingPage.jsx';
import WhatsAppCrmPage from './pages/WhatsAppCrmPage.jsx';
import LeadManagementPage from './pages/LeadManagementPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

// Legal pages — small, keep eager
import PrivacyPolicy from './components/landing/PrivacyPolicy.jsx';
import TermsAndConditions from './components/landing/TermsAndConditions.jsx';
import DataDeletionRequest from './components/landing/DataDeletionRequest.jsx';
import RefundPolicy from './components/landing/RefundPolicy.jsx';

// Dashboard pages — lazy loaded, only fetched once user logs in
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ResourcePage = lazy(() => import('./pages/ResourcePage.jsx'));
const ThemeSettings = lazy(() => import('./pages/ThemeSettings.jsx'));
const GeneralSettings = lazy(() => import('./pages/GeneralSettings.jsx'));
const RolePermissionsPage = lazy(() => import('./pages/RolePermissionsPage.jsx'));
const UsersManagementPage = lazy(() => import('./pages/UsersManagementPage.jsx'));
const ProjectsManagementPage = lazy(() => import('./pages/ProjectsManagementPage.jsx'));
const ProjectDetailsPage = lazy(() => import('./pages/ProjectDetailsPage.jsx'));
const ProjectFormPage = lazy(() => import('./pages/ProjectFormPage.jsx'));
const TaskManagementPage = lazy(() => import('./pages/TaskManagementPage.jsx'));
const VaultManagementPage = lazy(() => import('./pages/VaultManagementPage.jsx'));
const StorageManagementPage = lazy(() => import('./pages/StorageManagementPage.jsx'));
const LeadsManagementPage = lazy(() => import('./pages/LeadsManagementPage.jsx'));
const WhatsAppInboxPage = lazy(() => import('./pages/WhatsAppInboxPage.jsx'));
const WhatsAppCampaignPage = lazy(() => import('./pages/WhatsAppCampaignPage.jsx'));
const SupportTicketsPage = lazy(() => import('./pages/SupportTicketsPage.jsx'));
const LeadDistributionPage = lazy(() => import('./pages/LeadDistributionPage.jsx'));
const IntegrationsPage = lazy(() => import('./pages/IntegrationsPage.jsx'));
const WorkReportsPage = lazy(() => import('./pages/WorkReportsPage.jsx'));
const AccessoriesManagementPage = lazy(() => import('./pages/AccessoriesManagementPage.jsx'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard.jsx'));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function RouteLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
    </div>
  );
}

export default function App({ helmetContext } = {}) {
  const { settings } = useSettings();
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    const publicPaths = [
      '/',
      '/login',
      '/whatsapp-crm',
      '/lead-management',
      '/pricing',
      '/contact',
      '/privacy-policy',
      '/terms-and-conditions',
      '/data-deletion-request',
      '/refund-policy',
    ];
    if (publicPaths.includes(window.location.pathname)) return false;
    return settings?.theme?.splashEnabled ?? true;
  });
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
      fontFamily: settings?.theme?.fontFamily || 'Inter, system-ui, sans-serif',
    };

    return (
      
      <div
        style={bgStyle}
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white transition-opacity duration-300 ${
          fadeSplash ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center space-y-6 max-w-sm px-6 text-center">
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

          <div className="space-y-2 animate-splash-slide-up">
            <h2 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
              {settings?.brand?.name || 'Appnix CRM Pro'}
            </h2>
            <p className="text-sm font-semibold text-slate-400">{splashText}</p>
          </div>

          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div
              style={{
                backgroundColor: settings?.theme?.primaryColor || '#2563eb',
                animationDuration: `${splashDuration}ms`,
              }}
              className="absolute left-0 top-0 bottom-0 rounded-full bg-primary animate-splash-progress w-full origin-left"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <HelmetProvider context={helmetContext}>
    <>
      {renderSplashScreen()}
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Public SEO Feature & Commercial Pages */}
          <Route path="/whatsapp-crm" element={<WhatsAppCrmPage />} />
          <Route path="/lead-management" element={<LeadManagementPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Legal pages — top-level, standalone */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/data-deletion-request" element={<DataDeletionRequest />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />

          {/* Admin Layout & Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<ProtectedRoute permission="dashboard:read"><Dashboard /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute permission="users:read"><UsersManagementPage /></ProtectedRoute>} />
            <Route path="/catalog" element={<ProtectedRoute permission="catalog:read"><ProjectsManagementPage /></ProtectedRoute>} />
            <Route path="/catalog/create" element={<ProtectedRoute permission="catalog:update"><ProjectFormPage /></ProtectedRoute>} />
            <Route path="/catalog/edit/:id" element={<ProtectedRoute permission="catalog:update"><ProjectFormPage /></ProtectedRoute>} />
            <Route path="/catalog/:id" element={<ProtectedRoute permission="catalog:read"><ProjectDetailsPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute permission="orders:read"><ResourcePage title="Orders / Leads" endpoint="/orders" /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute permission="leads:read"><LeadsManagementPage /></ProtectedRoute>} />
            <Route path="/leads/distribution" element={<ProtectedRoute permission="leads:update"><LeadDistributionPage /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute permission="tasks:read"><TaskManagementPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute permission="payments:read"><TaskManagementPage /></ProtectedRoute>} />
            <Route path="/vault" element={<ProtectedRoute permission="vault:read"><VaultManagementPage /></ProtectedRoute>} />
            <Route path="/storage" element={<ProtectedRoute permission="storage:read"><StorageManagementPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute permission="invoices:read"><ResourcePage title="Invoices" endpoint="/invoices" /></ProtectedRoute>} />
            <Route path="/enquiries" element={<ProtectedRoute permission="enquiries:read"><ResourcePage title="Contact Enquiries" endpoint="/enquiries" /></ProtectedRoute>} />
            <Route path="/banners" element={<ProtectedRoute permission="banners:read"><ResourcePage title="Banner / Slider Management" endpoint="/banners" /></ProtectedRoute>} />
            <Route path="/coupons" element={<ProtectedRoute permission="coupons:read"><ResourcePage title="Coupon / Offer Management" endpoint="/coupons" /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute permission="reports:read"><WorkReportsPage /></ProtectedRoute>} />
            <Route path="/Integrations" element={<ProtectedRoute permission="settings:update|whatsapp_integration:read"><IntegrationsPage /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute permission="settings:update|whatsapp_integration:read"><IntegrationsPage /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute permission="settings:update"><GeneralSettings section="content" title="Website Content Management" /></ProtectedRoute>} />
            <Route path="/theme" element={<ProtectedRoute permission="settings:update"><ThemeSettings /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute permission="settings:update"><GeneralSettings section="general" title="General Settings" /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute permission="support:read"><SupportTicketsPage /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute permission="roles:read"><RolePermissionsPage /></ProtectedRoute>} />
            <Route path="/whatsapp-inbox" element={<ProtectedRoute permission="whatsapp:read"><WhatsAppInboxPage /></ProtectedRoute>} />
            <Route path="/whatsapp-campaign" element={<ProtectedRoute permission="whatsapp:read"><WhatsAppCampaignPage /></ProtectedRoute>} />
            <Route path="/accessories" element={<ProtectedRoute permission="accessories:read"><AccessoriesManagementPage /></ProtectedRoute>} />
            <Route path="/super-admin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/forbidden" element={<ForbiddenPage />} />

            {/* Compatibility aliases if accessed under /dashboard/* */}
            <Route path="/dashboard/dashboard" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard/users" element={<Navigate to="/users" replace />} />
            <Route path="/dashboard/catalog" element={<Navigate to="/catalog" replace />} />
            <Route path="/dashboard/leads" element={<Navigate to="/leads" replace />} />
            <Route path="/dashboard/tasks" element={<Navigate to="/tasks" replace />} />
            <Route path="/dashboard/settings" element={<Navigate to="/settings" replace />} />
            <Route path="/dashboard/reports" element={<Navigate to="/reports" replace />} />
            <Route path="/dashboard/theme" element={<Navigate to="/theme" replace />} />
            <Route path="/dashboard/roles" element={<Navigate to="/roles" replace />} />
            <Route path="/dashboard/support" element={<Navigate to="/support" replace />} />
          </Route>

          {/* Catch-all: render 404 page for unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
    </HelmetProvider>
  );
}