'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react';
import {
  createPromoCodeAction,
  deletePromoCodeAction,
  updatePromoCodeAction,
} from '@/tickets-portal/actions/promo-codes';
import type { AdminPromoCode } from '@/tickets-portal/types/admin-promo-codes';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import { ConfirmDialog } from '@/tickets-portal/components/ui/ConfirmDialog';
import { useToast } from '@/tickets-portal/components/ui/ToastProvider';
import {
  FormModal,
  FormModalActions,
  ListToolbar,
  NETWORK_ERROR,
  dangerIconButtonClass,
  formFieldClass,
  formHintClass,
  formLabelClass,
  iconButtonClass,
  primaryButtonClass,
} from '@/tickets-portal/components/ui/FormModal';

type OwnerKind = 'influencer' | 'community' | 'event';
type FormTarget = { mode: 'create' } | { mode: 'edit'; code: AdminPromoCode };

type OwnerProps = {
  events: Array<{ id: string; name: string }>;
  /** 'event' = ownerless code locked to the event `ownerId` */
  ownerKind: OwnerKind;
  ownerId: string;
};

function PromoCodeFormModal({
  target,
  events,
  ownerKind,
  ownerId,
  onClose,
  onSaved,
}: OwnerProps & {
  target: FormTarget;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const code = target.mode === 'edit' ? target.code : undefined;
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = code
          ? await updatePromoCodeAction(undefined, formData)
          : await createPromoCodeAction(undefined, formData);
        if (res?.error) {
          setError(res.error);
          return;
        }
        onSaved(code ? `Promo code ${code.code} updated.` : 'Promo code created.');
      } catch {
        setError(NETWORK_ERROR);
      }
    });
  };

  const description =
    ownerKind === 'event'
      ? 'This code has no influencer or community and only works for this event.'
      : `This code belongs to this ${ownerKind}. Sales made with it count towards them, and the owner cannot be changed later.`;

  return (
    <FormModal
      title={code ? `Edit ${code.code}` : 'New promo code'}
      description={description}
      error={error}
      isPending={isPending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="ownerKind" value={ownerKind} />
        <input type="hidden" name="ownerId" value={ownerId} />
        {code ? <input type="hidden" name="promoId" value={code._id} /> : null}

        <div className="sm:col-span-2">
          <label className={formLabelClass} htmlFor="promo-code">
            Code
          </label>
          <input
            id="promo-code"
            name="code"
            required
            defaultValue={code?.code}
            placeholder="SAVE20"
            className={`${formFieldClass} font-mono uppercase`}
          />
          <p className={formHintClass}>What buyers type at checkout. Not case-sensitive.</p>
        </div>

        <div>
          <label className={formLabelClass} htmlFor="promo-type">
            Discount type
          </label>
          <select id="promo-type" name="discountType" required defaultValue={code?.discountType ?? 'percentage'} className={formFieldClass}>
            <option value="percentage">Percentage off</option>
            <option value="fixed">Fixed amount off (NGN)</option>
          </select>
        </div>
        <div>
          <label className={formLabelClass} htmlFor="promo-value">
            Discount value
          </label>
          <input
            id="promo-value"
            name="discountValue"
            type="number"
            min={0}
            step={0.01}
            required
            defaultValue={code ? (code.discountType === 'fixed' ? code.discountValue / 100 : code.discountValue) : undefined}
            className={formFieldClass}
          />
          <p className={formHintClass}>0–100 for percentage, or Naira. Applies to the whole order.</p>
        </div>

        <div className={ownerKind === 'event' ? 'sm:col-span-2' : undefined}>
          <label className={formLabelClass} htmlFor="promo-max">
            Max tickets (optional)
          </label>
          <input
            id="promo-max"
            name="maxUses"
            type="number"
            min={0}
            step={1}
            defaultValue={code?.maxUses ?? ''}
            className={formFieldClass}
          />
          <p className={formHintClass}>
            Counts tickets, not orders (an order of 3 uses 3).{' '}
            Blank = no limit.
          </p>
        </div>

        {ownerKind === 'event' ? (
          <input type="hidden" name="eventId" value={ownerId} />
        ) : (
          <div>
            <label className={formLabelClass} htmlFor="promo-event">
              Works for
            </label>
            <select id="promo-event" name="eventId" defaultValue={code?.eventId ?? ''} className={formFieldClass}>
              <option value="">All events</option>
              {/* Keep the current scope selectable even if its event is outside the loaded list,
                  otherwise saving would silently make the code global. */}
              {code?.eventId && !events.some((e) => e.id === code.eventId) ? (
                <option value={code.eventId}>Current event (not in list) only</option>
              ) : null}
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} only
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
          <input type="checkbox" name="isActive" defaultChecked={code?.isActive ?? true} className="h-4 w-4 rounded border-stone-300" />
          Active (inactive codes are rejected at checkout)
        </label>

        <FormModalActions isPending={isPending} onCancel={onClose} submitLabel={code ? 'Save changes' : 'Create code'} />
      </form>
    </FormModal>
  );
}

export function PromoCodesManager({ codes, events, ownerKind, ownerId }: OwnerProps & { codes: AdminPromoCode[] }) {
  const router = useRouter();
  const toast = useToast();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPromoCode | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const eventNameById = useMemo(() => new Map(events.map((e) => [e.id, e.name])), [events]);

  const handleSaved = (message: string) => {
    setFormTarget(null);
    toast.success(message);
    router.refresh();
  };

  const handleDelete = (p: AdminPromoCode) => {
    const fd = new FormData();
    fd.set('promoId', p._id);
    fd.set('ownerKind', ownerKind);
    fd.set('ownerId', ownerId);
    startDelete(async () => {
      const res = await deletePromoCodeAction(undefined, fd).catch(() => ({ error: NETWORK_ERROR }));
      if (res?.error) {
        toast.error('Could not delete promo code', res.error);
        return;
      }
      setDeleteTarget(null);
      toast.success('Promo code deleted', `${p.code} no longer works at checkout.`);
      router.refresh();
    });
  };

  const worksFor = (p: AdminPromoCode) =>
    p.eventId ? eventNameById.get(p.eventId) ?? 'One event' : 'All events';
  const discountLabel = (p: AdminPromoCode) =>
    p.discountType === 'percentage' ? `${p.discountValue}% off` : `${formatMinorToNgn(p.discountValue)} off`;

  const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-500';
  const td = 'px-4 py-3 align-top text-sm text-stone-700';

  return (
    <div className="space-y-5">
      <ListToolbar
        summary={`${codes.length} ${codes.length === 1 ? 'code' : 'codes'}`}
        action={
          <button type="button" onClick={() => setFormTarget({ mode: 'create' })} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            New promo code
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-stone-200/90 bg-white shadow-sm">
        {codes.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <TicketPercent className="mx-auto mb-3 h-10 w-10 text-stone-300" />
            <p className="font-semibold text-stone-800">No promo codes yet</p>
            <p className="mt-1 text-xs text-stone-400">Create a code, then share it with buyers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-stone-200/80 bg-stone-50/75">
                <tr>
                  <th className={th}>Code</th>
                  <th className={th}>Discount</th>
                  {ownerKind !== 'event' ? <th className={th}>Works for</th> : null}
                  <th className={th}>Tickets used</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {codes.map((p) => (
                  <tr key={p._id} className="transition-colors hover:bg-stone-50/50">
                    <td className={td}>
                      <p className="font-mono text-[13px] font-semibold text-stone-900">{p.code}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-stone-400" title="Tracking reference">
                        ref {p.trackingRef}
                      </p>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{discountLabel(p)}</td>
                    {ownerKind !== 'event' ? (
                      <td className={`${td} max-w-[180px] truncate text-xs text-stone-600`}>{worksFor(p)}</td>
                    ) : null}
                    <td className={`${td} whitespace-nowrap tabular-nums text-xs`}>
                      {p.usageCount}
                      {p.maxUses != null ? ` / ${p.maxUses}` : ' (no limit)'}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          p.isActive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-stone-200 bg-stone-100 text-stone-600'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setFormTarget({ mode: 'edit', code: p })}
                          title="Edit code"
                          aria-label={`Edit ${p.code}`}
                          className={iconButtonClass}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete code"
                          aria-label={`Delete ${p.code}`}
                          className={dangerIconButtonClass}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formTarget && (
        <PromoCodeFormModal
          target={formTarget}
          events={events}
          ownerKind={ownerKind}
          ownerId={ownerId}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          isLoading={isDeleting}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          variant="danger"
          title="Delete promo code"
          description={`Delete ${deleteTarget.code}?`}
          implications={[
            'Buyers can no longer use it at checkout.',
            'Past sales made with it stay recorded.',
            'To pause it instead, edit the code and untick Active.',
          ]}
          confirmLabel="Delete code"
        />
      )}
    </div>
  );
}
