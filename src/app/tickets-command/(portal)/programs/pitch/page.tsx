import Link from 'next/link';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import type { ApplicationPage } from '@/tickets-portal/types/admin-applications';
import {
  PITCH_SECTORS,
  PITCH_STAGES,
  SLOT_PREFERENCES,
  pitchSectorLabel,
  pitchStageLabel,
  slotLabel,
  type PitchApplication,
} from '@/tickets-portal/types/admin-pitch-application';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { ProgramsTabs } from '@/tickets-portal/components/programs/ProgramsTabs';
import {
  PROGRAM_APPLICATION_STATUSES,
  fmtDate,
  filterInputCls,
  programStatusBadgeClass,
  rowHover,
  tableWrap,
  td,
  th,
} from '@/tickets-portal/components/programs/shared';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function PitchApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filters = {
    status: one(sp.status),
    sector: one(sp.sector),
    stage: one(sp.stage),
    slot: one(sp.slot),
    tier: one(sp.tier),
    from: one(sp.from),
    to: one(sp.to),
    q: one(sp.q),
  };
  const page = Math.max(1, parseInt(one(sp.page) || '1', 10) || 1);
  const limit = 20;

  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  for (const [k, v] of Object.entries(filters)) if (v) query.set(k, v);

  let result: ApplicationPage<PitchApplication> | null = null;
  let loadError: string | null = null;
  try {
    result = await ticketsApiGet<ApplicationPage<PitchApplication>>(
      `/admin/pitch-applications?${query.toString()}`,
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
          className={`${filterInputCls} min-w-[220px]`}
        />
        <select name="status" defaultValue={filters.status} className={filterInputCls}>
          <option value="">All statuses</option>
          {PROGRAM_APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="sector" defaultValue={filters.sector} className={filterInputCls}>
          <option value="">All sectors</option>
          {PITCH_SECTORS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select name="stage" defaultValue={filters.stage} className={filterInputCls}>
          <option value="">All stages</option>
          {PITCH_STAGES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select name="slot" defaultValue={filters.slot} className={filterInputCls}>
          <option value="">All slots</option>
          {SLOT_PREFERENCES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[12px] text-stone-500">
          From
          <input type="date" name="from" defaultValue={filters.from} className={filterInputCls} />
        </label>
        <label className="flex items-center gap-1 text-[12px] text-stone-500">
          To
          <input type="date" name="to" defaultValue={filters.to} className={filterInputCls} />
        </label>
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-stone-800"
        >
          Apply
        </button>
        <Link
          href="/tickets-command/programs/pitch"
          className="px-2 py-1.5 text-[13px] text-stone-500 hover:text-stone-800"
        >
          Reset
        </Link>
        <a
          href={`/api/pitch-applications/export?${query.toString()}`}
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
                  <th className={th}>Company</th>
                  <th className={`${th} hidden md:table-cell`}>Sector</th>
                  <th className={`${th} hidden lg:table-cell`}>Stage</th>
                  <th className={`${th} hidden lg:table-cell`}>Slot</th>
                  <th className={th}>Status</th>
                  <th className={`${th} hidden sm:table-cell`}>Score</th>
                  <th className={`${th} hidden lg:table-cell`}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`${td} py-16 text-center text-stone-400`}>
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
                            href={`/tickets-command/programs/pitch/${id}`}
                            className="font-medium text-stone-900 hover:underline"
                          >
                            {a.applicationId}
                          </Link>
                          <p className="mt-0.5 text-[13px] text-stone-500">
                            {a.contactEmail}
                          </p>
                        </td>
                        <td className={`${td} text-[13px]`}>
                          <span className="text-stone-800">{a.companyName}</span>
                          <p className="mt-0.5 line-clamp-1 text-stone-500">
                            {a.oneLiner}
                          </p>
                        </td>
                        <td className={`${td} hidden text-[13px] text-stone-600 md:table-cell`}>
                          {pitchSectorLabel(a.sector)}
                        </td>
                        <td className={`${td} hidden text-[13px] text-stone-600 lg:table-cell`}>
                          {pitchStageLabel(a.stage)}
                        </td>
                        <td className={`${td} hidden text-[13px] text-stone-600 lg:table-cell`}>
                          {slotLabel(a.slotPreference)}
                        </td>
                        <td className={td}>
                          <span className={programStatusBadgeClass(a.status)}>
                            {a.status}
                          </span>
                        </td>
                        <td className={`${td} hidden sm:table-cell`}>{a.score ?? '—'}</td>
                        <td className={`${td} hidden text-[13px] text-stone-500 lg:table-cell`}>
                          {fmtDate(a.createdAt)}
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
