import type { VercelResponse } from '@vercel/node';
import { UnauthorizedError } from './auth.js';

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).json(body);
}

// Central error -> HTTP mapping so every endpoint reports failures the
// same way, and the frontend apiClient can rely on a single `{ error }`
// response shape to drive its toast wiring.
export function sendError(res: VercelResponse, err: unknown): void {
  if (err instanceof UnauthorizedError) {
    sendJson(res, 401, { error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected error';
  console.error(err);
  sendJson(res, 500, { error: message });
}

export function methodNotAllowed(res: VercelResponse, allowed: string[]): void {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: `Method not allowed. Use ${allowed.join(', ')}.` });
}

export function badRequest(res: VercelResponse, message: string): void {
  sendJson(res, 400, { error: message });
}
