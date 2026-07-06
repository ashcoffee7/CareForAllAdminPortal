import { Outlet, redirect } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthProvider } from './AuthContext';
import { Sidebar } from '../components/Sidebar';

// Direct replacement for the old main.js's DOMContentLoaded gate:
// `await supabase.auth.getSession()` before any page-level query fires,
// since Supabase restores a persisted session from localStorage
// asynchronously and firing queries before that resolves sends them out
// unauthenticated -- RLS silently treats that as "no rows", not an error.
// A loader on this shared parent route blocks every child page's render
// (and therefore every child's own data-fetching hook) until this resolves.
export async function protectedLoader() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect('/login');
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
