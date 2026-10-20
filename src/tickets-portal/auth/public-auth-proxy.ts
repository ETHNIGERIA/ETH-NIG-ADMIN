import { NextRequest, NextResponse } from 'next/server';
import { getTicketsApiBaseUrl } from './server-config';

const privateHeaders = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' };
const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status, headers: privateHeaders });

/** Only known public auth actions may be forwarded; credentials never reach JSON responses/logs. */
export async function forwardPublicAdminAuth(req: NextRequest, action: 'forgot-password' | 'reset-password' | 'accept-invitation') {
  let body: Record<string, unknown>;
  try {
    const input: unknown = await req.json();
    if (!input || typeof input !== 'object' || Array.isArray(input)) return errorResponse('Invalid JSON object', 400);
    body = input as Record<string, unknown>;
  } catch { return errorResponse('Invalid JSON', 400); }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';
  if (action === 'forgot-password' ? !email : !/^[a-f0-9]{64}$/.test(token) || !newPassword) {
    return errorResponse(action === 'forgot-password' ? 'Email is required' : 'A valid link and new password are required', 400);
  }
  let baseUrl: string;
  try { baseUrl = getTicketsApiBaseUrl(); }
  catch { return errorResponse('The administrator service is not configured', 503); }
  try {
    const response = await fetch(`${baseUrl}/admin/auth/${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action === 'forgot-password' ? { email } : { token, newPassword }),
      cache: 'no-store', signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const json = await response.json().catch(() => ({})) as { error?: { message?: string | string[] }; message?: string | string[] };
      const message = json.error?.message ?? json.message ?? 'The request could not be completed';
      return errorResponse(Array.isArray(message) ? message.join(', ') : String(message), response.status);
    }
    return new NextResponse(null, { status: 204, headers: privateHeaders });
  } catch {
    return errorResponse(action === 'forgot-password' ? 'Unable to confirm the request. Please try again.' : 'Unable to confirm the request. Try signing in with your new password, or ask for a fresh link.', 502);
  }
}
