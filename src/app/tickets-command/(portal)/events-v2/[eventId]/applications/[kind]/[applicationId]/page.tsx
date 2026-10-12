import Link from 'next/link';
import { notFound, unstable_rethrow } from 'next/navigation';
import { ticketsApiGet } from '@/tickets-portal/lib/tickets-api.server';
import { eventConsoleHref, formatEventDate, loadConsoleEvent } from '@/tickets-portal/lib/event-console';
import { SectionHeader, consoleCard } from '@/tickets-portal/components/events-v2/SectionHeader';
import { updateEventApplicationStatus } from '@/tickets-portal/actions/event-console-applications';
import type { SpeakerApplication, SponsorApplication } from '@/tickets-portal/types/admin-collab-applications';

export const dynamic = 'force-dynamic';

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-900">{value}</dd></div>;
}

export default async function EventApplicationDetail({ params }: { params: Promise<{ eventId: string; kind: string; applicationId: string }> }) {
  const { eventId, kind, applicationId } = await params;
  const event = await loadConsoleEvent(eventId);
  if (!['speakers', 'sponsors'].includes(kind) || !/^[a-f0-9]{24}$/i.test(applicationId)) notFound();
  let application: SpeakerApplication | SponsorApplication;
  try { application = await ticketsApiGet<SpeakerApplication | SponsorApplication>(`/admin/${kind === 'speakers' ? 'speaker' : 'sponsor'}-applications/${applicationId}`); }
  catch (error) { unstable_rethrow(error); notFound(); }
  if (application.eventSlug !== event.slug) notFound();
  const sponsor = kind === 'sponsors' ? application as SponsorApplication : null;
  const speaker = kind === 'speakers' ? application as SpeakerApplication : null;
  const listPath = eventConsoleHref(eventId, `applications/${kind}`);
  return <div className="space-y-6">
    <Link href={listPath} className="text-sm font-semibold text-blue-700 hover:underline">← {kind === 'speakers' ? 'Speaker' : 'Sponsor'} applications</Link>
    <SectionHeader eyebrow={`Applications / ${kind}`} title={sponsor?.companyName || application.fullName} description={`Submitted ${formatEventDate(application.createdAt, event.timezone)} · ${application.status}`} />
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className={consoleCard}>
        <h3 className="text-base font-bold text-slate-900">Application</h3>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field label="Contact" value={application.fullName} /><Field label="Email" value={application.email} /><Field label="Phone" value={application.phone} />
          {sponsor ? <><Field label="Organisation" value={sponsor.companyName} /><Field label="Website" value={sponsor.website} /><Field label="Sponsor type" value={sponsor.sponsorType} /><Field label="Section" value={sponsor.section} /><Field label="Budget" value={sponsor.budget} /><Field label="Interest" value={sponsor.interest} /><Field label="Objective" value={sponsor.objective} /><Field label="Notes" value={sponsor.notes} /></> : null}
          {speaker ? <><Field label="Role" value={speaker.role} /><Field label="Company" value={speaker.company} /><Field label="Topic" value={speaker.topicTitle} /><Field label="Track" value={speaker.topicTrack} /><Field label="Speaking format" value={speaker.speakingFormat} /><Field label="LinkedIn" value={speaker.linkedinUrl} /><Field label="Biography" value={speaker.bio} /><Field label="Audience takeaway" value={speaker.audienceTakeaway} /><Field label="Prior talks" value={speaker.priorTalks} /><Field label="Availability" value={speaker.availability} /></> : null}
        </dl>
      </div>
      <form action={updateEventApplicationStatus} className={consoleCard}>
        <h3 className="text-base font-bold text-slate-900">Review status</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">Approving a speaker application also creates or updates the public speaker profile for this event.</p>
        <input type="hidden" name="eventId" value={eventId} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={applicationId} />
        <label htmlFor="application-status" className="mt-5 block text-sm font-semibold text-slate-800">Status</label>
        <select id="application-status" name="status" defaultValue={application.status} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
        <button type="submit" className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">Save status</button>
      </form>
    </div>
  </div>;
}
