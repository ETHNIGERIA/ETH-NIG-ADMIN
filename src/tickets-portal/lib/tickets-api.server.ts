import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { TICKETS_LOGIN_PATH, TICKETS_SESSION_COOKIE } from '@/tickets-portal/auth/constants';
import { getTicketsApiBaseUrl } from '@/tickets-portal/auth/server-config';
import { isTimeoutError } from '@/tickets-portal/lib/api-errors';

const FETCH_TIMEOUT_MS = 12_000;

type NestEnvelope<T> = {
  success: boolean;
  data?: T;
  timestamp?: string;
};

async function readAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(TICKETS_SESSION_COOKIE)?.value ?? null;
}

function throwFromErrorBody(rawJson: unknown, status: number): never {
  const body = rawJson as Record<string, unknown>;
  const errObj = body.error as { message?: string | string[] } | undefined;
  const rawErr = errObj?.message;
  const fromErr = Array.isArray(rawErr) ? rawErr.join(', ') : rawErr;
  const topMsg = typeof body.message === 'string' ? body.message : undefined;
  const msg = fromErr || topMsg || `Request failed (${status})`;
  throw new Error(msg);
}

function unwrapEnvelope<T>(rawJson: unknown): T {
  const envelope = rawJson as NestEnvelope<T>;
  if (!envelope.success || envelope.data === undefined) {
    throw new Error('Unexpected response from tickets API');
  }
  return envelope.data;
}

async function authFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await readAccessToken();
  if (!token) {
    redirect(TICKETS_LOGIN_PATH);
  }
  const base = getTicketsApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...init.headers,
      },
      cache: 'no-store',
    });
  } catch (e) {
    if (isTimeoutError(e)) {
      throw new Error('Tickets API timed out. Try again.');
    }
    throw e instanceof Error ? e : new Error('Could not reach tickets API.');
  }
}

/**
 * Authenticated GET to the ticketing API. Server-only.
 */
export async function ticketsApiGet<T>(path: string): Promise<T> {
  const res = await authFetch(path, { method: 'GET' });

  if (res.status === 401) {
    redirect(TICKETS_LOGIN_PATH);
  }

  const rawJson: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    throwFromErrorBody(rawJson, res.status);
  }

  return unwrapEnvelope<T>(rawJson);
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Unauthenticated GET. Use for public event/partner/sponsor routes,
 * including a second host such as ETH Nigeria.
 */
export async function ticketsPublicGet<T>(path: string, baseUrl?: string): Promise<T> {
  const url = joinUrl(baseUrl ?? getTicketsApiBaseUrl(), path);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    if (isTimeoutError(e)) {
      throw new Error('Tickets API timed out. Try again.');
    }
    throw e instanceof Error ? e : new Error('Could not reach tickets API.');
  }

  const rawJson: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throwFromErrorBody(rawJson, res.status);
  }
  return unwrapEnvelope<T>(rawJson);
}

/**
 * Authenticated POST with JSON body. Server-only.
 */
export async function ticketsApiPost<T, B = unknown>(path: string, body: B): Promise<T> {
  const res = await authFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    redirect(TICKETS_LOGIN_PATH);
  }

  const rawJson: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    throwFromErrorBody(rawJson, res.status);
  }

  return unwrapEnvelope<T>(rawJson);
}

/**
 * Authenticated PATCH with JSON body. Server-only.
 */
export async function ticketsApiPatch<T, B = unknown>(path: string, body: B): Promise<T> {
  const res = await authFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    redirect(TICKETS_LOGIN_PATH);
  }

  const rawJson: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    throwFromErrorBody(rawJson, res.status);
  }

  return unwrapEnvelope<T>(rawJson);
}

/**
 * Authenticated DELETE. Server-only. Handles 204 No Content.
 */
export async function ticketsApiDelete(path: string): Promise<void> {
  const res = await authFetch(path, { method: 'DELETE' });

  if (res.status === 401) {
    redirect(TICKETS_LOGIN_PATH);
  }

  if (res.status === 204) {
    return;
  }

  const rawJson: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    throwFromErrorBody(rawJson, res.status);
  }
}
