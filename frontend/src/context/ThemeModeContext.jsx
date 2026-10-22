import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Dark / light mode for the admin panel. The choice is kept in localStorage.
// Colours for both modes live in styles/admin.css; admin-bridge.css maps older page markup onto them.

const STORAGE_KEY = 'ax-admin-mode';
const ThemeModeContext = createContext({ mode: 'light', toggleMode: () => {} });

function readStoredMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* storage blocked: use the default */
  }
  return 'light';
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(readStoredMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const toggleMode = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), []);
  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export const useThemeMode = () => useContext(ThemeModeContext);
