import Link from 'next/link';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { ApplicationPage } from '@/tickets-portal/types/admin-applications';
import {
  HACKATHON_APPLICATION_STATUSES,
  HACKATHON_TRACKS,
  hackathonTrackLabel,
  type HackathonApplication,
  type HackathonApplicationStatus,
} from '@/tickets-portal/types/admin-hackathon-application';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { ProgramsTabs } from '@/tickets-portal/components/programs/ProgramsTabs';

export const dynamic = 'force-dynamic';

const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';
const inputCls =
  'rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] text-stone-800';

const STATUS_STYLES: Record<HackathonApplicationStatus, string> = {
  received: 'bg-stone-100 text-stone-700',
  reviewed: 'bg-blue-50 text-blue-700',
  shortlisted: 'bg-violet-50 text-violet-700',
  accepted: 'bg-emerald-50 text-emerald-800',
  waitlist: 'bg-amber-50 text-amber-900',
  rejected: 'bg-red-50 text-red-700',
};

function fmt(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium' }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function HackathonApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = {
    status: one(sp.status),
    track: one(sp.track),
    tier: one(sp.tier),
    from: one(sp.from),
    to: one(sp.to),
    q: one(sp.q),
  };
  const page = Math.max(1, parseInt(one(sp.page) || '1', 10) || 1);
  const limit = 20;

  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  for (const [k, v] of Object.entries(filters)) if (v) query.set(k, v);

  let result: ApplicationPage<HackathonApplication> | null = null;
  let loadError: string | null = null;
  try {
    result = await ticketsApiGet<ApplicationPage<HackathonApplication>>(
      `/admin/hackathon-applications?${query.toString()}`,
    );
  } catch (e) {
    loadError = e instanceof Error ? e.message : 'Failed to load applications';
  }

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / limit));
  const pageQuery = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v) q.set(k, v);
    q.set('page', String(p));
    return `?${q.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">
          Programs
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-stone-600">
          Applications from qualifying ticket holders.
        </p>
      </div>

      <ProgramsTabs />

      <form
        method="get"
        className="flex flex-wrap items-end gap-2 rounded-lg border border-stone-200 bg-white p-3"
      >
        <input
          name="q"
          defaultValue={filters.q}
          placeholder="Application ID or email"
          className={`${inputCls} min-w-[220px]`}
        />
        <select name="status" defaultValue={filters.status} className={inputCls}>
          <option value="">All statuses</option>
          {HACKATHON_APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="track" defaultValue={filters.track} className={inputCls}>
          <option value="">All tracks</option>
          {HACKATHON_TRACKS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[12px] text-stone-500">
          From
          <input type="date" name="from" defaultValue={filters.from} className={inputCls} />
        </label>
        <label className="flex items-center gap-1 text-[12px] text-stone-500">
          To
          <input type="date" name="to" defaultValue={filters.to} className={inputCls} />
        </label>
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-stone-800"
        >
          Apply
        </button>
        <Link
          href="/tickets-command/programs/hackathon"
          className="px-2 py-1.5 text-[13px] text-stone-500 hover:text-stone-800"
        >
          Reset
        </Link>
        <a
          href={`/api/hackathon-applications/export?${query.toString()}`}
          className="ml-auto rounded-md border border-stone-200 px-3 py-1.5 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
        >
          Export CSV
        </a>
      </form>

      {loadError ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-6 py-5 text-red-900">
          <p className="font-semibold">Could not load applications</p>
          <p className="mt-2 text-[14px]">{loadError}</p>
        </div>
      ) : (
        <>
          <div className={tableWrap}>
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Application</th>
                  <th className={th}>Project</th>
                  <th className={`${th} hidden md:table-cell`}>Track</th>
                  <th className={`${th} hidden lg:table-cell`}>Tier</th>
                  <th className={th}>Status</th>
                  <th className={`${th} hidden sm:table-cell`}>Score</th>
                  <th className={`${th} hidden lg:table-cell`}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`${td} py-16 text-center text-stone-400`}>
                      No applications match these filters.
                    </td>
                  </tr>
                ) : (
                  items.map((a) => {
                    const id = normalizeDocumentId(a._id);
                    return (
                      <tr
                        key={id}
                        className={`border-b border-stone-100 last:border-0 ${rowHover}`}
                      >
                        <td className={td}>
                          <Link
                            href={`/tickets-command/programs/hackathon/${id}`}
                            className="font-medium text-stone-900 hover:underline"
                          >
                            {a.applicationId}
                          </Link>
                          <p className="mt-0.5 text-[13px] text-stone-500">
                            {a.participationType === 'team'
                              ? `${a.teamName ?? 'Team'} · ${a.teammates.length + 1}`
                              : 'Solo'}
                          </p>
                        </td>
                        <td className={`${td} text-[13px]`}>
                          <span className="text-stone-800">{a.projectName}</span>
                          <p className="mt-0.5 line-clamp-1 text-stone-500">
                            {a.oneLiner}
                          </p>
                        </td>
                        <td className={`${td} hidden text-[13px] text-stone-600 md:table-cell`}>
                          {hackathonTrackLabel(a.track)}
                        </td>
                        <td className={`${td} hidden text-[13px] text-stone-600 lg:table-cell`}>
                          {a.ticketTierName}
                        </td>
                        <td className={td}>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_STYLES[a.status]}`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className={`${td} hidden sm:table-cell`}>
                          {a.score ?? '—'}
                        </td>
                        <td className={`${td} hidden text-[13px] text-stone-500 lg:table-cell`}>
                          {fmt(a.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 ? (
            <div className="flex items-center justify-between gap-4 text-[14px] text-stone-600">
              <span>
                Page {page} of {pages} · {total} total
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={pageQuery(page - 1)}
                    className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-md px-3 py-1.5 text-stone-300">Previous</span>
                )}
                {page < pages ? (
                  <Link
                    href={pageQuery(page + 1)}
                    className="rounded-md border border-stone-200 px-3 py-1.5 hover:bg-stone-50"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-md px-3 py-1.5 text-stone-300">Next</span>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
