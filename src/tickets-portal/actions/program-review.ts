'use server';

import { revalidatePath } from 'next/cache';
import { ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import { isObjectId } from '@/tickets-portal/lib/is-object-id';
import type { ActionState } from '@/tickets-portal/actions/events';
import { PROGRAM_APPLICATION_STATUSES } from '@/tickets-portal/components/programs/shared';

const ALLOWED_BASE_PATHS = new Set([
  '/admin/hackathon-applications',
  '/admin/pitch-applications',
]);

/**
 * Review one program application: set status, set/clear the 1-10 score, and/or
 * append one note. `basePath` picks the program; the backend stamps the note
 * with the acting admin's email.
 */
export async function updateProgramReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const basePath = String(formData.get('basePath') ?? '').trim();
  const id = String(formData.get('id') ?? '').trim();
  if (!ALLOWED_BASE_PATHS.has(basePath)) return { error: 'Unknown program.' };
  if (!isObjectId(id)) return { error: 'Bad application id.' };

  const body: { status?: string; score?: number | null; noteText?: string } = {};

  const status = String(formData.get('status') ?? '').trim();
  if (status) {
    if (!PROGRAM_APPLICATION_STATUSES.includes(status as never)) {
      return { error: 'Invalid status.' };
    }
    body.status = status;
  }

  const scoreRaw = String(formData.get('score') ?? '').trim();
  if (scoreRaw === 'clear') {
    body.score = null;
  } else if (scoreRaw) {
    const n = Number(scoreRaw);
    if (!Number.isInteger(n) || n < 1 || n > 10) {
      return { error: 'Score must be a whole number from 1 to 10.' };
    }
    body.score = n;
  }

  const noteText = String(formData.get('noteText') ?? '').trim();
  if (noteText) body.noteText = noteText;

  if (Object.keys(body).length === 0) return { error: 'Nothing to save.' };

  try {
    await ticketsApiPatch(`${basePath}/${id}`, body);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not save the review.' };
  }

  const uiPath = basePath.replace('/admin/', '/tickets-command/programs/').replace(
    '-applications',
    '',
  );
  revalidatePath(uiPath);
  revalidatePath(`${uiPath}/${id}`);
  return undefined;
}
