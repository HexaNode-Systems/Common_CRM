import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { applyTheme } from '../utils/applyTheme.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Public settings: brand, theme, contact, SEO. Integration keys are never part of this.
  async function refreshSettings() {
    const { data } = await api.get('/settings');
    setSettings(data);
    applyTheme(data);
    return data;
  }

  async function updateSettings(payload) {
    const { data } = await api.put('/settings', payload);
    const { integrations, ...publicPart } = data;
    setSettings(publicPart);
    applyTheme(publicPart);
    return data;
  }

  useEffect(() => {
    refreshSettings().catch(() => {}).finally(() => setLoading(false));

    // After sign-in (or sign-out) the company may be different: load its branding again.
    let lastToken = typeof localStorage !== 'undefined' ? localStorage.getItem('crm_token') : null;
    const timer = window.setInterval(() => {
      let token = null;
      try { token = localStorage.getItem('crm_token'); } catch { token = null; }
      if (token !== lastToken) {
        lastToken = token;
        refreshSettings().catch(() => {});
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo(() => ({ settings, loading, refreshSettings, updateSettings }), [settings, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
