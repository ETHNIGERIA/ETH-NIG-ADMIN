'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createDiscountAction,
  deleteDiscountAction,
  type DiscountActionState,
} from '@/tickets-portal/actions/discounts';
import type { AdminDiscount } from '@/tickets-portal/types/admin-discounts';
import { formatMinorToNgn } from '@/tickets-portal/lib/format-money';
import { toDatetimeLocalValue } from '@/tickets-portal/lib/datetime-local';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

function ActionError({ state }: { state: DiscountActionState }) {
  if (!state?.error) return null;
  return (
    <p className="rounded-md border border-red-200 bg-red-50/90 px-3 py-2 text-[13px] text-red-900">
      {state.error}
    </p>
  );
}

function discountLabel(d: AdminDiscount) {
  return d.type === 'percentage' ? `${d.value}%` : formatMinorToNgn(d.value);
}

export function EventDiscountsManager({
  eventId,
  eventName,
  discounts,
}: {
  eventId: string;
  eventName: string;
  discounts: AdminDiscount[];
}) {
  const router = useRouter();
  const [pendingDel, startDel] = useTransition();
  const [createKey, setCreateKey] = useState(0);

  const [cState, cAction] = useActionState(createDiscountAction, undefined);

  useEffect(() => {
    if (cState?.ok) {
      setCreateKey((k) => k + 1);
      router.refresh();
    }
  }, [cState?.ok, router]);

  const th = 'px-4 py-3 text-left text-[12px] font-medium text-stone-400';
  const td = 'px-4 py-3 text-[14px] text-stone-700';
  const wrap =
    'overflow-x-auto overflow-hidden rounded-lg border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

  const defaultUntil = () => {
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    return toDatetimeLocalValue(end.toISOString());
  };

  const defaultFrom = () => toDatetimeLocalValue(new Date().toISOString());

  return (
    <div className="space-y-10">
      <p className="text-[14px] text-stone-600">
        Discount codes are separate from influencer/community promo codes. They apply only when checkout integrates this
        flow ({eventName}).
      </p>

      <section className={wrap}>
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-stone-100">
              <th className={th}>Code</th>
              <th className={th}>Value</th>
              <th className={`${th} hidden md:table-cell`}>Window</th>
              <th className={th}>Uses</th>
              <th className={th}>Active</th>
              <th className={`${th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {discounts.length === 0 ? (
              <tr>
                <td colSpan={6} className={`${td} py-14 text-center text-stone-400`}>
                  No discounts for this event.
                </td>
              </tr>
            ) : (
              discounts.map((d) => (
                <tr key={d._id} className="border-b border-stone-100 last:border-0">
                  <td className={`${td} font-mono text-[13px] font-medium text-stone-900`}>{d.code}</td>
                  <td className={td}>{discountLabel(d)}</td>
                  <td className={`${td} hidden text-[12px] text-stone-500 md:table-cell`}>
                    {new Date(d.validFrom).toLocaleString()} — {new Date(d.validUntil).toLocaleString()}
                  </td>
                  <td className={`${td} tabular-nums text-[13px]`}>
                    {d.usedCount}
                    {d.maxUses != null ? ` / ${d.maxUses}` : ''}
                  </td>
                  <td className={td}>{d.isActive ? 'Yes' : 'No'}</td>
                  <td className={`${td} text-right`}>
                    <button
                      type="button"
                      disabled={pendingDel}
                      className="text-[13px] font-medium text-red-800 underline-offset-4 hover:underline disabled:opacity-50"
                      onClick={() => {
                        if (!window.confirm(`Delete discount “${d.code}”?`)) return;
                        const fd = new FormData();
                        fd.set('discountId', d._id);
                        fd.set('eventId', eventId);
                        startDel(async () => {
                          const r = await deleteDiscountAction(undefined, fd);
                          if (r?.error) window.alert(r.error);
                          else router.refresh();
                        });
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-stone-900">Create discount</h2>
        <ActionError state={cState} />
        <form key={createKey} action={cAction} className="grid gap-4 rounded-lg border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <input type="hidden" name="eventId" value={eventId} />
          <div>
            <label className={labelClass} htmlFor="d-code">
              Code
            </label>
            <input id="d-code" name="code" required className={fieldClass} placeholder="SUMMER26" />
          </div>
          <div>
            <label className={labelClass} htmlFor="d-type">
              Type
            </label>
            <select id="d-type" name="type" required className={fieldClass} defaultValue="percentage">
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed (NGN)</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="d-value">
              Value
            </label>
            <input id="d-value" name="value" type="number" min={0} step={0.01} required className={fieldClass} />
            <p className="mt-1 text-[12px] text-stone-500">
              Percentage 0-100, or fixed amount in Naira
            </p>
          </div>
          <div>
            <label className={labelClass} htmlFor="d-max">
              Max uses (optional)
            </label>
            <input id="d-max" name="maxUses" type="number" min={0} step={1} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="d-from">
              Valid from
            </label>
            <input
              id="d-from"
              name="validFrom"
              type="datetime-local"
              required
              defaultValue={defaultFrom()}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="d-until">
              Valid until
            </label>
            <input
              id="d-until"
              name="validUntil"
              type="datetime-local"
              required
              defaultValue={defaultUntil()}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-[14px] text-stone-700">
              <input type="checkbox" name="isActive" defaultChecked className="rounded border-stone-300" />
              Active
            </label>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-stone-800"
            >
              Create discount
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
