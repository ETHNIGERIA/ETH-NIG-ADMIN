import Link from 'next/link';
import type { ReactNode } from 'react';
import { getProgramBrands } from '@/tickets-portal/data/program-brands';
import {
  fetchProgramEventLists,
  type ProgramEventLists,
} from '@/tickets-portal/data/program-lists-read';
import { ApplicationStatusActions } from '@/tickets-portal/components/events/ApplicationStatusActions';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';

const tableWrap =
  'overflow-x-auto rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th =
  'whitespace-nowrap px-3 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'whitespace-nowrap px-3 py-3 text-[13px] text-stone-700';
const tdWrap = 'min-w-[12rem] max-w-[22rem] px-3 py-3 text-[13px] text-stone-700';

function dash(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function fmtDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function Logo({ src }: { src?: string }) {
  if (!src) return null;
  return <img src={src} alt="" className="h-7 w-7 shrink-0 rounded object-contain" />;
}

function Website({ href }: { href?: string }) {
  if (!href) return <span>—</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-stone-800 underline-offset-4 hover:underline"
    >
      {href.replace(/^https?:\/\//, '')}
    </a>
  );
}

function StatusPill({ status }: { status?: string }) {
  const value = (status ?? '—').toLowerCase();
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-900',
    reviewed: 'bg-sky-50 text-sky-900',
    approved: 'bg-emerald-50 text-emerald-800',
    rejected: 'bg-stone-100 text-stone-600',
    confirmed: 'bg-emerald-50 text-emerald-800',
    cancelled: 'bg-stone-100 text-stone-600',
    published: 'bg-emerald-50 text-emerald-800',
    draft: 'bg-stone-100 text-stone-700',
    archived: 'bg-amber-50 text-amber-900',
    active: 'bg-emerald-50 text-emerald-800',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[value] ?? 'bg-stone-100 text-stone-700'}`}>
      {status ?? '—'}
    </span>
  );
}

function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className={`${td} py-10 text-center text-stone-400`}>
        {message}
      </td>
    </tr>
  );
}

function SectionTable({
  title,
  count,
  error,
  children,
}: {
  title: string;
  count: number;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-stone-900">{title}</h3>
        <p className="text-[13px] text-stone-500">{count} row{count === 1 ? '' : 's'}</p>
      </div>
      {error ? <p className="text-[13px] text-amber-900">{error}</p> : null}
      <div className={tableWrap}>{children}</div>
    </div>
  );
}

function BrandLists({ data }: { data: ProgramEventLists }) {
  const eventId = data.event?._id;
  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          slug · {data.slug}
        </p>
        <h2 className="text-[22px] font-semibold tracking-tight text-stone-900">
          {data.event?.name ?? data.slug}
        </h2>
        <p className="break-all text-[12px] text-stone-500">{data.baseUrl}</p>
        {data.event ? (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[13px] text-stone-600">
            <StatusPill status={data.event.status} />
            <span>{fmtDate(data.event.startsAt)} → {fmtDate(data.event.endsAt)}</span>
            {eventId ? (
              <Link
                href={`/tickets-command/events/${eventId}`}
                prefetch={false}
                className="font-medium text-stone-800 underline-offset-4 hover:underline"
              >
                Open event
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="text-[14px] text-red-800">{data.eventError ?? 'Event not found.'}</p>
        )}
      </header>

      {!data.event ? null : (
        <>
          <SectionTable
            title="Registrations"
            count={data.members.length}
            error={data.errors.members}
          >
            <table className="w-full min-w-[72rem]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>Qty</th>
                  <th className={th}>Status</th>
                  <th className={th}>Original</th>
                  <th className={th}>Discount</th>
                  <th className={th}>Total</th>
                  <th className={th}>Promo</th>
                  <th className={th}>User ID</th>
                  <th className={th}>Created</th>
                  <th className={th}>Form data</th>
                </tr>
              </thead>
              <tbody>
                {data.members.length === 0 ? (
                  <EmptyRow cols={11} message="No registrations for this slug." />
                ) : (
                  data.members.map((reg) => (
                    <tr key={reg._id} className="border-b border-stone-100 last:border-0">
                      <td className={`${td} font-medium text-stone-900`}>
                        {eventId ? (
                          <Link
                            href={`/tickets-command/events/${eventId}/registrations/${reg._id}`}
                            prefetch={false}
                            className="hover:underline"
                          >
                            {dash(reg.name)}
                          </Link>
                        ) : (
                          dash(reg.name)
                        )}
                      </td>
                      <td className={td}>{reg.email}</td>
                      <td className={td}>{reg.quantity}</td>
                      <td className={td}>
                        <StatusPill status={reg.status} />
                      </td>
                      <td className={td}>
                        {typeof reg.originalAmount === 'number' ? formatMinorToNgn(reg.originalAmount) : '—'}
                      </td>
                      <td className={td}>
                        {typeof reg.discountAmount === 'number' ? formatMinorToNgn(reg.discountAmount) : '—'}
                      </td>
                      <td className={td}>
                        {typeof reg.finalAmount === 'number' ? formatMinorToNgn(reg.finalAmount) : '—'}
                      </td>
                      <td className={td}>{dash(reg.discountCode)}</td>
                      <td className={`${td} font-mono text-[12px]`}>{dash(reg.userId)}</td>
                      <td className={td}>{fmtDate(reg.createdAt)}</td>
                      <td className={tdWrap}>
                        {reg.formData && Object.keys(reg.formData).length > 0
                          ? JSON.stringify(reg.formData)
                          : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionTable>

          <SectionTable
            title="Listed speakers"
            count={data.speakers.length}
            error={data.errors.speakers}
          >
            <table className="w-full min-w-[64rem]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Name</th>
                  <th className={th}>Title</th>
                  <th className={th}>Company</th>
                  <th className={th}>LinkedIn</th>
                  <th className={th}>Twitter</th>
                  <th className={th}>Active</th>
                  <th className={th}>Event slug</th>
                </tr>
              </thead>
              <tbody>
                {data.speakers.length === 0 ? (
                  <EmptyRow cols={7} message="No listed speakers." />
                ) : (
                  data.speakers.map((s) => (
                    <tr key={s._id} className="border-b border-stone-100 last:border-0">
                      <td className={`${td} font-medium text-stone-900`}>
                        <span className="inline-flex items-center gap-2">
                          <Logo src={s.avatarUrl} />
                          {s.name}
                        </span>
                      </td>
                      <td className={td}>{dash(s.title)}</td>
                      <td className={td}>{dash(s.company)}</td>
                      <td className={td}>
                        <Website href={s.linkedinUrl} />
                      </td>
                      <td className={td}>
                        <Website href={s.twitterUrl} />
                      </td>
                      <td className={td}>{dash(s.isActive)}</td>
                      <td className={td}>{dash(s.eventSlug)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionTable>

          <SectionTable
            title="Speaker applications"
            count={data.speakerApplications.length}
            error={data.errors.speakerApplications}
          >
            <table className="w-full min-w-[96rem]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Name</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Company</th>
                  <th className={th}>Role</th>
                  <th className={th}>Topic</th>
                  <th className={th}>Track</th>
                  <th className={th}>Format</th>
                  <th className={th}>LinkedIn</th>
                  <th className={th}>Availability</th>
                  <th className={th}>Status</th>
                  <th className={th}>Created</th>
                  <th className={th}>Approve</th>
                </tr>
              </thead>
              <tbody>
                {data.speakerApplications.length === 0 ? (
                  <EmptyRow cols={13} message="No speaker applications." />
                ) : (
                  data.speakerApplications.map((app) => (
                    <tr key={app._id} className="border-b border-stone-100 last:border-0">
                      <td className={`${td} font-medium text-stone-900`}>
                        {app.fullName || app.name}
                      </td>
                      <td className={td}>{app.email}</td>
                      <td className={td}>{dash(app.phone)}</td>
                      <td className={td}>{dash(app.company)}</td>
                      <td className={td}>{dash(app.role)}</td>
                      <td className={tdWrap}>{dash(app.topicTitle)}</td>
                      <td className={td}>{dash(app.topicTrack)}</td>
                      <td className={td}>{dash(app.speakingFormat)}</td>
                      <td className={td}>
                        <Website href={app.linkedinUrl || app.linkedin} />
                      </td>
                      <td className={td}>{dash(app.availability)}</td>
                      <td className={td}>
                        <StatusPill status={app.status} />
                      </td>
                      <td className={td}>{fmtDate(app.createdAt)}</td>
                      <td className={td}>
                        {eventId ? (
                          <ApplicationStatusActions
                            kind="speaker"
                            applicationId={app._id}
                            eventId={eventId}
                            currentStatus={app.status}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionTable>

          <SectionTable
            title="Listed partners"
            count={data.partners.length}
            error={data.errors.partners}
          >
            <table className="w-full min-w-[64rem]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Name</th>
                  <th className={th}>Category</th>
                  <th className={th}>Website</th>
                  <th className={th}>Description</th>
                  <th className={th}>Active</th>
                  <th className={th}>Order</th>
                  <th className={th}>Event slug</th>
                </tr>
              </thead>
              <tbody>
                {data.partners.length === 0 ? (
                  <EmptyRow cols={7} message="No listed partners." />
                ) : (
                  data.partners.map((p) => (
                    <tr key={p._id} className="border-b border-stone-100 last:border-0">
                      <td className={`${td} font-medium text-stone-900`}>
                        <span className="inline-flex items-center gap-2">
                          <Logo src={p.logo} />
                          {p.name}
                        </span>
                      </td>
                      <td className={td}>{dash(p.category)}</td>
                      <td className={td}>
                        <Website href={p.website} />
                      </td>
                      <td className={tdWrap}>{dash(p.description)}</td>
                      <td className={td}>{dash(p.isActive)}</td>
                      <td className={td}>{dash(p.order)}</td>
                      <td className={td}>{dash(p.eventSlug)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionTable>

          <SectionTable
            title="Partner applications"
            count={data.partnerApplications.length}
            error={data.errors.partnerApplications}
          >
            <table className="w-full min-w-[96rem]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Company</th>
                  <th className={th}>Event slug</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Country</th>
                  <th className={th}>Type</th>
                  <th className={th}>Website</th>
                  <th className={th}>LinkedIn</th>
                  <th className={th}>Telegram</th>
                  <th className={th}>Logo</th>
                  <th className={th}>Objectives</th>
                  <th className={th}>Can offer</th>
                  <th className={th}>Seeking</th>
                  <th className={th}>Contact via</th>
                  <th className={th}>Status</th>
                  <th className={th}>Created</th>
                  <th className={th}>Approve</th>
                </tr>
              </thead>
              <tbody>
                {data.partnerApplications.length === 0 ? (
                  <EmptyRow cols={17} message="No partner applications." />
                ) : (
                  data.partnerApplications.map((app) => (
                    <tr key={app._id} className="border-b border-stone-100 last:border-0">
                      <td className={`${td} font-medium text-stone-900`}>{app.companyName}</td>
                      <td className={td}>{dash(app.eventSlug)}</td>
                      <td className={td}>{app.email}</td>
                      <td className={td}>{dash(app.phone)}</td>
                      <td className={td}>{dash(app.country)}</td>
                      <td className={td}>{dash(app.partnershipType || app.partnerType)}</td>
                      <td className={td}>
                        <Website href={app.website} />
                      </td>
                      <td className={td}>
                        <Website href={app.linkedin} />
                      </td>
                      <td className={td}>{dash(app.telegram)}</td>
                      <td className={tdWrap}>
                        <Website href={app.logoUrl} />
                      </td>
                      <td className={tdWrap}>{dash(app.objectives || app.objective)}</td>
                      <td className={tdWrap}>{dash(app.whatCanOffer)}</td>
                      <td className={tdWrap}>{dash(app.benefitsSeek)}</td>
                      <td className={td}>{dash(app.communicationMethod)}</td>
                      <td className={td}>
                        <StatusPill status={app.status} />
                      </td>
                      <td className={td}>{fmtDate(app.createdAt)}</td>
                      <td className={td}>
                        {eventId ? (
                          <ApplicationStatusActions
                            kind="partner"
                            applicationId={app._id}
                            eventId={eventId}
                            currentStatus={app.status}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionTable>

          <SectionTable
            title="Listed sponsors"
            count={data.sponsors.length}
            error={data.errors.sponsors}
          >
            <table className="w-full min-w-[64rem]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Name</th>
                  <th className={th}>Tier</th>
                  <th className={th}>Website</th>
                  <th className={th}>Description</th>
                  <th className={th}>Active</th>
                  <th className={th}>Order</th>
                  <th className={th}>Event slug</th>
                </tr>
              </thead>
              <tbody>
                {data.sponsors.length === 0 ? (
                  <EmptyRow cols={7} message="No listed sponsors." />
                ) : (
                  data.sponsors.map((s) => (
                    <tr key={s._id} className="border-b border-stone-100 last:border-0">
                      <td className={`${td} font-medium text-stone-900`}>
                        <span className="inline-flex items-center gap-2">
                          <Logo src={s.logo} />
                          {s.name}
                        </span>
                      </td>
                      <td className={`${td} capitalize`}>{dash(s.tier)}</td>
                      <td className={td}>
                        <Website href={s.website} />
                      </td>
                      <td className={tdWrap}>{dash(s.description)}</td>
                      <td className={td}>{dash(s.isActive)}</td>
                      <td className={td}>{dash(s.order)}</td>
                      <td className={td}>{dash(s.eventSlug)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionTable>

          <SectionTable
            title="Sponsor applications"
            count={data.sponsorApplications.length}
            error={data.errors.sponsorApplications}
          >
            <table className="w-full min-w-[96rem]">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Company</th>
                  <th className={th}>Contact</th>
                  <th className={th}>Email</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Type</th>
                  <th className={th}>Budget</th>
                  <th className={th}>Section</th>
                  <th className={th}>Website</th>
                  <th className={th}>Objective</th>
                  <th className={th}>Interest</th>
                  <th className={th}>Notes</th>
                  <th className={th}>Status</th>
                  <th className={th}>Event slug</th>
                  <th className={th}>Created</th>
                  <th className={th}>Approve</th>
                </tr>
              </thead>
              <tbody>
                {data.sponsorApplications.length === 0 ? (
                  <EmptyRow cols={15} message="No sponsor applications." />
                ) : (
                  data.sponsorApplications.map((app) => (
                    <tr key={app._id} className="border-b border-stone-100 last:border-0">
                      <td className={`${td} font-medium text-stone-900`}>{app.companyName}</td>
                      <td className={td}>{dash(app.fullName)}</td>
                      <td className={td}>{app.email}</td>
                      <td className={td}>{dash(app.phone)}</td>
                      <td className={td}>{dash(app.sponsorType)}</td>
                      <td className={td}>{dash(app.budget)}</td>
                      <td className={td}>{dash(app.section)}</td>
                      <td className={td}>
                        <Website href={app.website} />
                      </td>
                      <td className={tdWrap}>{dash(app.objective)}</td>
                      <td className={tdWrap}>{dash(app.interest)}</td>
                      <td className={tdWrap}>{dash(app.notes)}</td>
                      <td className={td}>
                        <StatusPill status={app.status} />
                      </td>
                      <td className={td}>{dash(app.eventSlug)}</td>
                      <td className={td}>{fmtDate(app.createdAt)}</td>
                      <td className={td}>
                        {eventId ? (
                          <ApplicationStatusActions
                            kind="sponsor"
                            applicationId={app._id}
                            eventId={eventId}
                            currentStatus={app.status}
                          />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SectionTable>
        </>
      )}
    </section>
  );
}

export default async function ProgramListsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const sp = await searchParams;
  const extraSlug = (sp.slug ?? '').trim().toLowerCase();
  const brands = getProgramBrands();

  const lists = await Promise.all(
    brands.map((brand) => fetchProgramEventLists(brand.slug, brand.baseUrl)),
  );

  const extra =
    extraSlug && !brands.some((b) => b.slug === extraSlug)
      ? await fetchProgramEventLists(extraSlug, brands[1]?.baseUrl ?? brands[0].baseUrl)
      : null;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-[28px] font-semibold tracking-tight text-stone-900">ETH & LBW lists</h1>
        <p className="max-w-3xl text-[15px] text-stone-600">
          Public forms create applications. Those show here immediately as pending so you can
          Approve or Reject. Listed speakers, partners, and sponsors are the published ones —
          only an admin can create those directly.
        </p>
      </header>

      <form className="flex max-w-lg flex-wrap gap-2" action="/tickets-command/program" method="get">
        <input
          name="slug"
          defaultValue={extraSlug}
          placeholder="Look up another slug"
          className="min-w-0 flex-1 rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
        />
        <button
          type="submit"
          className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800"
        >
          Load
        </button>
      </form>

      <div className="space-y-16">
        {lists.map((data, i) => (
          <BrandLists key={brands[i].key} data={data} />
        ))}
        {extra ? <BrandLists data={extra} /> : null}
      </div>
    </div>
  );
}
