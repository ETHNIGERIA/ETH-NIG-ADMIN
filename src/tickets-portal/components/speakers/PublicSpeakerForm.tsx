'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ImagePlus, Save } from 'lucide-react';
import {
  createPublicSpeakerAction,
  updatePublicSpeakerAction,
  type SpeakerActionState,
} from '@/tickets-portal/actions/public-speakers';
import type { EventOption } from '@/tickets-portal/components/ui/EventFilter';
import type { PublicSpeaker } from '@/tickets-portal/types/public-speakers';

const inputClass = 'w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-900/10 disabled:bg-stone-50';
const labelClass = 'mb-1.5 block text-sm font-medium text-stone-800';
const hintClass = 'mt-1.5 text-xs leading-relaxed text-stone-500';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function PhotoField({ initialUrl, onUploadingChange }: { initialUrl: string; onUploadingChange: (value: boolean) => void }) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setError('');
    if (!file.type.startsWith('image/')) return setError('Choose an image file.');
    if (file.size > MAX_PHOTO_BYTES) return setError('Image must be 5 MB or smaller.');
    setUploading(true);
    onUploadingChange(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: data });
      const body: { uploadResult?: { secure_url?: string } } = await response.json().catch(() => ({}));
      if (!response.ok || !body.uploadResult?.secure_url) throw new Error('Upload failed');
      setUrl(body.uploadResult.secure_url);
    } catch {
      setError('Photo upload failed. Try again or paste an image URL.');
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
        {url ? <img src={url} alt="Speaker portrait preview" className="h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8 text-stone-300" />}
      </div>
      <div className="min-w-0 space-y-3">
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          {uploading ? 'Uploading photo…' : url ? 'Replace photo' : 'Upload photo'}
          <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }} />
        </label>
        <div>
          <label htmlFor="speaker-avatar" className="sr-only">Photo URL</label>
          <input id="speaker-avatar" name="avatarUrl" type="url" value={url} onChange={(event) => setUrl(event.target.value)} className={inputClass} placeholder="Or paste an image URL" />
        </div>
        <p className={hintClass}>JPG, PNG or WebP, up to 5 MB. This portrait appears on the public site.</p>
        {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}

export function PublicSpeakerForm({
  speaker,
  events,
  initialEventSlug = '',
  returnTo,
  lockedEventSlug,
}: {
  speaker?: PublicSpeaker;
  events: EventOption[] | null;
  initialEventSlug?: string;
  returnTo?: string;
  lockedEventSlug?: string;
}) {
  const action = speaker ? updatePublicSpeakerAction : createPublicSpeakerAction;
  const [state, formAction, pending] = useActionState(action, {} as SpeakerActionState);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState(speaker?.name ?? '');
  const [title, setTitle] = useState(speaker?.title ?? '');
  const [company, setCompany] = useState(speaker?.company ?? '');
  const currentEvent = speaker?.eventSlug || initialEventSlug;
  const [eventSlug, setEventSlug] = useState(currentEvent);
  const [order, setOrder] = useState(String(speaker?.order ?? 0));
  const [isActive, setIsActive] = useState(speaker?.isActive ?? true);
  const [bio, setBio] = useState(speaker?.bio ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(speaker?.linkedinUrl ?? '');
  const [twitterUrl, setTwitterUrl] = useState(speaker?.twitterUrl ?? '');
  const eventInOptions = events?.some((event) => event.slug === currentEvent);

  return (
    <form action={formAction} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      {speaker ? <input type="hidden" name="id" value={speaker._id} /> : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <div className="space-y-6">
        {state.error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</div> : null}

        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 border-b border-stone-100 pb-4">
            <h2 className="text-base font-semibold text-stone-900">Speaker profile</h2>
            <p className="mt-1 text-sm text-stone-500">The name, role and portrait visitors will see.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="speaker-name" className={labelClass}>Full name <span className="text-red-600">*</span></label>
              <input id="speaker-name" name="name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} className={inputClass} placeholder="Speaker name" />
            </div>
            <div>
              <label htmlFor="speaker-title" className={labelClass}>Role or title</label>
              <input id="speaker-title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} placeholder="Founder, CEO, Engineer…" />
            </div>
            <div>
              <label htmlFor="speaker-company" className={labelClass}>Company or organisation</label>
              <input id="speaker-company" name="company" value={company} onChange={(event) => setCompany(event.target.value)} className={inputClass} placeholder="Organisation name" />
            </div>
            <div className="sm:col-span-2">
              <span className={labelClass}>Portrait</span>
              <PhotoField initialUrl={speaker?.avatarUrl ?? ''} onUploadingChange={setUploading} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="speaker-bio" className={labelClass}>Biography</label>
              <textarea id="speaker-bio" name="bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={5} className={`${inputClass} resize-y`} placeholder="A short introduction to this speaker" />
              <p className={hintClass}>Saved with the speaker record. The current site cards show name, role and company.</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 border-b border-stone-100 pb-4">
            <h2 className="text-base font-semibold text-stone-900">Links</h2>
            <p className="mt-1 text-sm text-stone-500">Optional profiles kept with the speaker record.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="speaker-linkedin" className={labelClass}>LinkedIn URL</label>
              <input id="speaker-linkedin" name="linkedinUrl" type="url" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className={inputClass} placeholder="https://linkedin.com/in/…" />
            </div>
            <div>
              <label htmlFor="speaker-twitter" className={labelClass}>X URL</label>
              <input id="speaker-twitter" name="twitterUrl" type="url" value={twitterUrl} onChange={(event) => setTwitterUrl(event.target.value)} className={inputClass} placeholder="https://x.com/…" />
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-6">
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-stone-900">Publication</h2>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">Choose where this speaker belongs and whether the event site can show them.</p>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="speaker-event" className={labelClass}>Event <span className="text-red-600">*</span></label>
              {lockedEventSlug ? <><input type="hidden" name="eventSlug" value={lockedEventSlug} /><div className={`${inputClass} bg-stone-50`}>{events?.find((event) => event.slug === lockedEventSlug)?.name || lockedEventSlug}</div></> : events === null ? (
                <input id="speaker-event" name="eventSlug" required value={eventSlug} onChange={(event) => setEventSlug(event.target.value)} className={inputClass} placeholder="event-slug" />
              ) : (
                <select id="speaker-event" name="eventSlug" required value={eventSlug} onChange={(event) => setEventSlug(event.target.value)} className={inputClass}>
                  <option value="">Select an event</option>
                  {currentEvent && !eventInOptions ? <option value={currentEvent}>{currentEvent}</option> : null}
                  {events.map((event) => <option key={event.slug} value={event.slug}>{event.name || event.slug}</option>)}
                </select>
              )}
              <p className={hintClass}>Only speakers assigned to the event appear on its site.</p>
            </div>
            <div>
              <label htmlFor="speaker-order" className={labelClass}>Display order</label>
              <input id="speaker-order" name="order" type="number" min="0" step="1" required value={order} onChange={(event) => setOrder(event.target.value)} className={inputClass} />
              <p className={hintClass}>Lower numbers appear first. Use distinct numbers for a predictable order.</p>
            </div>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3.5">
              <input name="isActive" type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="mt-0.5 h-4 w-4 accent-stone-900" />
              <span>
                <span className="block text-sm font-medium text-stone-900">Visible on event site</span>
                <span className="mt-1 block text-xs leading-relaxed text-stone-500">Uncheck to keep this speaker hidden.</span>
              </span>
            </label>
          </div>

          <div className="mt-6 space-y-3 border-t border-stone-100 pt-5">
            <button type="submit" disabled={pending || uploading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50">
              <Save className="h-4 w-4" /> {pending ? 'Saving…' : speaker ? 'Save changes' : 'Add speaker'}
            </button>
            <Link href={returnTo || '/tickets-command/speakers/public'} className="block rounded-lg border border-stone-200 px-4 py-2.5 text-center text-sm font-medium text-stone-700 hover:bg-stone-50">Cancel</Link>
          </div>
        </section>
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Card preview</p>
          <p className="mt-3 text-lg font-semibold text-stone-900">{name || 'Speaker name'}</p>
          <p className="mt-1 text-sm text-stone-600">{[title, company].filter(Boolean).join(', ') || 'Role and organisation'}</p>
        </div>
      </aside>
    </form>
  );
}
