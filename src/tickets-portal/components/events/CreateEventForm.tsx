'use client';

import { useActionState } from 'react';
import { createEventAction, type ActionState } from '@/tickets-portal/actions/events';
import Link from 'next/link';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(createEventAction, undefined as ActionState);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      {state?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
          {state.error}
        </div>
      ) : null}

      <div>
        <label htmlFor="slug" className={labelClass}>
          Slug
        </label>
        <input id="slug" name="slug" required className={fieldClass} placeholder="lagos-summit-2026" />
        <p className="mt-1 text-[12px] text-stone-500">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input id="name" name="name" required className={fieldClass} placeholder="Event name" />
      </div>

      <div>
        <label htmlFor="startsAt" className={labelClass}>
          Starts
        </label>
        <input id="startsAt" name="startsAt" type="datetime-local" required className={fieldClass} />
      </div>

      <div>
        <label htmlFor="endsAt" className={labelClass}>
          Ends
        </label>
        <input id="endsAt" name="endsAt" type="datetime-local" required className={fieldClass} />
      </div>

      <div>
        <label htmlFor="allowedOrigins" className={labelClass}>
          Allowed origins <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea
          id="allowedOrigins"
          name="allowedOrigins"
          rows={3}
          className={`${fieldClass} resize-y`}
          placeholder="One URL per line or comma-separated"
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {pending ? 'Creating…' : 'Create event'}
        </button>
        <Link
          href="/tickets-command/events"
          className="rounded-md border border-stone-200 px-4 py-2.5 text-[14px] text-stone-600 hover:bg-stone-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
