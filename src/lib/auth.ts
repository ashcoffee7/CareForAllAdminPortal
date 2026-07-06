import { supabase } from './supabase';

export interface CurrentAdmin {
  fullName: string;
  initial: string;
  role: string;
}

// Direct port of the old auth.js's loadCurrentAdmin() data-fetching half --
// the DOM-writing half (sidebar/topbar textContent) is replaced by
// AuthContext handing this back to React state instead.
export async function fetchCurrentAdminProfile(): Promise<CurrentAdmin | null> {
  let user;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (authErr) {
    // No active session yet -- normal until sign-in completes.
    console.warn('No active Supabase session yet:', (authErr as Error).message);
    return null;
  }

  if (!user) { return null; }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error(error);
    return null;
  }

  const fullName = ((profile.first_name || '') + ' ' + (profile.last_name || '')).trim();
  const initial = (profile.first_name || 'A').charAt(0).toUpperCase();

  return { fullName, initial, role: profile.role };
}
