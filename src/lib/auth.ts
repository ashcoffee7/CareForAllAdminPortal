import { supabase } from './supabase';
import { api, apiOrToast } from './apiClient';

export interface CurrentAdmin {
  fullName: string;
  initial: string;
  role: string;
}

// supabase.auth.* stays a direct client call -- session/token management
// is what the Supabase client is for. The profile lookup itself now goes
// through the API (GET /api/profiles/me) instead of a direct
// `.from('profiles')` query, like every other read in the app.
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

  const result = await apiOrToast(
    api.get<{ data: { first_name: string | null; last_name: string | null; role: string } }>('/profiles/me'),
    'Loading your profile',
    null
  );
  if (!result) { return null; }

  const profile = result.data;
  const fullName = ((profile.first_name || '') + ' ' + (profile.last_name || '')).trim();
  const initial = (profile.first_name || 'A').charAt(0).toUpperCase();

  return { fullName, initial, role: profile.role };
}
