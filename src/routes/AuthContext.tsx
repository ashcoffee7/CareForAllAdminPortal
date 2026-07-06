import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchCurrentAdminProfile, type CurrentAdmin } from '../lib/auth';

const AuthContext = createContext<CurrentAdmin | null>(null);

// Direct replacement for the old auth.js's loadCurrentAdmin() DOM writes --
// fetched once when the protected shell mounts, then read via useAuth()
// anywhere under it (Sidebar, Topbar) instead of document.getElementById.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCurrentAdminProfile().then((result) => {
      if (!cancelled) { setAdmin(result); }
    });
    return () => { cancelled = true; };
  }, []);

  return <AuthContext.Provider value={admin}>{children}</AuthContext.Provider>;
}

export function useAuth(): CurrentAdmin | null {
  return useContext(AuthContext);
}
