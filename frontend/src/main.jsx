import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './styles/index.css';

const rootElement = document.getElementById('root');
const publicPaths = ['/', '/login', '/privacy-policy', '/terms-and-conditions', '/data-deletion-request', '/refund-policy'];
const isPublicRoute = publicPaths.includes(window.location.pathname);

const app = (
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

if (isPublicRoute && rootElement.hasChildNodes()) {
  ReactDOM.hydrateRoot(rootElement, app);
} else {
  ReactDOM.createRoot(rootElement).render(app);
}

