'use client';

import { useState } from 'react';
import type { AdminSideEvent } from '@/tickets-portal/types/admin-side-events';
import { SideEventForm } from './SideEventForm';
import { SideEventStatusActions } from './SideEventStatusActions';

/** Remount on a saved version so publishing always refers to the saved form. */
export function SideEventEditor({ event, currencies }: { event: AdminSideEvent; currencies: string[] }) {
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  return (
    <div className="space-y-8">
      <SideEventStatusActions event={event} disabled={dirty || saving} onPendingChange={setChangingStatus} />
      {dirty ? <p role="status" className="text-sm text-amber-800">Save your changes before publishing or archiving.</p> : null}
      {event.locked ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          Slug, main event, schedule and admission are locked after publication. Name, description and venue can still change.
        </p>
      ) : null}
      <SideEventForm event={event} currencies={currencies} onDirtyChange={setDirty} onPendingChange={setSaving} disabled={changingStatus} />
    </div>
  );
}
