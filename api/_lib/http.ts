import type { VercelResponse } from '@vercel/node';
import { UnauthorizedError } from './auth.js';

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) { return err.message; }
  // supabase-js/PostgREST errors are plain objects ({ message, details,
  // hint, code }), not real Error instances -- without this branch every
  // real query failure collapsed into a useless generic "Unexpected
  // error" for both the toast and the logs.
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Unexpected error';
}

// Central error -> HTTP mapping so every endpoint reports failures the
// same way, and the frontend apiClient can rely on a single `{ error }`
// response shape to drive its toast wiring.
export function sendError(res: VercelResponse, err: unknown): void {
  if (err instanceof UnauthorizedError) {
    sendJson(res, 401, { error: err.message });
    return;
  }
  console.error(err);
  sendJson(res, 500, { error: extractMessage(err) });
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]): void {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: `Method not allowed. Use ${allowed.join(', ')}.` });
}

export function badRequest(res: VercelResponse, message: string): void {
  sendJson(res, 400, { error: message });
}
