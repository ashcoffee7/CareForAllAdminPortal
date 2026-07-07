import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.generated';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Frontend client is now used for supabase.auth.* (sign-in/out, session)
// and the service_logs Realtime subscription only -- every table read/
// write goes through src/lib/apiClient.ts instead. Still typed with
// Database so any stray `.from()` call would be caught by the typechecker.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
