import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { forwardPublicAdminAuth } from './public-auth-proxy';

const request = (body: unknown) => new NextRequest('https://admin.test/api/tickets-auth/reset-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
test('public admin recovery proxy rejects non-objects and invalid token shapes without calling upstream', async () => {
  assert.equal((await forwardPublicAdminAuth(request(null), 'reset-password')).status, 400);
  assert.equal((await forwardPublicAdminAuth(request({ token: 'raw-token', newPassword: 'password123' }), 'reset-password')).status, 400);
});
test('single-use action forwards only allowed fields with no cache and never returns the bearer token', async () => {
  const originalFetch = global.fetch;
  const originalBase = process.env.TICKETS_API_BASE_URL;
  process.env.TICKETS_API_BASE_URL = 'https://api.test/api';
  let destination = ''; let payload: RequestInit | undefined;
  global.fetch = (async (url: unknown, options: RequestInit) => { destination = String(url); payload = options; return new Response(null, { status: 204 }); }) as typeof fetch;
  try {
    const token = 'a'.repeat(64);
    const response = await forwardPublicAdminAuth(request({ token, newPassword: 'password123', canManageAdmins: true }), 'accept-invitation');
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(destination, 'https://api.test/api/admin/auth/accept-invitation');
    assert.equal(payload?.body, JSON.stringify({ token, newPassword: 'password123' }));
    assert.equal(payload?.cache, 'no-store');
    assert.ok(payload?.signal);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  } finally { global.fetch = originalFetch; if (originalBase === undefined) delete process.env.TICKETS_API_BASE_URL; else process.env.TICKETS_API_BASE_URL = originalBase; }
});
test('transport failures become a controlled JSON response without provider or token leakage', async () => {
  const originalFetch = global.fetch; const originalBase = process.env.TICKETS_API_BASE_URL;
  process.env.TICKETS_API_BASE_URL = 'https://api.test/api';
  global.fetch = async () => { throw new Error('upstream error containing PRIVATE_TOKEN'); };
  try {
    const response = await forwardPublicAdminAuth(request({ token: 'a'.repeat(64), newPassword: 'password123' }), 'reset-password');
    assert.equal(response.status, 502);
    const body = await response.text();
    assert.doesNotMatch(body, /PRIVATE_TOKEN/);
    assert.match(body, /Try signing in/);
  } finally { global.fetch = originalFetch; if (originalBase === undefined) delete process.env.TICKETS_API_BASE_URL; else process.env.TICKETS_API_BASE_URL = originalBase; }
});
