import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AdminRegistration } from '@/tickets-portal/types/admin-registrations';
import type { AdminPartner, AdminPartnerApplication } from '@/tickets-portal/types/admin-partners';
import type { AdminSponsor, AdminSponsorApplication } from '@/tickets-portal/types/admin-sponsors';
import type { AdminSpeaker, AdminSpeakerApplication } from '@/tickets-portal/types/admin-speakers';
import { ApplicationStatusActions } from '@/tickets-portal/components/events/ApplicationStatusActions';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';

const PREVIEW = 8;
const tableWrap =
  'overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';
const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
const td = 'px-4 py-3 text-[14px] text-stone-700';
const rowHover = 'transition-colors hover:bg-stone-50/90';

function PartnerField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-[13px] text-stone-800">
        {value?.trim() ? value : '—'}
      </dd>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  const value = (status ?? 'unknown').toLowerCase();
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-900',
    reviewed: 'bg-sky-50 text-sky-900',
    approved: 'bg-emerald-50 text-emerald-800',
    rejected: 'bg-stone-100 text-stone-600',
    confirmed: 'bg-emerald-50 text-emerald-800',
    cancelled: 'bg-stone-100 text-stone-600',
    active: 'bg-emerald-50 text-emerald-800',
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${styles[value] ?? 'bg-stone-100 text-stone-700'}`}>
      {status ?? '—'}
    </span>
  );
}

function RelatedSection({
  id,
  eyebrow,
  title,
  aside,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-l-2 border-stone-300 pl-5 sm:scroll-mt-28 sm:pl-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">{eyebrow}</p>
          <h2 className="mt-1 text-[15px] font-semibold text-stone-900">{title}</h2>
        </div>
        {aside ? <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function LoadError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-950">
      {message}
    </div>
  );
}

function OrgRow({
  name,
  website,
  meta,
  logo,
}: {
  name: string;
  website?: string;
  meta?: string;
  logo?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <img src={logo} alt="" className="h-8 w-8 rounded object-contain" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-stone-100 text-[11px] font-medium text-stone-500">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-stone-900">{name}</p>
        <p className="truncate text-[12px] text-stone-500">
          {meta ? `${meta} · ` : ''}
          {website ? website.replace(/^https?:\/\//, '') : '—'}
        </p>
      </div>
    </div>
  );
}

export function EventRelatedRecords({
  eventId,
  members,
  membersTotal,
  partners,
  partnerApplications,
  speakers,
  speakerApplications,
  sponsors,
  sponsorApplications,
  errors,
}: {
  eventId: string;
  members: AdminRegistration[];
  membersTotal: number;
  partners: AdminPartner[];
  partnerApplications: AdminPartnerApplication[];
  speakers: AdminSpeaker[];
  speakerApplications: AdminSpeakerApplication[];
  sponsors: AdminSponsor[];
  sponsorApplications: AdminSponsorApplication[];
  errors: {
    members?: string;
    partners?: string;
    partnerApplications?: string;
    speakers?: string;
    speakerApplications?: string;
    sponsors?: string;
    sponsorApplications?: string;
  };
}) {
  const memberPreview = members.slice(0, PREVIEW);
  const listedPartners = partners.slice(0, PREVIEW);
  const partnerAppPreview = partnerApplications.slice(0, PREVIEW);
  const listedSpeakers = speakers.slice(0, PREVIEW);
  const speakerAppPreview = speakerApplications.slice(0, PREVIEW);
  const listedSponsors = sponsors.slice(0, PREVIEW);
  const sponsorAppPreview = sponsorApplications.slice(0, PREVIEW);

  return (
    <div className="space-y-10">
      <RelatedSection
        id="section-members"
        eyebrow="People"
        title="Members from registrations"
        aside={
          <Link
            href={`/tickets-command/events/${eventId}/registrations`}
            className="text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
          >
            View all
          </Link>
        }
      >
        <LoadError message={errors.members} />
        <p className="mb-3 text-[14px] text-stone-600">
          {membersTotal === 0
            ? 'No registrations for this event yet.'
            : `${membersTotal} registration${membersTotal === 1 ? '' : 's'} tied to this event.`}
        </p>
        <div className={tableWrap}>
          <table className="w-full min-w-[320px]">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Member</th>
                <th className={`${th} hidden sm:table-cell`}>Status</th>
                <th className={`${th} hidden md:table-cell`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {memberPreview.length === 0 ? (
                <tr>
                  <td colSpan={3} className={`${td} py-10 text-center text-stone-400`}>
                    Registrations for this event will show up here.
                  </td>
                </tr>
              ) : (
                memberPreview.map((reg) => (
                  <tr key={reg._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                    <td className={td}>
                      <Link
                        href={`/tickets-command/events/${eventId}/registrations/${reg._id}`}
                        className="font-medium text-stone-900 hover:underline"
                      >
                        {reg.name || reg.email}
                      </Link>
                      {reg.name ? (
                        <p className="mt-0.5 text-[13px] text-stone-500">{reg.email}</p>
                      ) : null}
                    </td>
                    <td className={`${td} hidden sm:table-cell`}>
                      <StatusPill status={reg.status} />
                    </td>
                    <td className={`${td} hidden text-[13px] md:table-cell`}>
                      {typeof reg.finalAmount === 'number' ? formatMinorToNgn(reg.finalAmount) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </RelatedSection>

      <RelatedSection
        id="section-speakers"
        eyebrow="Program"
        title="Speakers"
        aside={
          <Link
            href={`/tickets-command/events/${eventId}/speakers`}
            className="text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
          >
            View all
          </Link>
        }
      >
        <LoadError message={errors.speakers ?? errors.speakerApplications} />
        <p className="mb-3 text-[14px] text-stone-600">
          {speakers.length} listed speaker{speakers.length === 1 ? '' : 's'} · {speakerApplications.length} application{speakerApplications.length === 1 ? '' : 's'}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={tableWrap}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Listed speakers</th>
                </tr>
              </thead>
              <tbody>
                {listedSpeakers.length === 0 ? (
                  <tr>
                    <td className={`${td} py-10 text-center text-stone-400`}>No listed speakers yet.</td>
                  </tr>
                ) : (
                  listedSpeakers.map((speaker) => (
                    <tr key={speaker._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                      <td className={td}>
                        <OrgRow
                          name={speaker.name}
                          website={speaker.linkedinUrl ?? speaker.twitterUrl}
                          meta={[speaker.title, speaker.company].filter(Boolean).join(' · ') || undefined}
                          logo={speaker.avatarUrl}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className={tableWrap}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Applications</th>
                  <th className={th}>Status</th>
                  <th className={th}>Approve</th>
                </tr>
              </thead>
              <tbody>
                {speakerAppPreview.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={`${td} py-10 text-center text-stone-400`}>
                      No speaker applications for this event.
                    </td>
                  </tr>
                ) : (
                  speakerAppPreview.map((app) => (
                    <tr key={app._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                      <td className={td}>
                        <p className="font-medium text-stone-900">{app.fullName || app.name}</p>
                        <p className="text-[13px] text-stone-500">
                          {app.topicTitle || app.speakingFormat || app.company || '—'}
                        </p>
                      </td>
                      <td className={td}>
                        <StatusPill status={app.status} />
                      </td>
                      <td className={td}>
                        <ApplicationStatusActions
                          kind="speaker"
                          applicationId={app._id}
                          eventId={eventId}
                          currentStatus={app.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </RelatedSection>

      <RelatedSection
        id="section-partners"
        eyebrow="Program"
        title="Partners"
        aside={
          <Link
            href={`/tickets-command/events/${eventId}/partners`}
            className="text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
          >
            View all
          </Link>
        }
      >
        <LoadError message={errors.partners ?? errors.partnerApplications} />
        <p className="mb-3 text-[14px] text-stone-600">
          {partners.length} listed partner{partners.length === 1 ? '' : 's'} · {partnerApplications.length} application{partnerApplications.length === 1 ? '' : 's'}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={tableWrap}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Listed partners</th>
                </tr>
              </thead>
              <tbody>
                {listedPartners.length === 0 ? (
                  <tr>
                    <td className={`${td} py-10 text-center text-stone-400`}>No listed partners yet.</td>
                  </tr>
                ) : (
                  listedPartners.map((partner) => (
                    <tr key={partner._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                      <td className={td}>
                        <OrgRow
                          name={partner.name}
                          website={partner.website}
                          meta={partner.category}
                          logo={partner.logo}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            {partnerAppPreview.length === 0 ? (
              <div className={`${tableWrap} px-4 py-10 text-center text-[14px] text-stone-400`}>
                No partner applications for this event.
              </div>
            ) : (
              partnerAppPreview.map((app) => (
                <article key={app._id} className="rounded-lg border border-stone-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">{app.companyName}</p>
                      <p className="text-[13px] text-stone-500">{app.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill status={app.status} />
                      <ApplicationStatusActions
                        kind="partner"
                        applicationId={app._id}
                        eventId={eventId}
                        currentStatus={app.status}
                      />
                    </div>
                  </div>
                  <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    <PartnerField label="Event slug" value={app.eventSlug} />
                    <PartnerField label="Partnership type" value={app.partnershipType || app.partnerType} />
                    <PartnerField label="Phone" value={app.phone} />
                    <PartnerField label="Telegram" value={app.telegram} />
                    <PartnerField label="Country" value={app.country} />
                    <PartnerField label="Communication" value={app.communicationMethod} />
                    <PartnerField label="Website" value={app.website} />
                    <PartnerField label="LinkedIn" value={app.linkedin} />
                    <PartnerField label="Logo URL" value={app.logoUrl} />
                    <PartnerField label="Objectives" value={app.objectives || app.objective} />
                    <PartnerField label="What they can offer" value={app.whatCanOffer} />
                    <PartnerField label="Benefits sought" value={app.benefitsSeek} />
                  </dl>
                </article>
              ))
            )}
          </div>
        </div>
      </RelatedSection>

      <RelatedSection
        id="section-sponsors"
        eyebrow="Program"
        title="Sponsorships"
        aside={
          <Link
            href={`/tickets-command/events/${eventId}/sponsors`}
            className="text-[13px] font-medium text-stone-800 underline-offset-4 hover:underline"
          >
            View all
          </Link>
        }
      >
        <LoadError message={errors.sponsors ?? errors.sponsorApplications} />
        <p className="mb-3 text-[14px] text-stone-600">
          {sponsors.length} listed sponsor{sponsors.length === 1 ? '' : 's'} · {sponsorApplications.length} application{sponsorApplications.length === 1 ? '' : 's'} tied to this event
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={tableWrap}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Listed sponsors</th>
                </tr>
              </thead>
              <tbody>
                {listedSponsors.length === 0 ? (
                  <tr>
                    <td className={`${td} py-10 text-center text-stone-400`}>No listed sponsors yet.</td>
                  </tr>
                ) : (
                  listedSponsors.map((sponsor) => (
                    <tr key={sponsor._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                      <td className={td}>
                        <OrgRow
                          name={sponsor.name}
                          website={sponsor.website}
                          meta={sponsor.tier}
                          logo={sponsor.logo}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className={tableWrap}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className={th}>Applications</th>
                  <th className={th}>Status</th>
                  <th className={th}>Approve</th>
                </tr>
              </thead>
              <tbody>
                {sponsorAppPreview.length === 0 ? (
                  <tr>
                    <td colSpan={3} className={`${td} py-10 text-center text-stone-400`}>
                      No sponsorship applications for this event.
                    </td>
                  </tr>
                ) : (
                  sponsorAppPreview.map((app) => (
                    <tr key={app._id} className={`border-b border-stone-100 last:border-0 ${rowHover}`}>
                      <td className={td}>
                        <p className="font-medium text-stone-900">{app.companyName}</p>
                        <p className="text-[13px] text-stone-500">
                          {app.sponsorType}
                          {app.budget ? ` · ${app.budget}` : ''}
                        </p>
                      </td>
                      <td className={td}>
                        <StatusPill status={app.status} />
                      </td>
                      <td className={td}>
                        <ApplicationStatusActions
                          kind="sponsor"
                          applicationId={app._id}
                          eventId={eventId}
                          currentStatus={app.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </RelatedSection>
    </div>
  );
}

export function EventRelatedRecordsSkeleton() {
  return (
    <div className="space-y-10" aria-hidden>
      {['Members', 'Speakers', 'Partners', 'Sponsorships'].map((title) => (
        <div key={title} className="scroll-mt-24 border-l-2 border-stone-200 pl-5 sm:pl-6">
          <div className="h-4 w-24 animate-pulse rounded bg-stone-200/80" />
          <div className="mt-3 h-5 w-40 animate-pulse rounded bg-stone-200/70" />
          <div className="mt-5 h-36 animate-pulse rounded-lg border border-stone-200 bg-white" />
        </div>
      ))}
    </div>
  );
}
