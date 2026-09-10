import type { HackathonApplicationStatus } from '@/tickets-portal/types/admin-hackathon-application';

export const PROGRAM_APPLICATION_STATUSES: HackathonApplicationStatus[] = [
  'received',
  'reviewed',
  'shortlisted',
  'accepted',
  'waitlist',
  'rejected',
];

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-stone-100 text-stone-700',
  reviewed: 'bg-blue-50 text-blue-700',
  shortlisted: 'bg-violet-50 text-violet-700',
  accepted: 'bg-emerald-50 text-emerald-800',
  waitlist: 'bg-amber-50 text-amber-900',
  rejected: 'bg-red-50 text-red-700',
};

export function programStatusBadgeClass(status: string): string {
  return `rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${
    STATUS_STYLES[status] ?? 'bg-stone-100 text-stone-700'
  }`;
}

export const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
export const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
export const td = 'px-4 py-3 text-[14px] text-stone-700';
export const rowHover = 'transition-colors hover:bg-stone-50/90';
export const filterInputCls =
  'rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] text-stone-800';

export function fmtDate(iso?: string, withTime = false) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' as const } : {}),
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
