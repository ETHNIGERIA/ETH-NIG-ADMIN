import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import {
  cacStatusLabel,
  fundraisingLabel,
  pitchSectorLabel,
  pitchStageLabel,
  slotLabel,
  type PitchApplication,
} from '@/tickets-portal/types/admin-pitch-application';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { ProgramReviewControls } from '@/tickets-portal/components/programs/ProgramReviewControls';

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === '' || value === null || value === undefined) return null;
  return (
    <div>
      <dt className="text-[12px] font-medium uppercase tracking-wide text-stone-400">
        {label}
      </dt>
      <dd className="mt-1 text-[14px] text-stone-800 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-[13px] font-semibold text-stone-800">{title}</h2>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function ExtLink({ href }: { href: string }) {
  if (!href) return null;
  // The "where to find you" field can be a link or a free-text description.
  if (!/^https?:\/\//i.test(href.trim())) {
    return <span className="text-[14px] text-stone-800 whitespace-pre-wrap">{href}</span>;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[14px] text-stone-800 underline underline-offset-2 hover:text-stone-950 break-all"
    >
      {href}
    </a>
  );
}

export default async function PitchApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let app: PitchApplication;
  try {
    const raw = await ticketsApiGet<PitchApplication>(
      `/admin/pitch-applications/${id}`,
    );
    app = { ...raw, _id: normalizeDocumentId(raw._id) };
  } catch {
    notFound();
  }

  const yn = (b: boolean) => (b ? 'Yes' : 'No');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tickets-command/programs/pitch"
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← All pitch applications
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-stone-900">
          {app.applicationId}
          <span className="ml-3 align-middle text-[13px] font-normal capitalize text-stone-500">
            {app.status}
            {app.score ? ` · score ${app.score}` : ''}
          </span>
        </h1>
        <p className="mt-1 text-[14px] text-stone-600">
          {app.companyName} — {app.oneLiner}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Company">
            <Field label="Where to find them" value={<ExtLink href={app.website} />} />
            <Field label="Sector" value={pitchSectorLabel(app.sector)} />
            <Field label="Stage" value={pitchStageLabel(app.stage)} />
            <Field label="Year founded" value={String(app.yearFounded)} />
            <Field label="Country" value={app.countryOfOperation} />
            <Field label="CAC status" value={cacStatusLabel(app.cacStatus)} />
            <Field label="Team size" value={String(app.teamSize)} />
            <Field
              label="Contact"
              value={`${app.contactName} · ${app.contactEmail}${
                app.contactWhatsapp ? ` · ${app.contactWhatsapp}` : ''
              }`}
            />
          </Card>

          <Card title="Narrative">
            <Field label="Problem" value={app.problem} />
            <Field label="Solution" value={app.solution} />
            <Field label="Product status" value={app.productStatus} />
            <Field label="Traction" value={app.traction} />
            <Field label="Target customer" value={app.targetCustomer} />
            <Field label="Business model" value={app.businessModel} />
            <Field label="Why now" value={app.whyNow} />
            <Field label="Why LBW / the ask" value={app.whyLbwAsk} />
          </Card>

          <Card title="Fundraising">
            <Field label="Status" value={fundraisingLabel(app.fundraisingStatus)} />
            <Field label="Raise amount" value={app.raiseAmount} />
            <Field
              label="Open to intros"
              value={app.openToIntros.length ? app.openToIntros.join(', ') : ''}
            />
          </Card>

          <Card title="Assets">
            <Field label="Deck" value={<ExtLink href={app.deckUrl} />} />
            <Field
              label="Confidential deck"
              value={app.confidentialDeck ? 'Yes — do not publish' : 'No'}
            />
            <Field label="Video" value={<ExtLink href={app.videoUrl} />} />
            <Field label="Demo" value={<ExtLink href={app.demoUrl} />} />
          </Card>

          <Card title="Slot & consent">
            <Field label="Slot preference" value={slotLabel(app.slotPreference)} />
            <Field label="Office hours" value={yn(app.officeHoursOptIn)} />
            <Field label="Code of conduct" value={yn(app.agreedCodeOfConduct)} />
            <Field label="Data processing" value={yn(app.agreedDataProcessing)} />
            <Field label="Photo / video consent" value={yn(app.photoVideoConsent)} />
          </Card>

          <Card title="Ticket">
            <Field label="Tier" value={app.ticketTierName} />
            <Field label="Verified email" value={app.ticketEmail} />
            <Field label="Code" value={app.ticketCode} />
            <Field label="Event" value={app.eventName} />
          </Card>
        </div>

        <ProgramReviewControls app={app} basePath="/admin/pitch-applications" />
      </div>
    </div>
  );
}
