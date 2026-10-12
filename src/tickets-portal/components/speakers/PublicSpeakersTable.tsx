'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { setPublicSpeakerVisibilityAction } from '@/tickets-portal/actions/public-speakers';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import { EmptyState, TableCard, tableTd, tableTh } from '@/tickets-portal/components/ui/TableCard';
import type { PublicSpeaker } from '@/tickets-portal/types/public-speakers';
import { Mic } from 'lucide-react';

export function PublicSpeakersTable({ speakers, basePath = '/tickets-command/speakers/public' }: { speakers: PublicSpeaker[]; basePath?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  function setVisibility(speaker: PublicSpeaker) {
    startTransition(async () => {
      const next = !speaker.isActive;
      const result = await setPublicSpeakerVisibilityAction(speaker._id, next);
      if (result.error) toast.error('Could not update speaker', result.error);
      else {
        toast.success(next ? 'Speaker shown' : 'Speaker hidden', speaker.name);
        router.refresh();
      }
    });
  }

  return (
    <TableCard
      isEmpty={speakers.length === 0}
      empty={<EmptyState icon={Mic} title="No public speakers found" hint="Add a speaker or change the event filter." />}
      minWidth="min-w-[760px]"
      head={
        <>
          <th className={tableTh}>Speaker</th>
          <th className={tableTh}>Event</th>
          <th className={tableTh}>Order</th>
          <th className={tableTh}>Visibility</th>
          <th className={`${tableTh} text-right`}>Actions</th>
        </>
      }
    >
      {speakers.map((speaker) => (
        <tr key={speaker._id} className="transition-colors hover:bg-stone-50/70">
          <td className={tableTd}>
            <div className="flex items-center gap-3">
              {speaker.avatarUrl ? (
                <img src={speaker.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-stone-200 object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-lg font-semibold text-stone-500">
                  {speaker.name.charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <Link href={`${basePath}/${speaker._id}`} className="font-semibold text-stone-900 hover:underline">
                  {speaker.name}
                </Link>
                <p className="truncate text-xs text-stone-500">{[speaker.title, speaker.company].filter(Boolean).join(' · ') || 'No role added'}</p>
              </div>
            </div>
          </td>
          <td className={`${tableTd} text-xs`}>{speaker.eventSlug || <span className="text-amber-700">No event</span>}</td>
          <td className={`${tableTd} tabular-nums`}>{speaker.order ?? 0}</td>
          <td className={tableTd}>
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${speaker.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-stone-100 text-stone-600'}`}>
              {speaker.isActive ? 'Visible' : 'Hidden'}
            </span>
          </td>
          <td className={`${tableTd} text-right`}>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setVisibility(speaker)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                {speaker.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {speaker.isActive ? 'Hide' : 'Show'}
              </button>
              <Link href={`${basePath}/${speaker._id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-stone-900 hover:bg-stone-100">
                Edit <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </td>
        </tr>
      ))}
    </TableCard>
  );
}
