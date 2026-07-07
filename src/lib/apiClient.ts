import { toast } from 'sonner';
import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
      ...init?.headers,
    },
  });

  if (res.status === 204) { return undefined as T; }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (body && typeof body.error === 'string') ? body.error : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

// Every page hook talks to Supabase through these instead of importing the
// supabase client directly -- the browser no longer holds a table-level
// Supabase client at all, only the auth session used to mint the bearer
// token these calls attach.
export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Shared error -> toast path, so every hook surfaces failures the same
// way instead of some going to a silent console.error and others to a
// blocking alert(). `fallback` is what the caller's state gets set to so
// the UI still renders something sane (an empty list, a zeroed stat) when
// a request fails.
export async function apiOrToast<T>(promise: Promise<T>, actionLabel: string, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Check your connection and try again.';
    console.error(`${actionLabel} failed:`, err);
    toast.error(actionLabel, { description: message });
    return fallback;
  }
}

// For mutations where there's no sane fallback value to render -- reports
// the same way, and lets the caller know via the boolean whether to
// proceed (e.g. reload the list) or bail out.
export async function mutateOrToast(promise: Promise<unknown>, actionLabel: string): Promise<boolean> {
  try {
    await promise;
    return true;
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Check your connection and try again.';
    console.error(`${actionLabel} failed:`, err);
    toast.error(actionLabel, { description: message });
    return false;
  }
}
