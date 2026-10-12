import { EventRelatedRecords } from '@/tickets-portal/components/events/EventRelatedRecords';
import { fetchEventRelatedRecords } from '@/tickets-portal/data/event-related-read';

export async function EventRelatedSection({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string;
}) {
  const related = await fetchEventRelatedRecords({ _id: eventId, slug });
  return (
    <EventRelatedRecords
      eventId={eventId}
      members={related.members}
      membersTotal={related.membersTotal}
      partners={related.partners}
      partnerApplications={related.partnerApplications}
      speakers={related.speakers}
      speakerApplications={related.speakerApplications}
      sponsors={related.sponsors}
      sponsorApplications={related.sponsorApplications}
      errors={related.errors}
    />
  );
}
