import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database.generated.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

// One client per request, built with the anon key and the caller's own
// JWT forwarded as the Authorization header -- not a shared service-role
// client. That keeps every API request subject to the exact same RLS
// policies (and the auth.uid()-based review-audit trigger) as when the
// frontend called Supabase directly. This layer adds a CRUD/API boundary
// without silently widening what a request is allowed to touch.
export function supabaseForToken(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
