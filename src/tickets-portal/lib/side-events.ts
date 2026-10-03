import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';

/**
 * Currencies offered in the admission form. The API is authoritative: it
 * accepts only what the Paystack provider record supports (seeded: NGN).
 */
export const SIDE_EVENT_CURRENCIES = ['NGN'];

export function admissionLabel(event: Pick<AdminSideEvent, 'admission'>): string {
  const a = event.admission;
  if (!a) return 'Not set';
  if (a.isFree) return 'Free';
  return a.currency === 'NGN'
    ? formatMinorToNgn(a.priceMinor)
    : `${(a.priceMinor / 100).toFixed(2)} ${a.currency ?? ''}`.trim();
}
