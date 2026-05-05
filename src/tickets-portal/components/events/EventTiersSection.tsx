'use client';

import { useActionState, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  createTierAction,
  deleteTierAction,
  updateTierAction,
} from '@/tickets-portal/actions/tiers';
import type { ActionState } from '@/tickets-portal/actions/events';
import type { AdminTicketTier } from '@/tickets-portal/types/admin-tiers';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import { minorToNairaInput } from '@/tickets-portal/lib/money-input';
import { normalizeDocumentId } from '@/tickets-portal/lib/mongo-json';
import { toDatetimeLocalValue } from '@/tickets-portal/lib/datetime-local';
import { BenefitsListEditor } from '@/tickets-portal/components/events/BenefitsListEditor';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

function tierId(t: AdminTicketTier) {
  return normalizeDocumentId(t._id);
}

function EmptyTiersIllustration() {
  return (
    <svg
      className="mx-auto h-24 w-32 text-stone-300"
      viewBox="0 0 120 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="8" y="18" width="104" height="54" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M44 18v54M76 18v54" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="60" cy="48" r="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M56 48l2.5 2.5L66 43"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TierSlideout({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tier-slideout-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 id="tier-slideout-title" className="text-[16px] font-semibold text-stone-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[20px] leading-none text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">{children}</div>
      </div>
    </div>
  );
}

function EarlyBirdFields({
  idPrefix,
  tier,
  showClear,
}: {
  idPrefix: string;
  tier?: AdminTicketTier;
  /** Edit mode: offer to wipe early bird if tier already has it */
  showClear?: boolean;
}) {
  const hasEb =
    tier &&
    (tier.earlyBirdEndsAt ||
      tier.earlyBirdPriceMinor != null ||
      (tier.earlyBirdCapacity != null && tier.earlyBirdCapacity > 0));

  const endsDefault = tier?.earlyBirdEndsAt ? toDatetimeLocalValue(tier.earlyBirdEndsAt) : '';
  const priceDefault =
    tier?.earlyBirdPriceMinor != null ? minorToNairaInput(tier.earlyBirdPriceMinor) : '';
  const capDefault =
    tier?.earlyBirdCapacity != null && tier.earlyBirdCapacity > 0 ? String(tier.earlyBirdCapacity) : '';

  return (
    <div className="space-y-3 border-t border-stone-100 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Early bird (optional)</p>
      <p className="text-[12px] text-stone-500">
        Lower price until a deadline and/or a limited pool. Matches checkout behaviour on the API.
      </p>
      <div>
        <label className={labelClass} htmlFor={`${idPrefix}-eb-end`}>
          Ends at <span className="font-normal text-stone-400">(local)</span>
        </label>
        <input
          id={`${idPrefix}-eb-end`}
          name="earlyBirdEndsAt"
          type="datetime-local"
          defaultValue={endsDefault}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-eb-price`}>
            Early bird price (NGN)
          </label>
          <input
            id={`${idPrefix}-eb-price`}
            name="earlyBirdPriceMajor"
            type="number"
            step="0.01"
            min="0"
            defaultValue={priceDefault}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${idPrefix}-eb-cap`}>
            Early bird cap
          </label>
          <input
            id={`${idPrefix}-eb-cap`}
            name="earlyBirdCapacity"
            type="number"
            min="0"
            defaultValue={capDefault}
            className={fieldClass}
            placeholder="Seats at early price"
          />
        </div>
      </div>
      {showClear && hasEb ? (
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-stone-700">
          <input type="checkbox" name="clearEarlyBird" value="on" className="rounded border-stone-300" />
          Clear early bird (remove deadline, price, and cap)
        </label>
      ) : null}
    </div>
  );
}

function AddTierForm({ eventId, onDone }: { eventId: string; onDone?: () => void }) {
  const [state, action, pending] = useActionState(createTierAction, undefined as ActionState);
  const [isFree, setIsFree] = useState(false);

  return (
    <div>
      {state?.error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {state.error}
        </div>
      ) : null}
      <form action={action} className="space-y-4">
        <input type="hidden" name="eventId" value={eventId} />
        <div>
          <label className={labelClass} htmlFor="new-tier-name">
            Name
          </label>
          <input
            id="new-tier-name"
            name="name"
            required
            className={fieldClass}
            placeholder="General admission"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="new-tier-desc">
            Description <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea id="new-tier-desc" name="description" rows={2} className={`${fieldClass} resize-y`} />
        </div>
        <div>
          <label className={labelClass}>Benefits</label>
          <p className="mb-2 text-[12px] text-stone-500">Shown as a checklist to attendees — same order as below.</p>
          <BenefitsListEditor name="benefits" initialItems={[]} idPrefix="new-tier-ben" />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[14px] text-stone-700">
          <input
            type="checkbox"
            name="isFree"
            value="on"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="rounded border-stone-300"
          />
          Free tier
        </label>
        {!isFree ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="new-price">
                Price (NGN)
              </label>
              <input
                id="new-price"
                name="priceMajor"
                type="number"
                step="0.01"
                min="0"
                required={!isFree}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="new-currency">
                Currency
              </label>
              <input id="new-currency" name="currency" className={fieldClass} defaultValue="NGN" />
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="priceMajor" value="0" />
            <input type="hidden" name="currency" value="" />
          </>
        )}
        <div>
          <label className={labelClass} htmlFor="new-cap">
            Capacity <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input id="new-cap" name="capacity" type="number" min="0" className={fieldClass} />
        </div>
        {!isFree ? <EarlyBirdFields idPrefix="new-eb" /> : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-stone-900 px-4 py-2 text-[14px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {pending ? 'Adding…' : 'Save tier'}
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-md border border-stone-200 px-4 py-2 text-[14px] text-stone-600 hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function TierRow({ tier, eventId }: { tier: AdminTicketTier; eventId: string }) {
  const id = tierId(tier);
  const [updateState, updateAction, updatePending] = useActionState(updateTierAction, undefined as ActionState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTierAction, undefined as ActionState);
  const [isFree, setIsFree] = useState(tier.isFree);
  const soldOut = tier.status === 'sold_out';

  return (
    <tbody className="border-b border-stone-100 last:border-0">
      <tr className="align-middle">
        <td className="py-3 pr-4 font-medium text-stone-900">{tier.name}</td>
        <td className="py-3 pr-4 tabular-nums text-stone-700">
          {tier.isFree ? 'Free' : formatMinorToNgn(tier.priceMinor)}
        </td>
        <td className="py-3 pr-4 capitalize text-stone-600">{tier.status}</td>
        <td className="py-3 pr-4 tabular-nums text-stone-600">
          {tier.soldCount}
          {tier.capacity != null ? ` / ${tier.capacity}` : ''}
        </td>
        <td className="py-3 text-right">
          <form action={deleteAction} className="inline">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="tierId" value={id} />
            <button
              type="submit"
              disabled={deletePending}
              className="rounded-md px-2.5 py-1 text-[13px] text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
            >
              {deletePending ? '…' : 'Remove'}
            </button>
          </form>
          {deleteState?.error ? (
            <p className="mt-1 text-[12px] text-red-700">{deleteState.error}</p>
          ) : null}
        </td>
      </tr>
      {soldOut ? (
        <tr>
          <td colSpan={5} className="pb-2 pt-0 text-[12px] text-amber-800">
            Sold out — adjust capacity in the API if you need more inventory.
          </td>
        </tr>
      ) : (
        <tr>
          <td colSpan={5} className="bg-stone-50/60 p-0">
            <details className="border-t border-stone-100">
              <summary className="cursor-pointer list-none px-4 py-2.5 text-[13px] font-medium text-stone-700 hover:bg-stone-100/80 [&::-webkit-details-marker]:hidden">
                Edit tier
              </summary>
              <div className="border-t border-stone-100 px-4 pb-4 pt-3">
                {updateState?.error ? (
                  <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
                    {updateState.error}
                  </div>
                ) : null}
                <form action={updateAction} className="max-w-lg space-y-3">
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="tierId" value={id} />
                  <div>
                    <label className={labelClass} htmlFor={`name-${id}`}>
                      Name
                    </label>
                    <input id={`name-${id}`} name="name" required defaultValue={tier.name} className={fieldClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`desc-${id}`}>
                      Description
                    </label>
                    <textarea
                      id={`desc-${id}`}
                      name="description"
                      rows={2}
                      defaultValue={tier.description ?? ''}
                      className={`${fieldClass} resize-y`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Benefits</label>
                    <p className="mb-2 text-[12px] text-stone-500">Preview matches the public checklist.</p>
                    <BenefitsListEditor
                      key={`ben-${id}-${(tier.benefits ?? []).join('|')}`}
                      name="benefits"
                      initialItems={tier.benefits ?? []}
                      idPrefix={`ben-${id}`}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-stone-700">
                    <input
                      type="checkbox"
                      name="isFree"
                      value="on"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="rounded border-stone-300"
                    />
                    Free tier
                  </label>
                  {!isFree ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor={`price-${id}`}>
                          Price (NGN)
                        </label>
                        <input
                          id={`price-${id}`}
                          name="priceMajor"
                          type="number"
                          step="0.01"
                          min="0"
                          required={!isFree}
                          defaultValue={minorToNairaInput(tier.priceMinor)}
                          className={fieldClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass} htmlFor={`cur-${id}`}>
                          Currency
                        </label>
                        <input
                          id={`cur-${id}`}
                          name="currency"
                          defaultValue={tier.currency ?? 'NGN'}
                          className={fieldClass}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <input type="hidden" name="priceMajor" value="0" />
                      <input type="hidden" name="currency" value="" />
                    </>
                  )}
                  <div>
                    <label className={labelClass} htmlFor={`cap-${id}`}>
                      Capacity
                    </label>
                    <input
                      id={`cap-${id}`}
                      name="capacity"
                      type="number"
                      min="0"
                      defaultValue={tier.capacity ?? ''}
                      className={fieldClass}
                    />
                  </div>
                  {!isFree ? <EarlyBirdFields idPrefix={`eb-${id}`} tier={tier} showClear /> : null}
                  <div>
                    <label className={labelClass} htmlFor={`st-${id}`}>
                      Status
                    </label>
                    <select id={`st-${id}`} name="status" defaultValue={tier.status} className={fieldClass}>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={updatePending}
                    className="rounded-md bg-stone-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {updatePending ? 'Saving…' : 'Save tier'}
                  </button>
                </form>
              </div>
            </details>
          </td>
        </tr>
      )}
    </tbody>
  );
}

export function EventTiersSection({
  eventId,
  initialTiers,
}: {
  eventId: string;
  initialTiers: AdminTicketTier[];
}) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const count = initialTiers.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Ticket tiers</h2>
          <p className="mt-1 max-w-xl text-[14px] text-stone-500">
            Products shown at checkout. Early bird rules are enforced by the API when selling tickets.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
         
          <button
            type="button"
            onClick={() => setShowAddPanel(true)}
            className="shrink-0 rounded-md border border-stone-300 bg-white px-3 py-2 text-[14px] font-medium text-stone-800 hover:bg-stone-50"
          >
            {count === 0 ? 'Add tier' : 'Add another tier'}
          </button>
        </div>
      </div>

      <TierSlideout open={showAddPanel} title="New tier" onClose={() => setShowAddPanel(false)}>
        <AddTierForm eventId={eventId} onDone={() => setShowAddPanel(false)} />
      </TierSlideout>

      {count === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <EmptyTiersIllustration />
          <p className="mt-4 text-[15px] font-medium text-stone-700">No ticket tiers yet</p>
          <p className="mt-1 max-w-sm text-[14px] text-stone-500">
            Create at least one tier before customers can register and pay.
          </p>
          <button
            type="button"
            onClick={() => setShowAddPanel(true)}
            className="mt-6 rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800"
          >
            Add your first tier
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-stone-200 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                <th className="pb-2 pr-4 font-medium">Tier</th>
                <th className="pb-2 pr-4 font-medium">Price</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium">Sold</th>
                <th className="pb-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            {initialTiers.map((tier) => (
              <TierRow key={tierId(tier)} tier={tier} eventId={eventId} />
            ))}
          </table>
        </div>
      )}
    </div>
  );
}
