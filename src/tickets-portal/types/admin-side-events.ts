import type { EventStatus } from '@/tickets-portal/types/admin-events';
import type { TicketTierStatus } from '@/tickets-portal/types/admin-tiers';

/** One scheduled session; `date` is the local date in the event timezone. */
export type SideEventDay = {
  key: string;
  date: string;
  label: string;
  startsAt: string;
  endsAt: string;
};

export type SideEventAdmission = {
  _id: string;
  isFree: boolean;
  priceMinor: number;
  currency: string | null;
  capacity: number | null;
  soldCount: number;
  status: TicketTierStatus;
};

/** GET /admin/side-events/:id */
export type AdminSideEvent = {
  _id: string;
  slug: string;
  name: string;
  status: EventStatus;
  description: string;
  venue: string;
  /** https image URL; '' when none. */
  flyerUrl: string;
  benefits: string[];
  timezone: string;
  startsAt: string;
  endsAt: string;
  days: SideEventDay[];
  publishedAt: string | null;
  /** True once published: slug, main event, schedule and admission are frozen. */
  locked: boolean;
  /** Send back on every change; a stale value gets 409. */
  version: number;
  createdAt?: string;
  updatedAt?: string;
  parent: { _id: string; slug: string; name: string; status: EventStatus } | null;
  admission: SideEventAdmission | null;
};
