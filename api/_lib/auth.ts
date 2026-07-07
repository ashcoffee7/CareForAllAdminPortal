import type { VercelRequest } from '@vercel/node';
import type { User } from '@supabase/supabase-js';
import { supabaseForToken } from './supabaseServer.js';

export class UnauthorizedError extends Error {}

// Every endpoint calls this first. It both verifies the bearer token and
// hands back a Supabase client already scoped to that user, so handlers
// never touch a client that isn't tied to the request's own caller.
export async function requireUser(req: VercelRequest) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    throw new UnauthorizedError('Missing bearer token');
  }

  const supabase = supabaseForToken(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new UnauthorizedError('Invalid or expired session');
  }

  return { user: data.user as User, supabase };
}

export type RequestContext = Awaited<ReturnType<typeof requireUser>>;
