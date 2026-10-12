'use server';

import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';
import { ticketsApiPost, ticketsApiPut } from '@/tickets-portal/lib/tickets-api.server';
import type { PublicSpeaker } from '@/tickets-portal/types/public-speakers';

const LIST_PATH = '/tickets-command/speakers/public';
const OBJECT_ID = /^[a-f0-9]{24}$/i;
const EVENT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function speakerReturnTo(form: FormData) {
  const path = String(form.get('returnTo') ?? '');
  return /^\/tickets-command\/events-v2\/[a-f0-9]{24}\/speakers$/i.test(path) ? path : LIST_PATH;
}

export type SpeakerActionState = { error?: string };

function readSpeaker(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? '').trim();
  const name = text('name');
  const eventSlug = text('eventSlug').toLowerCase();
  const orderInput = text('order');
  const order = Number(orderInput);

  if (!name || name.length > 160) throw new Error('Enter a name of up to 160 characters.');
  if (!EVENT_SLUG.test(eventSlug)) throw new Error('Select a valid event.');
  if (!Number.isSafeInteger(order) || order < 0) throw new Error('Display order must be a whole number of zero or greater.');

  const urls = ['avatarUrl', 'twitterUrl', 'linkedinUrl'] as const;
  for (const key of urls) {
    const value = text(key);
    if (value) {
      try {
        const url = new URL(value);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
      } catch {
        throw new Error(`${key === 'avatarUrl' ? 'Photo' : key === 'twitterUrl' ? 'X profile' : 'LinkedIn profile'} must be an HTTP or HTTPS URL.`);
      }
    }
  }

  return {
    name,
    eventSlug,
    title: text('title'),
    company: text('company'),
    bio: text('bio'),
    avatarUrl: text('avatarUrl'),
    twitterUrl: text('twitterUrl'),
    linkedinUrl: text('linkedinUrl'),
    order,
    isActive: form.get('isActive') === 'on',
  };
}

export async function createPublicSpeakerAction(_state: SpeakerActionState, form: FormData): Promise<SpeakerActionState> {
  let destination = LIST_PATH;
  try {
    const payload = readSpeaker(form);
    destination = speakerReturnTo(form);
    await ticketsApiPost<PublicSpeaker>('/admin/public-speakers', payload);
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof Error ? error.message : 'Could not create speaker.' };
  }
  revalidatePath(LIST_PATH);
  revalidatePath(destination);
  redirect(`${destination}?created=1`);
}

export async function updatePublicSpeakerAction(_state: SpeakerActionState, form: FormData): Promise<SpeakerActionState> {
  const id = String(form.get('id') ?? '');
  if (!OBJECT_ID.test(id)) return { error: 'Invalid speaker.' };
  let destination = LIST_PATH;
  try {
    const payload = readSpeaker(form);
    destination = speakerReturnTo(form);
    await ticketsApiPut<PublicSpeaker>(`/admin/public-speakers/${id}`, payload);
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof Error ? error.message : 'Could not update speaker.' };
  }
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  revalidatePath(destination);
  redirect(`${destination}?updated=1`);
}

export async function setPublicSpeakerVisibilityAction(id: string, isActive: boolean): Promise<SpeakerActionState> {
  if (!OBJECT_ID.test(id)) return { error: 'Invalid speaker.' };
  try {
    await ticketsApiPut<PublicSpeaker>(`/admin/public-speakers/${id}`, { isActive });
  } catch (error) {
    unstable_rethrow(error);
    return { error: error instanceof Error ? error.message : 'Could not update visibility.' };
  }
  revalidatePath(LIST_PATH);
  revalidatePath(`${LIST_PATH}/${id}`);
  return {};
}
