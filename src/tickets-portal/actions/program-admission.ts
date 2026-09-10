'use server';

import { revalidatePath } from 'next/cache';
import { ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import { isObjectId } from '@/tickets-portal/lib/is-object-id';
import type { ActionState } from '@/tickets-portal/actions/events';
import type { ProgramAdmission } from '@/tickets-portal/types/admin-program-admission';

const PROGRAMS = ['hackathon', 'pitch'] as const;
type Program = (typeof PROGRAMS)[number];

type ProgramChange = { program: string; add: string[]; remove: string[] };

function parseChanges(raw: string): ProgramChange[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;
  const out: ProgramChange[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== 'object') return null;
    const program = String((row as { program?: unknown }).program ?? '');
    if (!PROGRAMS.includes(program as Program)) return null;
    const add = ((row as { add?: unknown }).add ?? []) as unknown;
    const remove = ((row as { remove?: unknown }).remove ?? []) as unknown;
    if (!Array.isArray(add) || !Array.isArray(remove)) return null;
    out.push({
      program,
      add: add.map(String).filter(isObjectId),
      remove: remove.map(String).filter(isObjectId),
    });
  }
  return out;
}

/**
 * Persists the admin's staged add/remove edits to each changed program's
 * allowlist. Sends only the changes (not an absolute set) so a concurrent
 * editor is not clobbered — see the service comment.
 */
export async function saveProgramAdmissionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = String(formData.get('eventId') ?? '').trim();
  const changes = parseChanges(String(formData.get('changes') ?? ''));

  if (!isObjectId(eventId)) return { error: 'Bad event id.' };
  if (!changes) return { error: 'Invalid changes payload.' };

  const pending = changes.filter((c) => c.add.length || c.remove.length);
  if (pending.length === 0) return undefined;

  try {
    for (const { program, add, remove } of pending) {
      await ticketsApiPatch<
        ProgramAdmission,
        { add: string[]; remove: string[] }
      >(`/admin/events/${eventId}/program-admission/${program}`, { add, remove });
    }
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : 'Could not save program admission. Some changes may have applied — refresh and review.',
    };
  }

  revalidatePath(`/tickets-command/events/${eventId}`);
  return undefined;
}
