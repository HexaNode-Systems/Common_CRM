import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [impersonating, setImpersonating] = useState(
    localStorage.getItem('crm_impersonate_active') === 'true'
  );

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('crm_token');
        localStorage.removeItem('crm_impersonate_active');
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('crm_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_super_token');
    localStorage.removeItem('crm_super_user');
    localStorage.removeItem('crm_impersonate_active');
    setUser(null);
    setImpersonating(false);
  }

  function impersonate(token, tenantUser) {
    const currentToken = localStorage.getItem('crm_token');
    localStorage.setItem('crm_super_token', currentToken);
    localStorage.setItem('crm_super_user', JSON.stringify(user));
    
    localStorage.setItem('crm_token', token);
    localStorage.setItem('crm_impersonate_active', 'true');
    setUser(tenantUser);
    setImpersonating(true);
  }

  function exitImpersonation() {
    const superToken = localStorage.getItem('crm_super_token');
    const superUserStr = localStorage.getItem('crm_super_user');

    if (superToken && superUserStr) {
      localStorage.setItem('crm_token', superToken);
      setUser(JSON.parse(superUserStr));
    } else {
      localStorage.removeItem('crm_token');
      setUser(null);
    }

    localStorage.removeItem('crm_super_token');
    localStorage.removeItem('crm_super_user');
    localStorage.removeItem('crm_impersonate_active');
    setImpersonating(false);
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, setUser, impersonating, impersonate, exitImpersonation }),
    [user, loading, impersonating]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

