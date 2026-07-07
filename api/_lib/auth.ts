import type { VercelRequest } from '@vercel/node';
import type { User } from '@supabase/supabase-js';
import { supabaseForToken } from './supabaseServer.js';

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

// The custom_access_token_hook migration (see
// supabase/migrations/20260707000000_custom_access_token_hook.sql) injects
// profiles.role into every JWT as `user_role` at issuance time. Reading it
// here is just decoding the payload of a token supabase.auth.getUser()
// already verified -- no extra query, no extra round trip. Named
// `user_role` rather than the reserved `role` claim PostgREST uses for
// RLS (authenticated/anon/service_role).
function decodeUserRoleClaim(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    const claims = JSON.parse(json) as { user_role?: unknown };
    return typeof claims.user_role === 'string' ? claims.user_role : null;
  } catch {
    return null;
  }
}

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

  return { user: data.user as User, supabase, role: decodeUserRoleClaim(token) };
}

export type RequestContext = Awaited<ReturnType<typeof requireUser>>;

// Everything except /api/profiles/me goes through this instead of
// requireUser directly -- being a valid Supabase Auth session only proves
// someone signed in, not that they're staff. Without this check, any
// authenticated user (a regular member, a mentor, anyone with valid
// login credentials to this Supabase project) could reach the full admin
// API. profiles/me stays on requireUser alone since the frontend needs it
// to determine whether the signed-in account is admin in the first place.
//
// This reads ctx.role (from the JWT claim) rather than querying
// `profiles` -- if the custom access token hook isn't enabled yet, or the
// caller's token predates it, role comes back null and this fails closed
// (403), not open.
export async function requireAdmin(req: VercelRequest): Promise<RequestContext> {
  const ctx = await requireUser(req);

  if (ctx.role !== 'admin') {
    throw new ForbiddenError('This account does not have admin access.');
  }

  return ctx;
}
