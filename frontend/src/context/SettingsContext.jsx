import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { applyTheme } from '../utils/applyTheme.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshSettings() {
    const { data } = await api.get('/settings');
    setSettings(data);
    applyTheme(data);
    return data;
  }

  async function updateSettings(payload) {
    const { data } = await api.put('/settings', payload);
    setSettings(data);
    applyTheme(data);
    return data;
  }

  useEffect(() => {
    refreshSettings().finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ settings, loading, refreshSettings, updateSettings }), [settings, loading]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

