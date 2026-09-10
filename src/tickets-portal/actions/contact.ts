'use server';

import { revalidatePath } from 'next/cache';
import { ticketsApiPatch } from '@/tickets-portal/lib/tickets-api.server';
import { isObjectId } from '@/tickets-portal/lib/is-object-id';
import type { ActionState } from '@/tickets-portal/actions/events';
import { CONTACT_MESSAGE_STATUSES } from '@/tickets-portal/types/admin-contact';

export async function updateContactMessageStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  if (!isObjectId(id)) return { error: 'Bad message id.' };
  if (!CONTACT_MESSAGE_STATUSES.includes(status as never)) {
    return { error: 'Invalid status.' };
  }

  try {
    await ticketsApiPatch(`/admin/contact-messages/${id}/status`, { status });
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not update the message.' };
  }

  revalidatePath('/tickets-command/contact');
  return undefined;
}
