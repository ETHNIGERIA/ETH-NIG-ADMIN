'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { saveProgramAdmissionAction } from '@/tickets-portal/actions/program-admission';
import type { ActionState } from '@/tickets-portal/actions/events';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import type {
  ProgramAdmission,
  ProgramKey,
} from '@/tickets-portal/types/admin-program-admission';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';

const PROGRAM_ORDER: ProgramKey[] = ['hackathon', 'pitch'];
const PROGRAM_LABELS: Record<ProgramKey, string> = {
  hackathon: 'Hackathon',
  pitch: 'Founders Pitch',
};

type Draft = Record<ProgramKey, Set<string>>;

function toDraft(admission: ProgramAdmission[]): Draft {
  const byProgram = new Map(admission.map((a) => [a.program, a.allowedTierIds]));
  return {
    hackathon: new Set(byProgram.get('hackathon') ?? []),
    pitch: new Set(byProgram.get('pitch') ?? []),
  };
}

function diff(before: Set<string>, after: Set<string>) {
  return {
    add: [...after].filter((id) => !before.has(id)),
    remove: [...before].filter((id) => !after.has(id)),
  };
}

export function ProgramAdmissionSection({
  eventId,
  tiers,
  admission,
  loadError,
}: {
  eventId: string;
  tiers: AdminTicketTier[];
  admission: ProgramAdmission[];
  /** When set, the allowlist failed to load — checkboxes below are hidden. */
  loadError?: string | null;
}) {
  // Server truth, kept in a ref so the resync effect can compare against it.
  const serverDraft = useMemo(() => toDraft(admission), [admission]);
  const serverKey = JSON.stringify(
    PROGRAM_ORDER.map((p) => [...serverDraft[p]].sort()),
  );
  const [draft, setDraft] = useState<Draft>(() => toDraft(admission));
  const lastServerKey = useRef(serverKey);

  // Re-baseline the draft whenever the server state changes (after a save +
  // revalidate). Local edits between saves are preserved.
  useEffect(() => {
    if (lastServerKey.current !== serverKey) {
      lastServerKey.current = serverKey;
      setDraft(toDraft(admission));
    }
  }, [serverKey, admission]);

  const [state, formAction, pending] = useActionState(
    saveProgramAdmissionAction,
    undefined as ActionState,
  );

  const changes = PROGRAM_ORDER.map((program) => ({
    program,
    ...diff(serverDraft[program], draft[program]),
  }));
  const dirty = changes.some((c) => c.add.length || c.remove.length);

  const toggle = (program: ProgramKey, tierId: string) => {
    setDraft((prev) => {
      const next = new Set(prev[program]);
      if (next.has(tierId)) next.delete(tierId);
      else next.add(tierId);
      return { ...prev, [program]: next };
    });
  };

  const discard = () => setDraft(toDraft(admission));

  return (
    <div className="space-y-5">
      <p className="text-[14px] text-stone-600">
        Which ticket tiers qualify a holder to apply for each gated program. A
        tier that is not ticked does <span className="font-medium">not</span>{' '}
        qualify — new tiers start excluded. Edit freely, then{' '}
        <span className="font-medium">Save changes</span>.
      </p>

      {loadError ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-950">
          <p className="font-medium">Could not load the current allowlist.</p>
          <p className="mt-1 text-amber-900/90">{loadError}</p>
        </div>
      ) : null}

      {state?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
          {state.error}
        </div>
      ) : null}

      {!loadError && tiers.length === 0 ? (
        <p className="text-[14px] text-stone-500">
          Add ticket tiers first, then choose which ones qualify.
        </p>
      ) : null}

      {!loadError && tiers.length > 0 ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2">
            {PROGRAM_ORDER.map((program) => (
              <div
                key={program}
                className="rounded-lg border border-stone-200 bg-white p-4"
              >
                <h3 className="text-[13px] font-semibold text-stone-800">
                  {PROGRAM_LABELS[program]}
                </h3>
                <ul className="mt-3 space-y-2">
                  {tiers.map((tier) => {
                    const id = normalizeDocumentId(tier._id);
                    const checked = draft[program].has(id);
                    return (
                      <li key={`${program}-${id}`}>
                        <label className="flex cursor-pointer items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={pending}
                            onChange={() => toggle(program, id)}
                            className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 disabled:opacity-40"
                          />
                          <span className="text-[14px] text-stone-700">
                            {tier.name}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <form action={formAction} className="flex items-center gap-3">
            <input type="hidden" name="eventId" value={eventId} />
            <input
              type="hidden"
              name="changes"
              value={JSON.stringify(changes)}
            />
            <button
              type="submit"
              disabled={!dirty || pending}
              className="rounded-md bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-40"
            >
              {pending ? 'Saving…' : 'Save changes'}
            </button>
            {dirty && !pending ? (
              <button
                type="button"
                onClick={discard}
                className="text-[13px] text-stone-600 underline-offset-4 hover:underline"
              >
                Discard
              </button>
            ) : null}
            {dirty ? (
              <span className="text-[12px] text-stone-500">
                Unsaved changes
              </span>
            ) : null}
          </form>
        </>
      ) : null}
    </div>
  );
}
