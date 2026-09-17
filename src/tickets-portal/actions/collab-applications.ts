'use server';

import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { ticketsApiDelete, ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import {
  COLLAB_APPLICATION_STATUSES,
  type CollabApplicationKind,
  type CollabApplicationStatus,
} from '@/tickets-portal/types/admin-collab-applications';

export type CollabActionResult = { error?: string; ok?: boolean };

const CONFIG: Record<CollabApplicationKind, { api: string; page: string }> = {
  sponsor: { api: '/admin/sponsor-applications', page: '/tickets-command/sponsors' },
  speaker: { api: '/admin/speaker-applications', page: '/tickets-command/speakers' },
};

const OBJECT_ID = /^[a-f0-9]{24}$/i;

function resolve(kind: unknown, id: unknown) {
  if (kind !== 'sponsor' && kind !== 'speaker') return null;
  if (typeof id !== 'string' || !OBJECT_ID.test(id)) return null;
  return { ...CONFIG[kind], id };
}

export async function updateCollabApplicationStatusAction(
  kind: CollabApplicationKind,
  id: string,
  status: CollabApplicationStatus,
): Promise<CollabActionResult> {
  const target = resolve(kind, id);
  if (!target) return { error: 'Invalid application.' };
  if (!COLLAB_APPLICATION_STATUSES.includes(status)) return { error: 'Invalid status.' };
  try {
    await ticketsApiPatch(`${target.api}/${target.id}/status`, { status });
  } catch (e) {
    unstable_rethrow(e); // let redirect() to login propagate
    return { error: e instanceof Error ? e.message : 'Could not update application.' };
  }
  revalidatePath(target.page);
  return { ok: true };
}

export async function deleteCollabApplicationAction(
  kind: CollabApplicationKind,
  id: string,
): Promise<CollabActionResult> {
  const target = resolve(kind, id);
  if (!target) return { error: 'Invalid application.' };
  try {
    await ticketsApiDelete(`${target.api}/${target.id}`);
  } catch (e) {
    unstable_rethrow(e); // let redirect() to login propagate
    return { error: e instanceof Error ? e.message : 'Could not delete application.' };
  }
  revalidatePath(target.page);
  return { ok: true };
}
