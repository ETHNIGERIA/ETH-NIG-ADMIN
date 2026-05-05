/**
 * Server-only: base URL for the ticketsethng Nest API.
 * Never use NEXT_PUBLIC_* for credentials or API URLs here.
 */
export function getTicketsApiBaseUrl(): string {
  const raw = process.env.TICKETS_API_BASE_URL?.trim();
  if (!raw) {
    throw new Error('TICKETS_API_BASE_URL is not set');
  }
  return raw.replace(/\/$/, '');
}
