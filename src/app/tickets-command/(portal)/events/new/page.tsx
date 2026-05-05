import Link from 'next/link';
import { CreateEventForm } from '@/tickets-portal/components/events/CreateEventForm';

export default function NewEventPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/tickets-command/events"
          className="text-[14px] text-stone-600 hover:text-stone-900"
        >
          ← Events
        </Link>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-stone-900">New event</h1>
        <p className="mt-1 text-[15px] text-stone-500">Creates a draft event. You can publish after tiers are ready.</p>
      </div>
      <CreateEventForm />
    </div>
  );
}
