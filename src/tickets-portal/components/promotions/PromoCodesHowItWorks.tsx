import { HowItWorks } from '@/tickets-portal/components/ui/HowItWorks';

/** Shared explanation for promo code pages; `owner` tailors the attribution line. */
export function PromoCodesHowItWorks({ owner }: { owner: 'influencer' | 'community' | 'event' }) {
  const attribution =
    owner === 'influencer'
      ? 'Every sale made with these codes counts towards this influencer (their portal and payouts use it).'
      : owner === 'community'
        ? 'Every sale made with these codes counts towards this community.'
        : 'Event codes have no influencer or community, so their sales are not attributed to anyone. Influencer and community codes are managed on their own pages.';
  return (
    <HowItWorks
      items={[
        'Buyers type the code at checkout. The discount applies after any early-bird and volume discounts.',
        attribution,
        ...(owner === 'event'
          ? []
          : [
              '"Works for" limits a code to one event; "All events" works everywhere. If the same code exists for one event and for all events, the event-specific one wins at that event.',
            ]),
        'Max tickets counts tickets, not orders. Inactive and deleted codes are rejected at checkout.',
        ...(owner === 'event' ? [] : ['A code’s owner cannot be changed. To move it, deactivate it and create a new code.']),
      ]}
    />
  );
}
