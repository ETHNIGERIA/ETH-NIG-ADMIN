import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import {
  hackathonTrackLabel,
  type HackathonApplication,
} from '@/tickets-portal/types/admin-hackathon-application';
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

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-[13px] font-semibold text-stone-800">{title}</h2>
      <dl className="mt-3 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export default async function HackathonApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let app: HackathonApplication;
  try {
    const raw = await ticketsApiGet<HackathonApplication>(
      `/admin/hackathon-applications/${id}`,
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
          href="/tickets-command/programs/hackathon"
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← All hackathon applications
        </Link>
        <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-stone-900">
          {app.applicationId}
          <span className="ml-3 align-middle text-[13px] font-normal capitalize text-stone-500">
            {app.status}
            {app.score ? ` · score ${app.score}` : ''}
          </span>
        </h1>
        <p className="mt-1 text-[14px] text-stone-600">
          {app.projectName} — {app.oneLiner}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Applicant">
            <Field label="Contact" value={`${app.contactName} · ${app.contactEmail}`} />
            <Field label="WhatsApp" value={app.contactWhatsapp ?? ''} />
            <Field
              label="Entry"
              value={
                app.participationType === 'team'
                  ? `Team "${app.teamName ?? ''}" (${app.teammates.length + 1})`
                  : 'Solo'
              }
            />
            <Field label="Track" value={hackathonTrackLabel(app.track)} />
            <Field
              label="Looking for teammates"
              value={
                app.lookingForTeammates
                  ? `Yes${app.neededRoles.length ? ` — ${app.neededRoles.join(', ')}` : ''}`
                  : 'No'
              }
            />
          </Card>

          {app.teammates.length > 0 ? (
            <section className="rounded-lg border border-stone-200 bg-white p-5">
              <h2 className="text-[13px] font-semibold text-stone-800">
                Teammates
              </h2>
              <ul className="mt-3 space-y-2 text-[14px]">
                {app.teammates.map((t, i) => (
                  <li key={i} className="flex flex-wrap gap-x-2 text-stone-700">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-stone-500">{t.email}</span>
                    {t.role ? <span className="text-stone-500">· {t.role}</span> : null}
                    <span className="text-stone-400">
                      · {t.hasTicket ? 'has a pass' : 'needs a pass'}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Card title="Project">
            <Field label="Problem" value={app.problem} />
            <Field label="Solution" value={app.solution} />
            <Field label="Build type" value={app.buildType === 'new' ? 'New build' : 'Existing project'} />
            <Field label="Ships by demo day" value={app.demoDayDeliverable} />
            <Field label="Tech stack" value={app.techStack.join(', ')} />
            <Field label="Chains / infra" value={app.chainInfra.join(', ')} />
            <Field label="Repo" value={app.repoUrl} />
            <Field label="Demo" value={app.demoUrl} />
          </Card>

          <Card title="Logistics & consent">
            <Field label="Attendance" value={app.attendanceMode} />
            <Field label="Power / internet needs" value={app.powerInternetNeeds} />
            <Field label="Accessibility needs" value={app.accessibilityNeeds} />
            <Field label="Heard about LBW via" value={app.referralSource} />
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

        <ProgramReviewControls app={app} basePath="/admin/hackathon-applications" />
      </div>
    </div>
  );
}
