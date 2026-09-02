'use client';

import { useMemo, useState } from 'react';

const fieldClass =
  'w-full rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[15px] text-stone-900 outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-900/10';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-stone-700';

type VolumeDiscountValue = {
  minimumQuantity: number;
  percentage: number;
};

type DiscountDraft = {
  id: string;
  minimumQuantityText: string;
  percentageText: string;
};

type Props = {
  name?: string;
  initialDiscounts?: VolumeDiscountValue[];
  idPrefix?: string;
};

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `discount-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function discountDraft(discount: VolumeDiscountValue): DiscountDraft {
  return {
    id: newId(),
    minimumQuantityText: String(discount.minimumQuantity),
    percentageText: String(discount.percentage),
  };
}

export function VolumeDiscountEditor({ name = 'volumeDiscounts', initialDiscounts = [], idPrefix = 'volume-discount' }: Props) {
  const [discounts, setDiscounts] = useState<DiscountDraft[]>(() => initialDiscounts.map(discountDraft));

  const duplicateMinimums = useMemo(() => {
    const counts = new Map<string, number>();
    for (const discount of discounts) {
      const minimum = discount.minimumQuantityText.trim();
      if (minimum) counts.set(minimum, (counts.get(minimum) ?? 0) + 1);
    }
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([minimum]) => minimum));
  }, [discounts]);

  const serializedDiscounts = useMemo(
    () =>
      JSON.stringify(
        discounts.map((discount) => ({
          minimumQuantity: Number(discount.minimumQuantityText),
          percentage: Number(discount.percentageText),
        })),
      ),
    [discounts],
  );

  function updateDiscount(id: string, field: 'minimumQuantityText' | 'percentageText', value: string) {
    setDiscounts((current) =>
      current.map((discount) => {
        if (discount.id !== id) return discount;
        return { ...discount, [field]: value };
      }),
    );
  }

  return (
    <div
      className="space-y-3"
      onSubmit={(event) => {
        if (duplicateMinimums.size > 0) event.preventDefault();
      }}
    >
      <div>
        <p className={labelClass}>
          Bulk purchase discounts <span className="font-normal text-stone-400">(optional)</span>
        </p>
        <p className="text-[12px] text-stone-500">
          Give a percentage discount when a customer buys at least a specified number of tickets. For example, 5
          tickets at 10% off.
        </p>
      </div>

      {discounts.length > 0 ? (
        <div className="space-y-3">
          {discounts.map((discount, index) => {
            const rowId = `${idPrefix}-${discount.id}`;
            const duplicate = duplicateMinimums.has(discount.minimumQuantityText.trim());
            return (
              <fieldset key={discount.id} className="rounded-md border border-stone-200 bg-stone-50/60 p-3">
                <legend className="px-1 text-[13px] font-medium text-stone-800">Discount {index + 1}</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor={`${rowId}-quantity`}>Minimum tickets</label>
                    <input
                      id={`${rowId}-quantity`}
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={discount.minimumQuantityText}
                      onChange={(event) => updateDiscount(discount.id, 'minimumQuantityText', event.target.value)}
                      aria-invalid={duplicate || undefined}
                      className={fieldClass}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`${rowId}-percentage`}>Discount percentage</label>
                    <div className="relative">
                      <input
                        id={`${rowId}-percentage`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        required
                        value={discount.percentageText}
                        onChange={(event) => updateDiscount(discount.id, 'percentageText', event.target.value)}
                        className={`${fieldClass} pr-8`}
                        placeholder="10"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-stone-500">%</span>
                    </div>
                  </div>
                </div>
                {duplicate ? (
                  <p className="mt-2 text-[12px] text-red-700" role="alert">
                    Each minimum ticket quantity must be unique.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDiscounts((current) => current.filter((entry) => entry.id !== discount.id))}
                  className="mt-3 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 hover:bg-stone-100"
                >
                  Remove discount
                </button>
              </fieldset>
            );
          })}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-stone-200 px-3 py-3 text-[13px] text-stone-500">
          No bulk discount configured.
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          setDiscounts((current) => [
            ...current,
            {
              id: newId(),
              minimumQuantityText: '',
              percentageText: '',
            },
          ])
        }
        className="rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50"
      >
        Add discount
      </button>

      <input type="hidden" name={name} value={serializedDiscounts} readOnly />
    </div>
  );
}
