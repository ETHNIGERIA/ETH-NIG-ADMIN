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

/** Optional ETH Nigeria tickets API. Falls back to the LBW tickets API. */
export function getEthTicketsApiBaseUrl(): string {
  const raw = process.env.ETH_TICKETS_API_BASE_URL?.trim();
  return (raw || getTicketsApiBaseUrl()).replace(/\/$/, '');
}

export type BuyerSite = {
  /** Public ticket site base URL (origin + path, no query/hash) */
  url: string;
  /** Slug of the single event the ticket site sells; null = unknown */
  eventSlug: string | null;
};

/**
 * Server-only: public ticket site used to build promo tracking links
 * (`${url}/tickets?ref=...`). BUYER_SITE_URL must be an http(s) URL; any query
 * or hash is dropped. BUYER_SITE_EVENT_SLUG names the event that site sells, so
 * links are only offered for codes that apply there. Returns null when unset.
 */
export function getBuyerSite(): BuyerSite | null {
  const raw = process.env.BUYER_SITE_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return {
      url: `${url.origin}${url.pathname}`.replace(/\/$/, ''),
      eventSlug: process.env.BUYER_SITE_EVENT_SLUG?.trim() || null,
    };
  } catch {
    return null;
  }
}
