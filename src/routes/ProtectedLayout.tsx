import { Outlet, redirect } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchCurrentAdminProfile } from '../lib/auth';
import { AuthProvider } from './AuthContext';
import { Sidebar } from '../components/Sidebar';

// Direct replacement for the old main.js's DOMContentLoaded gate:
// `await supabase.auth.getSession()` before any page-level query fires,
// since Supabase restores a persisted session from localStorage
// asynchronously and firing queries before that resolves sends them out
// unauthenticated -- RLS silently treats that as "no rows", not an error.
// A loader on this shared parent route blocks every child page's render
// (and therefore every child's own data-fetching hook) until this resolves.
//
// A valid session only proves someone signed in, not that they're staff --
// every /api endpoint besides profiles/me already enforces
// profiles.role === 'admin' server-side (see api/_lib/auth.ts's
// requireAdmin), but without this check here a non-admin would still get
// past the login screen and sit on a dashboard where every request just
// 403s. Checking here and signing them back out is a better experience,
// not a stronger security boundary -- the API-side check is what actually
// protects the data.
export async function protectedLoader() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect('/login');
  }

  const admin = await fetchCurrentAdminProfile();
  if (!admin || admin.role !== 'admin') {
    await supabase.auth.signOut();
    throw redirect('/login?denied=1');
  }

  return { session: data.session };
}

export function ProtectedLayout() {
  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg">
          <div className="p-[30px] max-portal:p-4 flex flex-col gap-[22px] max-w-[1100px]">
            <Outlet />
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
