'use server';

import { unstable_rethrow } from 'next/navigation';
import { ticketsApiGet, ticketsApiPost } from '@/tickets-portal/lib/tickets-api.server';
import { isObjectId } from '@/tickets-portal/lib/is-object-id';
import { BULK_IDS_MAX } from '@/tickets-portal/lib/bulk-ids';
import {
  MESSAGE_BODY_MAX,
  MESSAGE_SUBJECT_MAX,
  MESSAGE_TARGETS,
  type AdminMessageRow,
  type MessageTarget,
} from '@/tickets-portal/types/admin-messages';

export type SendMessageState = { error?: string; queued?: number; notFound?: number } | undefined;

export async function sendAdminMessageAction(input: {
  targetType: MessageTarget;
  ids: string[];
  subject: string;
  body: string;
  requestKey: string;
}): Promise<SendMessageState> {
  const ids = [...new Set(input.ids)];
  const subject = input.subject.trim();
  const body = input.body.trim();

  if (!MESSAGE_TARGETS.includes(input.targetType)) return { error: 'Unknown recipient type.' };
  if (ids.length === 0) return { error: 'Choose at least one recipient.' };
  if (ids.length > BULK_IDS_MAX) return { error: `Choose at most ${BULK_IDS_MAX} recipients at a time.` };
  if (!ids.every(isObjectId)) return { error: 'Bad recipient selection.' };
  if (!subject || subject.length > MESSAGE_SUBJECT_MAX) {
    return { error: `Subject is required (max ${MESSAGE_SUBJECT_MAX} characters).` };
  }
  if (!body || body.length > MESSAGE_BODY_MAX) {
    return { error: `Message is required (max ${MESSAGE_BODY_MAX} characters).` };
  }
  if (input.requestKey.length < 8 || input.requestKey.length > 100) return { error: 'Bad request key.' };

  try {
    const res = await ticketsApiPost<{ queued: number; notFound: string[] }>('/admin/messages', {
      targetType: input.targetType,
      ids,
      subject,
      body,
      requestKey: input.requestKey,
    });
    return { queued: res.queued, notFound: res.notFound.length };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not send the message.' };
  }
}

export async function listAdminMessagesAction(
  targetType: MessageTarget,
  targetId: string,
): Promise<{ items?: AdminMessageRow[]; error?: string }> {
  if (!MESSAGE_TARGETS.includes(targetType) || !isObjectId(targetId)) return { error: 'Bad record.' };
  try {
    const query = new URLSearchParams({ targetType, targetId });
    return { items: await ticketsApiGet<AdminMessageRow[]>(`/admin/messages?${query}`) };
  } catch (e) {
    unstable_rethrow(e);
    return { error: e instanceof Error ? e.message : 'Could not load messages.' };
  }
}
