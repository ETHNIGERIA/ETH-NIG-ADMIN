'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateProgramReviewAction } from '@/tickets-portal/actions/program-review';
import type { ActionState } from '@/tickets-portal/actions/events';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import {
  PROGRAM_APPLICATION_STATUSES,
  fmtDate,
} from '@/tickets-portal/components/programs/shared';

type ReviewNote = { text: string; authorEmail: string; at: string };
type ReviewApp = {
  _id: string;
  status: string;
  score?: number;
  reviewNotes: ReviewNote[];
};

export function ProgramReviewControls({
  app,
  basePath,
}: {
  app: ReviewApp;
  /** e.g. "/admin/hackathon-applications" */
  basePath: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProgramReviewAction,
    undefined as ActionState,
  );
  const toast = useToast();
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (state?.error) {
        toast.error('Could not save', state.error);
      } else {
        toast.success('Saved');
        if (noteRef.current) noteRef.current.value = '';
      }
    }
    wasPending.current = pending;
  }, [pending, state, toast]);

  return (
    <div className="space-y-6 rounded-lg border border-stone-200 bg-white p-5">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-wide text-stone-400">
          Status
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROGRAM_APPLICATION_STATUSES.map((s) => (
            <form key={s} action={formAction}>
              <input type="hidden" name="basePath" value={basePath} />
              <input type="hidden" name="id" value={app._id} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                disabled={pending || app.status === s}
                className="rounded-md border border-stone-200 px-3 py-1.5 text-[13px] capitalize text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              >
                {s}
              </button>
            </form>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-stone-500">
          Current: <span className="font-medium text-stone-700">{app.status}</span>
        </p>
      </div>

      <form action={formAction} className="space-y-3 border-t border-stone-100 pt-4">
        <input type="hidden" name="basePath" value={basePath} />
        <input type="hidden" name="id" value={app._id} />

        <div className="flex items-center gap-2">
          <label htmlFor="pr-score" className="text-[13px] font-medium text-stone-700">
            Score
          </label>
          <select
            id="pr-score"
            name="score"
            key={app.score ?? 'none'}
            defaultValue={app.score ? String(app.score) : ''}
            className="rounded-md border border-stone-200 bg-white px-2 py-1.5 text-[13px]"
          >
            <option value="">— unchanged —</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="clear">Clear</option>
          </select>
          {app.score ? (
            <span className="text-[12px] text-stone-500">now: {app.score}</span>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="pr-note"
            className="mb-1 block text-[13px] font-medium text-stone-700"
          >
            Add a note
          </label>
          <textarea
            id="pr-note"
            name="noteText"
            ref={noteRef}
            rows={3}
            maxLength={4000}
            placeholder="Internal — visible to reviewers only"
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-[14px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save score / note'}
        </button>
      </form>

      <div className="border-t border-stone-100 pt-4">
        <p className="text-[12px] font-medium uppercase tracking-wide text-stone-400">
          Notes ({app.reviewNotes.length})
        </p>
        {app.reviewNotes.length === 0 ? (
          <p className="mt-2 text-[13px] text-stone-400">No notes yet.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {[...app.reviewNotes]
              .sort((a, b) => +new Date(b.at) - +new Date(a.at))
              .map((n, i) => (
                <li key={i} className="text-[13px]">
                  <p className="text-stone-700 whitespace-pre-wrap">{n.text}</p>
                  <p className="mt-0.5 text-[12px] text-stone-400">
                    {n.authorEmail} · {fmtDate(n.at, true)}
                  </p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
